import { NextRequest, NextResponse } from "next/server";
import { COUNTRIES, AIRPORTS } from "@/lib/data/airports";
import { z } from "zod";

const scanSchema = z.object({
  /** Base64 data URL of the itinerary image. */
  image: z.string().min(1, "Image is required"),
  /** Optional pre-extracted text (skips the OCR step). Useful as a fallback
   *  or when running tests. */
  textHint: z.string().optional(),
});

interface ScannedItinerary {
  title: string | null;
  description: string | null;
  imageUrls: string[];
  price: string | null;
  currency: string | null;
  category: string | null;
  siteName: string | null;
  country: string | null;
  city: string | null;
  /** From + to + dates extracted from the itinerary. */
  fromCountry: string | null;
  fromCity: string | null;
  toCountry: string | null;
  toCity: string | null;
  departDate: string | null;  // ISO YYYY-MM-DD
  returnDate: string | null;
  confidence: number; // 0..1
  ocrText: string;
  hasImage: boolean;
}

// ──────────────────────────────────────────────
// OCR helper
// ──────────────────────────────────────────────

/**
 * Strip the `data:image/<mime>;base64,` prefix that browsers add to file
 * reads and return raw base64 + mime type.
 */
function parseDataUrl(dataUrl: string): { base64: string; mime: string } | null {
  const m = dataUrl.match(/^data:image\/(png|jpe?g|webp|bmp|gif|tiff?);base64,(.+)$/i);
  if (!m) return null;
  return { mime: m[1].toLowerCase(), base64: m[2] };
}

/**
 * NOTE: Server-side OCR is intentionally NOT performed here.
 *
 * Tesseract.js is ~43MB (includes language data + WASM) which:
 *  - Exceeds Vercel serverless function cold-start budgets
 *  - Blows past the 10s Hobby / 60s Pro execution timeout on most images
 *  - Increases bundle size beyond the 250MB unzipped limit
 *
 * For production OCR, route the image to a dedicated OCR service
 * (Google Cloud Vision, AWS Textract, or a self-hosted worker).
 * For now, the endpoint accepts an optional `textHint` from the client
 * (copy-paste from the itinerary) so users can still populate the fields
 * without server OCR.
 *
 * Returns the supplied `textHint` trimmed, or empty string.
 */
async function runOcr(_dataUrl: string, textHint?: string): Promise<string> {
  return (textHint || "").trim();
}

// ──────────────────────────────────────────────
// Country / city / date extractors (used post-OCR)
// ──────────────────────────────────────────────

const MONTHS: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findAllCountries(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  const seen = new Set<string>();
  for (const c of COUNTRIES) {
    const lc = c.toLowerCase();
    const re = new RegExp(`\\b${escapeRegex(lc)}\\b`, "i");
    if (re.test(lower) && !seen.has(c)) {
      seen.add(c);
      found.push(c);
    }
  }
  return found;
}

function findCity(text: string, country: string | null): string | null {
  if (!country) return null;
  const citiesInCountry = Array.from(
    new Set(AIRPORTS.filter((a) => a.country === country).map((a) => a.city))
  );
  citiesInCountry.sort((a, b) => b.length - a.length);

  const lower = text.toLowerCase();
  for (const city of citiesInCountry) {
    const re = new RegExp(`\\b${escapeRegex(city.toLowerCase())}\\b`, "i");
    if (re.test(lower)) return city;
  }
  return null;
}

function findDates(text: string): string[] {
  const results: string[] = [];
  const seen = new Set<string>();
  const add = (iso: string) => {
    if (!seen.has(iso)) { seen.add(iso); results.push(iso); }
  };

  // ISO YYYY-MM-DD
  for (const m of text.matchAll(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/g)) {
    add(`${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`);
  }

  // DD/MM/YYYY or DD-MM-YYYY
  for (const m of text.matchAll(/\b(\d{1,2})[\/-](\d{1,2})[\/-](20\d{2})\b/g)) {
    const a = parseInt(m[1], 10);
    const b = parseInt(m[2], 10);
    const y = m[3];
    if (a > 12) add(`${y}-${String(b).padStart(2, "0")}-${String(a).padStart(2, "0")}`);
    else if (b > 12) add(`${y}-${String(a).padStart(2, "0")}-${String(b).padStart(2, "0")}`);
    else add(`${y}-${String(b).padStart(2, "0")}-${String(a).padStart(2, "0")}`); // default DD/MM
  }

  // 25 Dec 2024 / 25-Dec-2024
  for (const m of text.matchAll(/\b(\d{1,2})[\s\-/]([a-z]+)[\s\-/](20\d{2})\b/gi)) {
    const day = parseInt(m[1], 10);
    const month = MONTHS[m[2].toLowerCase()];
    const y = m[3];
    if (month && day >= 1 && day <= 31) add(`${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }

  // Dec 25 2024 / December 25, 2024
  for (const m of text.matchAll(/\b([a-z]+)\s+(\d{1,2}),?\s+(20\d{2})\b/gi)) {
    const month = MONTHS[m[1].toLowerCase()];
    const day = parseInt(m[2], 10);
    const y = m[3];
    if (month && day >= 1 && day <= 31) add(`${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }

  return results.sort();
}

/**
 * Extract the FROM country/city and TO country/city from the OCR text.
 * Itineraries typically list origin then destination, so the first country
 * we find is the FROM and the last is the TO.
 */
function extractItineraryFromText(text: string): Pick<
  ScannedItinerary,
  "fromCountry" | "fromCity" | "toCountry" | "toCity" | "departDate" | "returnDate" | "confidence"
> {
  const normalized = text.replace(/\s+/g, " ");
  const countries = findAllCountries(normalized);
  const fromCountry = countries[0] || null;
  const toCountry = countries.length >= 2 ? countries[countries.length - 1] : null;

  const fromCity = findCity(normalized, fromCountry);
  const toCity = findCity(normalized, toCountry);

  const dates = findDates(normalized);
  const departDate = dates[0] || null;
  const returnDate = dates[1] || null;

  let filled = 0;
  if (fromCountry) filled++;
  if (fromCity) filled++;
  if (toCountry) filled++;
  if (toCity) filled++;
  if (departDate) filled++;
  if (returnDate) filled++;

  return {
    fromCountry, fromCity, toCountry, toCity, departDate, returnDate,
    confidence: filled / 6,
  };
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

    const { image, textHint } = parsed.data;
    const isDataUrl = image.startsWith("data:image/");
    if (!isDataUrl) {
      return NextResponse.json(
        { error: "Invalid image format — expected base64 data URL" },
        { status: 400 }
      );
    }

    // 1. If the client supplied pre-extracted text, use it directly (useful as a
    //    fallback when OCR is unavailable or as a manual copy/paste shortcut).
    // 2. Otherwise, the user can supply an optional `textHint` (copy-paste
    //    of the itinerary) which the heuristic extractors will parse.
    //    Server-side OCR via tesseract.js was removed because the 43MB WASM
    //    bundle is incompatible with Vercel serverless function cold-starts
    //    and execution timeouts.
    const ocrText = (textHint && textHint.trim().length > 0)
      ? textHint
      : await runOcr(image, textHint);

    const fields = extractItineraryFromText(ocrText);

    return NextResponse.json({
      title: null,
      description: null,
      imageUrls: [],
      price: null,
      currency: null,
      category: null,
      siteName: null,
      country: fields.fromCountry,
      city: fields.fromCity,
      ...fields,
      ocrText,
      hasImage: isDataUrl,
    });
  } catch (error) {
    console.error("[scan/itinerary]", error);
    return NextResponse.json(
      { error: "Failed to scan itinerary" },
      { status: 500 }
    );
  }
}
