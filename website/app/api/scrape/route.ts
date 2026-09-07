import { NextRequest, NextResponse } from "next/server";

interface ScrapedProduct {
  title: string | null;
  description: string | null;
  imageUrls: string[];      // all product images (carousels use this)
  price: string | null;
  currency: string | null;
  category: string | null;
  siteName: string | null;
  country: string | null;
  city: string | null;
}

/**
 * Normalize a relative URL against a base URL. Returns null if the input is not
 * a valid URL or if it cannot be resolved.
 */
function absolutizeUrl(maybeUrl: string | null | undefined, base: string): string | null {
  if (!maybeUrl) return null;
  const trimmed = maybeUrl.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("data:")) return trimmed;
  try {
    return new URL(trimmed, base).toString();
  } catch {
    return null;
  }
}

/** Extract a list of absolute image URLs from a page, deduped, in priority order:
 *  1. og:image / twitter:image (primary hero image)
 *  2. JSON-LD structured-data "image" arrays
 *  3. Heinenemann-style "image_zoom" / product gallery anchors (we grab the high-res src)
 *  4. <img> tags inside likely product containers
 *  5. CSS background-image: url(...) hints
 */
function extractAllImages(html: string, pageUrl: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (raw: string | null | undefined) => {
    const abs = absolutizeUrl(raw, pageUrl);
    if (abs && !seen.has(abs)) {
      seen.add(abs);
      out.push(abs);
    }
  };

  // Capture the primary image's alt / title from og:image so we can find all
  // matching product gallery <img> tags below.
  let primaryAlt: string | null = null;
  for (const m of html.matchAll(/<meta[^>]*(?:property|name)=["']og:image:alt["'][^>]*content=["']([^"']+)["']/gi)) {
    primaryAlt = m[1].trim();
  }
  if (!primaryAlt) {
    for (const m of html.matchAll(/<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']og:image:alt["']/gi)) {
      primaryAlt = m[1].trim();
    }
  }
  // Also try to read title from the first <img> matched later
  let fallbackAlt: string | null = null;

  // 1) Open Graph / Twitter — accept multiple tags if they exist
  for (const m of html.matchAll(/<meta[^>]*(?:property|name)=["']og:image["'][^>]*content=["']([^"']+)["']/gi)) push(m[1]);
  for (const m of html.matchAll(/<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']og:image["']/gi)) push(m[1]);
  for (const m of html.matchAll(/<meta[^>]*(?:property|name)=["']twitter:image["'][^>]*content=["']([^"']+)["']/gi)) push(m[1]);
  for (const m of html.matchAll(/<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']twitter:image["']/gi)) push(m[1]);
  for (const m of html.matchAll(/<meta[^>]*itemprop=["']image["'][^>]*content=["']([^"']+)["']/gi)) push(m[1]);
  for (const m of html.matchAll(/<meta[^>]*content=["']([^"']+)["'][^>]*itemprop=["']image["']/gi)) push(m[1]);

  // 2) JSON-LD structured data (often has "image": ["url1", "url2"])
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1]);
      const grab = (node: any) => {
        if (!node) return;
        if (Array.isArray(node.image)) node.image.forEach((u: any) => typeof u === "string" && push(u));
        else if (typeof node.image === "string") push(node.image);
        if (Array.isArray(node["@graph"])) node["@graph"].forEach(grab);
      };
      grab(data);
    } catch {}
  }

  // 3) <img> tags — find primary, then group by alt text
  const imgTagRe = /<img\b[^>]*>/gi;
  const imgTags: Array<{ tag: string; src: string | null; alt: string | null; title: string | null }> = [];
  for (const m of html.matchAll(imgTagRe)) {
    const tag = m[0];
    const srcMatch = tag.match(/(?:src|data-src|data-zoom-image|data-large|data-hi-res-src)=["']([^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/i);
    const altMatch = tag.match(/\balt=["']([^"']*)["']/i);
    const titleMatch = tag.match(/\btitle=["']([^"']*)["']/i);
    if (srcMatch) {
      imgTags.push({ tag, src: srcMatch[1], alt: altMatch ? altMatch[1] : null, title: titleMatch ? titleMatch[1] : null });
    }
  }

  // Identify the primary product image — prefer the <img> whose alt matches the og:image:alt
  // (or whose alt matches the first og:image's parent <a> if no og:image:alt is set).
  if (!primaryAlt && imgTags.length > 0) {
    for (const img of imgTags) {
      if (img.alt && img.alt.length > 2) { primaryAlt = img.alt; fallbackAlt = img.alt; break; }
    }
  }
  // If still no alt, use the longest alt we found
  if (!primaryAlt) {
    let best: string | null = null;
    for (const img of imgTags) {
      if (img.alt && (!best || img.alt.length > best.length)) best = img.alt;
    }
    primaryAlt = best;
  }

  // Push all <img> srcs that share the primary alt (case-insensitive, trimmed)
  const targetAlt = (primaryAlt || "").trim().toLowerCase();
  for (const img of imgTags) {
    const altNorm = (img.alt || "").trim().toLowerCase();
    if (targetAlt && altNorm && altNorm === targetAlt) {
      push(img.src);
    }
  }

  // 4) Heinenemann-style product gallery anchors — <a class="product__img ..."> with high-res href
  for (const m of html.matchAll(/<a[^>]*class=["'][^"']*product[^"']*img[^"']*["'][^>]*href=["']([^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/gi)) {
    push(m[1]);
  }

  // 5) Heinenemann "image_zoom" attribute
  for (const m of html.matchAll(/image_zoom=["']([^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/gi)) {
    push(m[1]);
  }

  // 6) Other <img> tags that look like products (skip generic icons)
  for (const img of imgTags) {
    const lower = (img.src || "").toLowerCase();
    if (lower.includes("logo") || lower.includes("icon") || lower.includes("1x1") || lower.includes("placeholder")) continue;
    push(img.src);
  }

  // 7) <source srcset="..."> and inline style="background-image: url(...)"
  for (const m of html.matchAll(/srcset=["']([^"']+\.(?:jpg|jpeg|png|webp))/gi)) push(m[1].split(",")[0].trim().split(" ")[0]);
  for (const m of html.matchAll(/background-image:\s*url\(["']?([^"')]+\.(?:jpg|jpeg|png|webp))/gi)) push(m[1]);

  // Filter out tracking pixels, very small icons, and obvious placeholders
  const filtered = out.filter((u) => {
    const lower = u.toLowerCase();
    if (lower.includes("1x1") || lower.includes("pixel") || lower.includes("tracker")) return false;
    if (lower.includes("logo") || lower.includes("favicon")) return false;
    if (lower.includes("placeholder") || lower.includes("loading")) return false;
    return true;
  });

  return filtered.slice(0, 12); // hard cap to keep payload reasonable  return filtered.slice(0, 12); // hard cap to keep payload reasonable
}

function extractMeta(html: string, property: string): string | null {
  // Try og: tags first
  const ogMatch = html.match(
    new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']+)["']`, "i")
  );
  if (ogMatch) return ogMatch[1];

  // Try reversed attribute order
  const revMatch = html.match(
    new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']${property}["']`, "i")
  );
  if (revMatch) return revMatch[1];

  return null;
}

function extractPrice(html: string): { price: string | null; currency: string | null } {
  // Try JSON-LD structured data
  const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of jsonLdMatches) {
    try {
      const data = JSON.parse(match[1]);
      const offers = data.offers || data.Offers || (data["@graph"] && data["@graph"][0]?.offers);
      if (offers) {
        const offer = Array.isArray(offers) ? offers[0] : offers;
        if (offer.price) return { price: String(offer.price), currency: offer.priceCurrency || null };
      }
    } catch {}
  }

  // Try meta tags
  const priceContent = extractMeta(html, "product:price:amount") || extractMeta(html, "og:price:amount");
  const currency = extractMeta(html, "product:price:currency") || extractMeta(html, "og:price:currency");
  if (priceContent) return { price: priceContent, currency };

  // Try common price patterns in HTML
  const pricePatterns = [
    /(?:price|amount)["']?\s*[:=]\s*["']?(\d+[\.,]?\d*)/i,
    /(?:USD|EUR|GBP|AUD|CAD|\$|€|£)\s*(\d+[\.,]?\d*)/i,
    /(\d+[\.,]\d{2})\s*(?:USD|EUR|GBP|AUD|CAD|\$|€|£)/i,
  ];
  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match) return { price: match[1].replace(",", "."), currency };
  }

  return { price: null, currency };
}

function extractCategory(html: string, title: string | null): string | null {
  // 1) Meta tags
  const catMeta = extractMeta(html, "product:category") || extractMeta(html, "og:category");
  if (catMeta) return catMeta;

  // 2) Breadcrumb-style structure (Heinemann, Shopify, WooCommerce, etc.)
  //    Take the SECOND-TO-LAST breadcrumb link text — the deepest category
  //    before the final product leaf. e.g. "Home > Beauty > Fragrance > Sets" → "Fragrance".
  //    We match schema.org BreadcrumbList AND generic class-based breadcrumbs.
  const crumbLabels: string[] = [];

  // 2a) JSON-LD BreadcrumbList
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1]);
      const walk = (node: any) => {
        if (!node) return;
        const type = (Array.isArray(node["@type"]) ? node["@type"][0] : node["@type"]) || "";
        if (type === "BreadcrumbList" && Array.isArray(node.itemListElement)) node.itemListElement.forEach(walk);
      };
      const collect = (node: any) => {
        if (!node) return;
        const t = (Array.isArray(node["@type"]) ? node["@type"][0] : node["@type"]) || "";
        if (t === "ListItem" && typeof node.name === "string") crumbLabels.push(node.name);
        if (node.itemListElement) walk(node.itemListElement);
      };
      walk(data);
    } catch {}
  }

  // 2b) Generic breadcrumb class names — capture text inside <a> / <span>
  if (crumbLabels.length === 0) {
    const crumbContainer = html.match(/<(?:nav|ol|ul)[^>]*class=["'][^"']*breadcrumb[^"']*["'][^>]*>([\s\S]*?)<\/(?:nav|ol|ul)>/i);
    if (crumbContainer) {
      const links = crumbContainer[1].match(/<a[^>]*>([^<]+)<\/a>|<span[^>]*>([^<]+)<\/span>/gi);
      if (links) {
        for (const l of links) {
          const m = l.match(/>([^<]+)</);
          if (m && m[1].trim()) crumbLabels.push(m[1].trim());
        }
      }
    }
  }

  if (crumbLabels.length >= 3) {
    // Skip "Home" / "Shop" / "All" — return the deepest meaningful category
    const filtered = crumbLabels.filter((c) => !/^(home|shop|all|breadcrumb)$/i.test(c));
    if (filtered.length >= 2) {
      // Return the second-to-last (the parent category of the final product)
      return filtered[filtered.length - 2];
    }
    if (filtered.length === 1) return filtered[0];
  }
  if (crumbLabels.length > 0) {
    return crumbLabels[crumbLabels.length - 1] || crumbLabels[0];
  }

  // 3) Infer from title keywords
  if (!title) return null;
  const lower = title.toLowerCase();
  if (/\b(iphone|ipad|macbook|airpods|samsung|sony|canon|nikon|camera|laptop|phone|headphone|earbuds|kindle|tablet)\b/.test(lower)) return "Electronics";
  if (/\b(nike|adidas|jordan|sneakers?|shoes?|boots?|sandals?|jacket|coat|dress|shirt|pants?|jeans?|sunglasses?|watch|bag|purse|wallet|hat|scarf)\b/.test(lower)) return "Fashion";
  if (/\b(skincare|makeup|perfume|fragrance|cosmetics?|serum|moisturizer|lipstick|mascara|foundation|lotion)\b/.test(lower)) return "Beauty";
  if (/\b(chocolate|tea|coffee|snack|food|candy|spice|sauce|wine|beer|spirit)\b/.test(lower)) return "Food";
  return null;
}

/** Extract country and city from URL domain and page content */
function extractLocation(url: string, html: string): { country: string | null; city: string | null } {
  const urlLower = url.toLowerCase();
  const htmlLower = html.toLowerCase();

  // Known duty-free / airport store domain mappings
  const DOMAIN_MAP: Record<string, { country: string; city: string }> = {
    "heinemann": { country: "Australia", city: "Sydney" },
    "dufry": { country: "Australia", city: "Sydney" },
    "lagardere": { country: "Australia", city: "Sydney" },
    "junction": { country: "Australia", city: "Sydney" },
    "dutyfree": { country: "Australia", city: "Sydney" },
    "woolworths": { country: "Australia", city: "Sydney" },
    "myer": { country: "Australia", city: "Sydney" },
    "davidjones": { country: "Australia", city: "Sydney" },
    "amazon.com.au": { country: "Australia", city: "Sydney" },
    "amazon.co.uk": { country: "United Kingdom", city: "London" },
    "amazon.de": { country: "Germany", city: "Frankfurt" },
    "amazon.fr": { country: "France", city: "Paris" },
    "amazon.co.jp": { country: "Japan", city: "Tokyo" },
    "amazon.sg": { country: "Singapore", city: "Singapore" },
    "lazada.sg": { country: "Singapore", city: "Singapore" },
    "shopee.sg": { country: "Singapore", city: "Singapore" },
    "shopee.co.id": { country: "Indonesia", city: "Bali" },
    "tokopedia.com": { country: "Indonesia", city: "Bali" },
    "bhinneka.com": { country: "Indonesia", city: "Bali" },
    " zalora": { country: "Singapore", city: "Singapore" },
  };

  // Check domain mappings
  for (const [domain, loc] of Object.entries(DOMAIN_MAP)) {
    if (urlLower.includes(domain)) {
      return { country: loc.country, city: loc.city };
    }
  }

  // Try to extract from HTML content (address, location meta tags)
  const addressMatch = html.match(/(?:address|location|city|country)['"]?\s*[:=]\s*['"]([^'"]+)['"]/i);
  if (addressMatch) {
    // Try to find country in the address
    const countries = ["Australia", "United Kingdom", "Germany", "France", "Japan", "Singapore", "Indonesia", "United States", "Canada", "Thailand", "Malaysia", "Philippines", "Vietnam", "South Korea", "China", "India", "New Zealand", "Fiji", "Bali"];
    for (const c of countries) {
      if (htmlLower.includes(c.toLowerCase())) {
        // Try to find city near the country mention
        const cityPatterns = [
          new RegExp(`(sydney|melbourne|brisbane|perth|auckland|wellington|singapore|tokyo|osaka|london|paris|frankfurt|berlin|bali|jakarta|bangkok|kuala lumpur|manila|ho chi minh|hanoi|seoul|beijing|shanghai|mumbai|delhi|new york|los angeles|san francisco|toronto|vancouver|nadi)[^,]*,?\\s*${c}`, "i"),
          new RegExp(`${c}[^,]*,?\\s*(sydney|melbourne|brisbane|perth|auckland|wellington|singapore|tokyo|osaka|london|paris|frankfurt|berlin|bali|jakarta|bangkok|kuala lumpur|manila|ho chi minh|hanoi|seoul|beijing|shanghai|mumbai|delhi|new york|los angeles|san francisco|toronto|vancouver|nadi)`, "i"),
        ];
        for (const pattern of cityPatterns) {
          const cityMatch = html.match(pattern);
          if (cityMatch) {
            const city = cityMatch[1] || cityMatch[2];
            return { country: c, city: city.charAt(0).toUpperCase() + city.slice(1) };
          }
        }
        return { country: c, city: null };
      }
    }
  }

  // Try to extract from URL path segments
  const urlPath = urlLower.replace(/^https?:\/\//, "");
  const cityCountryPatterns: Array<{ pattern: RegExp; country: string; city: string }> = [
    { pattern: /sydney|syd|au\.heinemann|au\.dufry/i, country: "Australia", city: "Sydney" },
    { pattern: /melbourne|mbl|air\.au/i, country: "Australia", city: "Melbourne" },
    { pattern: /brisbane|bne/i, country: "Australia", city: "Brisbane" },
    { pattern: /perth|per/i, country: "Australia", city: "Perth" },
    { pattern: /auckland|akl|nz\//i, country: "New Zealand", city: "Auckland" },
    { pattern: /singapore|sg\//i, country: "Singapore", city: "Singapore" },
    { pattern: /tokyo|tyo|jp\//i, country: "Japan", city: "Tokyo" },
    { pattern: /london|ldn|uk\//i, country: "United Kingdom", city: "London" },
    { pattern: /paris|cdg|fr\//i, country: "France", city: "Paris" },
    { pattern: /bali|dps|id\//i, country: "Indonesia", city: "Bali" },
    { pattern: /bangkok|bkk|th\//i, country: "Thailand", city: "Bangkok" },
    { pattern: /kualalumpur|kul|my\//i, country: "Malaysia", city: "Kuala Lumpur" },
  ];

  for (const { pattern, country, city } of cityCountryPatterns) {
    if (pattern.test(urlPath) || pattern.test(htmlLower.substring(0, 5000))) {
      return { country, city };
    }
  }

  return { country: null, city: null };
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || !url.startsWith("http")) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch URL: ${response.status}` }, { status: 502 });
    }

    const html = await response.text();

    // Extract metadata
    const title = extractMeta(html, "og:title") || extractMeta(html, "twitter:title") || 
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || null;
    
    const description = extractMeta(html, "og:description") || extractMeta(html, "description") || 
      extractMeta(html, "twitter:description") || null;
    
    const allImages = extractAllImages(html, url);

    const { price, currency } = extractPrice(html);
    const category = extractCategory(html, title);
    // siteName: og:site_name → application-name → derived from URL hostname
    let siteName = extractMeta(html, "og:site_name");
    if (!siteName) siteName = extractMeta(html, "application-name");
    if (!siteName) {
      try {
        const host = new URL(url).hostname.replace(/^www\./, "");
        // Capitalize first letter of the registrable label (e.g. "heinemann.com.au" → "Heinemann")
        const label = host.split(".").slice(0, -2)[0] || host.split(".")[0];
        if (label) siteName = label.charAt(0).toUpperCase() + label.slice(1);
      } catch {}
    }
    const { country, city } = extractLocation(url, html);

    const product: ScrapedProduct = {
      title: title?.substring(0, 200) || null,
      description: description?.substring(0, 500) || null,
      imageUrls: allImages,
      price,
      currency,
      category,
      siteName,
      country,
      city,
    };

    return NextResponse.json(product);
  } catch (error) {
    console.error("[scrape POST]", error);
    return NextResponse.json({ error: "Failed to scrape URL" }, { status: 500 });
  }
}
