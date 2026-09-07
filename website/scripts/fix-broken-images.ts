import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

// Map of ALL broken photo IDs to valid replacements
const REPLACEMENTS: Record<string, string> = {
  "photo-1564890369478-4f4743b1b0c8": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=600&h=400&q=80",
  "photo-1553062407-98eeb64c6a62": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&h=400&q=80",
  "photo-1600185365926-3a2ce3cdb9eb": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&h=400&q=80",
  "photo-1583394838336-2c77937c6b15": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&h=400&q=80",
  "photo-1546435770-a3e2bfdfb556": "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=600&h=400&q=80",
  "photo-1606984545578-c1ed4a4cdf7e": "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=600&h=400&q=80",
  "photo-1592750475338-74b7b21085ab": "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&h=400&q=80",
  "photo-1567581935884-3349723552ca": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&h=400&q=80",
};

const BROKEN_PHOTO_IDS = new Set(Object.keys(REPLACEMENTS));

async function main() {
  console.log("🔧 Fixing all broken images in database...");

  const requests = await prisma.request.findMany({
    select: { id: true, imageUrls: true },
  });

  let fixedCount = 0;

  for (const request of requests) {
    if (!request.imageUrls || request.imageUrls.length === 0) continue;

    const updatedUrls = request.imageUrls.map((url: string) => {
      // Check broken photo IDs
      for (const [brokenId, replacement] of Object.entries(REPLACEMENTS)) {
        if (url.includes(brokenId)) {
          fixedCount++;
          console.log(`  Fixed broken: ${brokenId}`);
          return replacement;
        }
      }
      return url;
    });

    const hasChanged = updatedUrls.some(
      (url: string, i: number) => url !== request.imageUrls![i]
    );

    if (hasChanged) {
      await prisma.request.update({
        where: { id: request.id },
        data: { imageUrls: updatedUrls },
      });
    }
  }

  console.log(`✅ Fixed ${fixedCount} broken image(s) in database.`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Error:", err);
  await prisma.$disconnect();
  process.exit(1);
});
