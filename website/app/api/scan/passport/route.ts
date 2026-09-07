import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const scanSchema = z.object({
  /** Base64 data URL of the passport image. */
  image: z.string().min(1, "Image is required"),
  /**
   * Pre-extracted OCR text (skips the server-side OCR step).
   * In practice the client runs Tesseract.js in the browser and posts
   * the recognized text here, since Tesseract's ~43MB WASM bundle is
   * incompatible with Vercel serverless function cold-starts and
   * execution timeouts.
   */
  ocrText: z.string().optional(),
});

interface ScannedPassport {
  /** Full OCR text — useful for debugging / transparency. */
  ocrText: string;
  /** True when the OCR text contained enough passport-like markers to suggest a real MRZ. */
  hasMrz: boolean;
  /** Extracted fields. All are best-effort and may be null. */
  fields: {
    fullName: string | null;
    surname: string | null;
    givenNames: string | null;
    documentNumber: string | null;
    documentType: string | null;       // "P" for passport
    issuingCountry: string | null;    // 3-letter ISO
    nationality: string | null;        // 3-letter ISO
    dateOfBirth: string | null;       // ISO YYYY-MM-DD
    sex: string | null;                // "M" / "F"
    expiryDate: string | null;        // ISO YYYY-MM-DD
    dateOfIssue: string | null;
    placeOfBirth: string | null;
    personalNumber: string | null;     // optional second-line field
  };
}

// ──────────────────────────────────────────────
// OCR helper (shared with /api/scan/itinerary)
// ──────────────────────────────────────────────
function parseDataUrl(dataUrl: string): { base64: string; mime: string } | null {
  const m = dataUrl.match(/^data:image\/(png|jpe?g|webp|bmp|gif|tiff?);base64,(.+)$/i);
  if (!m) return null;
  return { mime: m[1].toLowerCase(), base64: m[2] };
}

async function runOcr(_dataUrl: string, ocrText?: string): Promise<string> {
  // Server-side OCR is intentionally NOT performed here.
  // Tesseract.js is ~43MB (WASM + language data) and:
  //   - Exceeds Vercel serverless function cold-start budgets
  //   - Blows past the 10s Hobby / 60s Pro execution timeout on most images
  //   - Increases bundle size beyond the 250MB unzipped limit
  //
  // The client runs Tesseract.js in the browser (see lib/passport-ocr.ts)
  // and ships the resulting text via the optional `ocrText` field. This
  // function is now a thin pass-through: if the client already ran OCR we
  // just return the trimmed text, otherwise the MRZ parser will receive
  // an empty string and `hasMrz` will be false (callers can decide to
  // fall back to manual entry or a cloud OCR service).
  return (ocrText || "").trim();
}

// ──────────────────────────────────────────────
// Passport field extractors
// ──────────────────────────────────────────────
const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2,
  mar: 3, march: 3, apr: 4, april: 4, may: 5,
  jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9, oct: 10, october: 10,
  nov: 11, november: 11, dec: 12, december: 12,
};

/** "25 DEC 1990", "25-Dec-1990", "25 Dec 1990", "25/12/1990" → ISO YYYY-MM-DD */
function parseDateString(s: string | null): string | null {
  if (!s) return null;
  const t = s.trim();
  // ISO already
  const iso = t.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  // DD MMM YYYY
  const m1 = t.match(/(\d{1,2})[\s\-\/]([A-Za-z]+)[\s\-\/](\d{4})/);
  if (m1) {
    const month = MONTHS[m1[2].toLowerCase().slice(0, 3)];
    if (month) return `${m1[3]}-${String(month).padStart(2, "0")}-${m1[1].padStart(2, "0")}`;
  }
  // MMM DD YYYY
  const m2 = t.match(/([A-Za-z]+)[\s\-\/](\d{1,2})[\s\-\/](\d{4})/);
  if (m2) {
    const month = MONTHS[m2[1].toLowerCase().slice(0, 3)];
    if (month) return `${m2[3]}-${String(month).padStart(2, "0")}-${m2[2].padStart(2, "0")}`;
  }
  return t; // Return raw text if we can't parse — UI can show as raw
}

// ──────────────────────────────────────────────
// Generic label-then-value helper
// ──────────────────────────────────────────────

/**
 * Search the OCR text for a line that matches one of `labelRegexes`, then
 * return the first value matching `valueRegex` within `window` lines
 * AFTER the label (or on the same line). Returns capture group 1 if
 * `valueRegex` has one, otherwise the whole match.
 */
function findValueAfterLabel(
  text: string,
  labelRegexes: RegExp[],
  valueRegex: RegExp,
  window: number = 1,
): string | null {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const label of labelRegexes) {
      if (!label.test(line)) continue;
      const sameLine = line.match(valueRegex);
      if (sameLine) return ((sameLine[1] ?? sameLine[0]) as string).trim();
      for (let j = 1; j <= window && i + j < lines.length; j++) {
        const next = lines[i + j];
        const m = next.match(valueRegex);
        if (m) return ((m[1] ?? m[0]) as string).trim();
      }
    }
  }
  return null;
}

// ──────────────────────────────────────────────
// Field extractors
// ──────────────────────────────────────────────

/**
 * Passport number. Order of preference:
 *  1. Within 1-2 lines after a "DOCUMENT No." / "Passport No." / "No. du
 *     document" / "Passeport No." label (the bio-page visual zone).
 *  2. MRZ-style "P<CCCNNNNNNN>" pattern.
 *  3. First 6-12 char alphanumeric run that has both letters and digits.
 */
function findDocumentNumber(text: string): string | null {
  const labelled = findValueAfterLabel(
    text,
    [
      /document\s*no\.?/i,
      /passport\s*no\.?/i,
      /no\.?\s*du\s*document/i,
      /passeport\s*no\.?/i,
      /no\.\s*passport/i,
    ],
    /\b([A-Z]?\d{6,9}|[A-Z]\d{6,8}|[A-Z]{1,2}\d{6,8})\b/i,
    2,
  );
  if (labelled) return labelled.toUpperCase();

  const mrz = text.match(/\bP[A-Z0-9<]{8,9}\b/);
  if (mrz) return mrz[0].replace(/<+$/, "");

  const candidates = text.match(/\b[A-Z0-9]{6,12}\b/g) || [];
  const real = candidates.filter((c) => /[A-Z]/.test(c) && /\d/.test(c) && c.length >= 7);
  return real[0] || null;
}

/**
 * Pull a person's name from OCR text. ICAO-style passports list surname on
 * one line and given names on the next. OCR often mangles the surrounding
 * punctuation ("| : SHAPIRO |", "B+ ILIA"), so we:
 *  - Strip leading/trailing non-letter noise from each line.
 *  - Accept single-word lines (surname only) AND 2-3 word lines.
 *  - Skip lines that contain non-name keywords.
 *  - Prefer the candidate with the most words (i.e. "SURNAME GIVEN").
 */
function findName(text: string): string | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const SKIP = /passport|document|national|date|birth|expiry|sex|male|female|number|authority|émetteur|emitting|state|code|type|holder|signature|place|issuing|expir|valid/i;

  // Extract just the capitalized-word run from each line.
  const cleaned = lines.map((line) => {
    if (SKIP.test(line)) return "";
    const m = line.match(/[A-Za-z][A-Za-z'’\-]*(?:\s+[A-Za-z][A-Za-z'’\-]*){0,3}/);
    return m ? m[0].trim() : "";
  }).filter((s) => s.length >= 2);

  const titleCase = (s: string) =>
    s.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

  // Same lines as text but trimmed - used for ICAO detection.
  const originalLines = text.split(/\r?\n/).map((l) => l.trim());

  const candidates = cleaned
    .filter((s) => /^[A-Z][A-Z'’\-]*(?:\s+[A-Z][A-Z'’\-]*){0,3}$/.test(s))
    .map(titleCase);

  if (candidates.length === 0) return null;

  // ICAO layout: surname on one line, given names on the next.
  // Only consider a line as a "name" line if it contains EXACTLY
  // ONE whitespace-separated token that is fully uppercase and
  // >= 2 chars long. Tokenize by whitespace, strip leading/trailing
  // non-alpha characters (e.g. "| : SHAPIRO |" -> "SHAPIRO"), and
  // require that the stripped result is all-caps.
  const allCapsLineIdx: number[] = [];
  for (let i = 0; i < originalLines.length; i++) {
    const line = originalLines[i];
    if (SKIP.test(line)) continue;
    // Split by whitespace, strip leading/trailing non-alpha from
    // each token, and keep only tokens that are fully uppercase
    // and >= 2 chars. If the line has exactly ONE such token,
    // it's a name candidate.
    const tokens = line.split(/\s+/);
    const nameTokens = tokens
      .map((t) => t.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, ""))
      .filter((t) => t.length >= 2 && /^[A-Z][A-Z'’\-]*$/.test(t));
    if (nameTokens.length === 1) allCapsLineIdx.push(i);
  }
  for (let k = 0; k < allCapsLineIdx.length - 1; k++) {
    const a = allCapsLineIdx[k];
    const b = allCapsLineIdx[k + 1];
    if (b - a === 1) {
      const cleanToken = (line: string) =>
        line.split(/\s+/)
          .map((t) => t.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, ""))
          .filter((t) => t.length >= 2 && /^[A-Z][A-Z'\-]*$/.test(t))[0];
      const givenRaw = cleanToken(originalLines[b])!;
      const surnameRaw = cleanToken(originalLines[a])!;
return `${titleCase(givenRaw)} ${titleCase(surnameRaw)}`.trim();
    }
  }

  // Fall back to the multi-word sorter: prefer the candidate with the most
  // words; break ties by length. This catches passports where the OCR
  // jammed surname + given names onto one line.
  candidates.sort((a, b) => {
    const wa = a.split(/\s+/).length;
    const wb = b.split(/\s+/).length;
    return wb - wa || b.length - a.length;
  });
  return candidates[0];
}

/** ISO 3-letter country codes are common in MRZ; longer country names are mapped to ISO via a small table. */
const COUNTRY_NAME_TO_ISO: Record<string, string> = {
  australia: "AUS",
  indonesia: "IDN",
  states: "USA",
  kingdom: "GBR",
  singapore: "SGP",
  japan: "JPN",
  germany: "DEU",
  france: "FRA",
  netherlands: "NLD",
  malaysia: "MYS",
  thailand: "THA",
  zealand: "NZL",
  canada: "CAN",
  italy: "ITA",
  spain: "ESP",
  india: "IND",
  china: "CHN",
  rep: "KOR",
  of: "KOR",
  korea: "KOR",
  brazil: "BRA",
  mexico: "MEX",
  russia: "RUS",
  turkey: "TUR",
  vietnam: "VNM",
  philippines: "PHL",
  emirates: "ARE",
  saudi: "SAU",
  egypt: "EGY",
  pakistan: "PAK",
  lanka: "LKA",
  bangladesh: "BGD",
  myanmar: "MMR",
  switzerland: "CHE",
  austria: "AUT",
  belgium: "BEL",
  poland: "POL",
  sweden: "SWE",
  norway: "NOR",
  denmark: "DNK",
  finland: "FIN",
  ireland: "IRL",
  portugal: "PRT",
  greece: "GRC"
};

/**
 * Look up nationality. Tries in order:
 *  1. Value within 2 lines after a "Nationality" / "Nationalité" label.
 *  2. First standalone country name (e.g. "AUSTRALIA") found in the OCR
 *     text — covers passports where the label is missing.
 *  3. The 3-letter ISO code if found in a curated list.
 */
function findNationality(text: string): string | null {
  const labelled = findValueAfterLabel(
    text,
    [/nationalit[éy]/i, /citizenship/i],
    /([A-Za-z][A-Za-z\s]{2,30})/,
    2,
  );
  if (labelled) {
    const name = labelled.trim().split(/\s+/).slice(0, 2).join(" ");
    return COUNTRY_NAME_TO_ISO[name.toLowerCase()] || name.toUpperCase();
  }

  const lower = text.toLowerCase();
  for (const [name, iso] of Object.entries(COUNTRY_NAME_TO_ISO)) {
    if (name.length < 4) continue;
    const re = new RegExp(`\\b${name}\\b`, "i");
    if (re.test(lower)) return iso;
  }

  const knownIso = /(AUS|USA|GBR|FRA|DEU|ITA|ESP|JPN|CHN|IND|IDN|NZL|CAN|MYS|THA|PHL|SGP|KOR|BRA|MEX|RUS|TUR|VNM|ARE|SAU|EGY|PAK|LKA|BGD|MMR|CHE|AUT|BEL|POL|SWE|NOR|DNK|FIN|IRL|PRT|GRC)/;
  const iso = text.match(knownIso);
  return iso ? iso[1] : null;
}

/**
 * Find a date within `window` lines AFTER any of the supplied labels.
 * Accepts "DD MMM YYYY", "DD/MM/YYYY", "DD-MM-YYYY" and ISO "YYYY-MM-DD".
 * As a last resort, returns the first "DD MMM YYYY"-shaped date in the
 * whole text (often the date of birth on passports that have no label).
 */
function findDateByLabel(text: string, labels: string[], window: number = 2): string | null {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const label of labels) {
      const re = new RegExp(label, "i");
      if (!re.test(line)) continue;
      const sameLine = line.match(/([0-9]{1,2}[\s\-\/\.][A-Za-z]+[\s\-\/\.][0-9]{2,4}|[0-9]{4}-[0-9]{1,2}-[0-9]{1,2})/);
      if (sameLine) return parseDateString(sameLine[1]);
      for (let j = 1; j <= window && i + j < lines.length; j++) {
        const next = lines[i + j];
        const m = next.match(/([0-9]{1,2}[\s\-\/\.][A-Za-z]+[\s\-\/\.][0-9]{2,4}|[0-9]{4}-[0-9]{1,2}-[0-9]{1,2})/);
        if (m) return parseDateString(m[1]);
      }
    }
  }
  const all = [...text.matchAll(/([0-9]{1,2}[\s\-\/\.][A-Za-z]+[\s\-\/\.][0-9]{4})/g)];
  if (all.length > 0) return parseDateString(all[0][1]);
  return null;
}

/**
 * Sex. Looks for "M" or "F" within 2 lines after "Sex" / "Sexe" / "Gender".
 */
function findSex(text: string): string | null {
  const labelled = findValueAfterLabel(
    text,
    [/\bsex\b/i, /sexe/i, /\bgender\b/i],
    /\b([MF])\b/,
    2,
  );
  if (labelled) return labelled.toUpperCase();
  return null;
}

/**
 * Place of birth. Looks within 2 lines after "Place of birth" /
 * "Lieu de naissance" / "Birth place". Skips the same-line
 * label words (e.g. "Sex" / "M" / "F" / "Lieu" / "Place") and
 * returns the first real place name found on the following lines.
 */
function findPlace(text: string): string | null {
  const LABELS = [/place of birth/i, /lieu de naissance/i, /birth place/i];
  const lines = text.split(/\r?\n/);

  // 1) Find the label line index.
  let labelIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    for (const label of LABELS) {
      if (label.test(lines[i])) { labelIdx = i; break; }
    }
    if (labelIdx >= 0) break;
  }
  if (labelIdx < 0) return null;

  // 2) Look at the window lines AFTER the label for a real
  //    place name. Require at least 2 consecutive capitalized
  //    words (e.g. "NEW YORK", "YAROSLAVL" single word is fine).
  const valueRegex = /(?:^|\s)([A-Z][a-zA-Z]+(?:[\s,\-][A-Z][a-zA-Z]+){0,4})(?:\s|$)/;
  for (let j = 1; j <= 2 && labelIdx + j < lines.length; j++) {
    const next = lines[labelIdx + j];
    const m = next.match(valueRegex);
    if (!m) continue;
    const trimmed = m[1].trim();
    // Reject label-like words.
    if (/^(?:Sex|Sexe|Gender|M|F|Male|Female|Lieu|Place|Lieux|Birth|Naissance)$/i.test(trimmed)) continue;
    return trimmed.split(/,|;/)[0].trim();
  }
  return null;
}

/** Detect presence of Machine-Readable Zone (2 lines of OCR-cleaned passport data). */
function detectMrz(text: string): boolean {
  // MRZ is typically 2 lines of 44 characters, mostly A-Z, 0-9, and `<`
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\s/g, "")).filter((l) => l.length >= 30);
  const mrzLike = lines.filter((l) => /^[A-Z0-9<]{30,}$/.test(l)).length;
  return mrzLike >= 1;
}

// ──────────────────────────────────────────────
// Route handler
// ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = scanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { image, ocrText: clientOcrText } = parsed.data;
    if (!image.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Invalid image format — expected base64 data URL" },
        { status: 400 }
      );
    }

    // Prefer client-extracted OCR text (Tesseract.js in the browser) when
    // supplied. The server has no OCR engine — see runOcr for the rationale.
    const ocrText = await runOcr(image, clientOcrText);

    // Bilingual label lists (English + French). Australian, Canadian, EU
    // and several other passports use both languages in the visual zone.
    const DOB_LABELS    = ["date of birth", "date de naissance", "birth date", "dob"];
    const EXPIRY_LABELS = ["date of expiry", "date d'expiration", "expiry date", "expiry", "valid until", "date of expiration"];
    const ISSUE_LABELS  = ["date of issue", "date de délivrance", "issue date", "issued on"];

    // Strip leading/trailing non-MRZ noise from each line so the MRZ parser
    // isn't fooled by stray "~~" prefixes or trailing ";". The MRZ alphabet
    // is [A-Z0-9<] so anything else is junk.
    const cleanedText = ocrText
      .split(/\r?\n/)
      .map((l) => l.replace(/^[^A-Z0-9<]+/i, "").replace(/[^A-Z0-9<]+$/i, ""))
      .join("\n");

    const hasMrz = detectMrz(cleanedText);

    // 1) Try the strict ICAO MRZ parser first on the cleaned text.
    const mrzLines = extractMrz(cleanedText);
    let mrzData: ReturnType<typeof parseMrz> = null;
    if (mrzLines) {
      const candidate = parseMrz(mrzLines.line1, mrzLines.line2);
      // Validate the MRZ result: corrupted OCR produces fields with
      // "<", excessive length, or no letters. Discard and fall back
      // to the heuristic extractors when the MRZ looks garbled.
      const isValidMrz =
        candidate &&
        candidate.surname.length >= 2 &&
        candidate.surname.length <= 30 &&
        !candidate.surname.includes("<") &&
        /^[A-Za-z'\-]+$/.test(candidate.surname) &&
        candidate.givenNames.length >= 2 &&
        candidate.givenNames.length <= 30 &&
        !candidate.givenNames.includes("<") &&
        /^[A-Za-z'\-]+$/.test(candidate.givenNames) &&
        candidate.documentNumber.length >= 6 &&
        /[A-Z]/.test(candidate.documentNumber) &&
        /\d/.test(candidate.documentNumber);
      if (isValidMrz) mrzData = candidate;
    }

    // 2) Heuristic extractors over the raw OCR text (visual zone labels).
    //    If the MRZ parser was validated (clean ICAO MRZ), prefer its
    //    canonical fields. Otherwise fall back entirely to the
    //    heuristic extractors which handle noisy visual-zone text.
    const fullName = mrzData
      ? [mrzData.givenNames, mrzData.surname].filter(Boolean).join(" ").trim()
      : findName(ocrText);

    const fields = {
      fullName: fullName || null,
      surname: mrzData?.surname || null,
      givenNames: mrzData?.givenNames || null,
      documentNumber: mrzData?.documentNumber || findDocumentNumber(ocrText) || null,
      documentType: mrzData?.documentType || "P",
      issuingCountry: mrzData?.issuingCountry || findNationality(ocrText) || null,
      nationality: mrzData?.nationality || findNationality(ocrText) || null,
      dateOfBirth: mrzData?.dateOfBirth || findDateByLabel(ocrText, DOB_LABELS) || null,
      sex: mrzData?.sex || findSex(ocrText) || null,
      expiryDate: mrzData?.expiryDate || findDateByLabel(ocrText, EXPIRY_LABELS) || null,
      dateOfIssue: findDateByLabel(ocrText, ISSUE_LABELS) || null,
      placeOfBirth: findPlace(ocrText) || null,
      personalNumber: mrzData?.personalNumber || null,
    };

    const result: ScannedPassport = {
      ocrText,
      fields,
      hasMrz,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[scan/passport]", error);
    return NextResponse.json(
      { error: "Failed to scan passport" },
      { status: 500 }
    );
  }
}

// ──────────────────────────────────────────────
// TD3 MRZ parser (ICAO 9303) — used for passports
// Two lines, each 44 characters:
//   Line 1: P<issuing_country><surname><<<given_names<<<<<<<<<<<<<<<<<
//   Line 2: <doc_number><check_digit><nationality><dob><check_digit><sex><expiry><check_digit><personal_no><check_digit>
// ──────────────────────────────────────────────

interface MrzData {
  documentType: string;     // usually "P" for passport
  issuingCountry: string;   // 3-letter ISO code
  surname: string;
  givenNames: string;
  documentNumber: string;
  nationality: string;       // 3-letter ISO code
  dateOfBirth: string | null;   // YYYY-MM-DD
  sex: string | null;           // "M" or "F"
  expiryDate: string | null;    // YYYY-MM-DD
  personalNumber: string;       // optional
}

function mrzDateToIso(yymmdd: string, pivot: number): string | null {
  if (!yymmdd || yymmdd.length < 6) return null;
  const yy = parseInt(yymmdd.slice(0, 2), 10);
  const mm = parseInt(yymmdd.slice(2, 4), 10);
  const dd = parseInt(yymmdd.slice(4, 6), 10);
  if (isNaN(yy) || isNaN(mm) || isNaN(dd)) return null;
  // Pivot: for DOB, pivot year is current-25..current+25; for expiry, pivot+25 years
  // We use a simple "current year" approach and let the caller add years
  const year = 2000 + yy;
  // For expiry date (valid until), adjust if too far in the past
  if (pivot) {
    const now = new Date().getFullYear();
    if (year < now - pivot) return `${year + 100}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  }
  return `${year}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

/** Parse two MRZ lines into structured data. Returns null if the lines don't look like MRZ. */
function parseMrz(line1: string, line2: string): MrzData | null {
  // Normalize: remove whitespace, must be A-Z/0-9/<, lines must be 44 chars
  const l1 = line1.replace(/\s/g, "").toUpperCase();
  const l2 = line2.replace(/\s/g, "").toUpperCase();
  if (l1.length < 30 || l2.length < 30) return null;
  if (l1[0] !== "P") return null;
  // Lines 1 and 2 must start with valid MRZ chars
  if (!/^[A-Z0-9<]{30,}$/.test(l1) || !/^[A-Z0-9<]{30,}$/.test(l2)) return null;

  const issuingCountry = l1.slice(2, 5);
  // Names section: after country code, padded with `<`
  const namesPart = l1.slice(5); // e.g. "SHAPIRO<<ILIA<<<<<<<<<<<<<<<<<<<<<<<<<<"
  const doubleAngle = namesPart.indexOf("<<");
  let surname = "";
  let givenNames = "";
  if (doubleAngle >= 0) {
    surname = namesPart.slice(0, doubleAngle).replace(/<+$/g, "").trim();
    givenNames = namesPart.slice(doubleAngle + 2).replace(/<+$/g, "").trim();
  }

  const documentNumber = l2.slice(0, 9).replace(/<+$/g, "");
  const nationality = l2.slice(10, 13);
  const dobRaw = l2.slice(13, 19);
  const dateOfBirth = mrzDateToIso(dobRaw, 0);
  const sex = l2.slice(20, 21);
  const expiryRaw = l2.slice(21, 27);
  const expiryDate = mrzDateToIso(expiryRaw, 1);
  // Personal number: until final check digit; in many passports it's all `<`
  const personalNumber = l2.slice(28, 42).replace(/<+$/g, "");

  return {
    documentType: l1[0],
    issuingCountry,
    surname,
    givenNames,
    documentNumber,
    nationality,
    dateOfBirth,
    sex: sex === "M" || sex === "F" ? sex : null,
    expiryDate,
    personalNumber,
  };
}

/** Find the 2 MRZ lines in the OCR output. The MRZ is typically the last 2 lines. */
function extractMrz(text: string): { line1: string; line2: string } | null {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s/g, "").toUpperCase())
    .filter((l) => l.length >= 30 && /^[A-Z0-9<]+$/.test(l));
  // Look for two consecutive lines that look like MRZ (start with P< and are 30+ chars)
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].startsWith("P<") && lines[i + 1].length >= 30) {
      return { line1: lines[i], line2: lines[i + 1] };
    }
  }
  return null;
}
