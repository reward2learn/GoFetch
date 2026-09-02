import { NextRequest, NextResponse } from "next/server";

interface ScrapedProduct {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  price: string | null;
  currency: string | null;
  category: string | null;
  siteName: string | null;
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

    const product: ScrapedProduct = {
      title: title?.substring(0, 200) || null,
      description: description?.substring(0, 500) || null,
      imageUrl,
      price,
      currency,
      category,
      siteName,
    };

    return NextResponse.json(product);
  } catch (error) {
    console.error("[scrape POST]", error);
    return NextResponse.json({ error: "Failed to scrape URL" }, { status: 500 });
  }
}
