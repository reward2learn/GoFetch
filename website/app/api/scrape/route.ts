import { NextRequest, NextResponse } from "next/server";

interface ScrapedProduct {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  price: string | null;
  currency: string | null;
  category: string | null;
  siteName: string | null;
  country: string | null;
  city: string | null;
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
  const catMeta = extractMeta(html, "product:category") || extractMeta(html, "og:category");
  if (catMeta) return catMeta;

  // Infer from title keywords
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
    
    const imageUrl = extractMeta(html, "og:image") || extractMeta(html, "twitter:image") || null;
    
    const { price, currency } = extractPrice(html);
    const category = extractCategory(html, title);
    const siteName = extractMeta(html, "og:site_name") || null;
    const { country, city } = extractLocation(url, html);

    const product: ScrapedProduct = {
      title: title?.substring(0, 200) || null,
      description: description?.substring(0, 500) || null,
      imageUrl,
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
