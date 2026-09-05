import { PrismaClient } from "../src/generated/prisma";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();
const DATA_DIR = "/Users/iliashapiro/GoFetch/DATABASE";

function loadJSON(filename: string) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  ${filename} not found, skipping`);
    return [];
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

async function main() {
  console.log("🚀 Migrating JSON data to new database...\n");

  // 1. Users (must go first — foreign key target)
  const users = loadJSON("users.json");
  if (users.length) {
    console.log(`📥 Users: ${users.length}`);
    for (const u of users) {
      await prisma.user.upsert({
        where: { id: u.id },
        update: {},
        create: {
          id: u.id,
          tenantSlug: u.tenant_slug || "default",
          email: u.email,
          name: u.name,
          avatarUrl: u.avatar_url,
          bio: u.bio,
          walletAddress: u.wallet_address,
          kycStatus: u.kyc_status || "none",
          role: u.role || "buyer",
          theme: u.theme || "system",
          reputation: u.reputation || "0",
          reviewsCount: u.reviews_count || 0,
          ordersCompleted: u.orders_completed || 0,
          tripsCompleted: u.trips_completed || 0,
          usdcBalance: u.usdc_balance || "0",
          lockedBalance: u.locked_balance || "0",
          token: u.token,
          acceptedTermsAt: u.accepted_terms_at ? new Date(u.accepted_terms_at) : null,
          createdAt: new Date(u.created_at),
          updatedAt: new Date(u.updated_at),
        },
      });
    }
    console.log(`  ✅ ${users.length} users imported\n`);
  }

  // 2. Requests
  const requests = loadJSON("requests.json");
  if (requests.length) {
    console.log(`📥 Requests: ${requests.length}`);
    for (const r of requests) {
      await prisma.request.upsert({
        where: { id: r.id },
        update: {},
        create: {
          id: r.id,
          tenantSlug: r.tenant_slug || "default",
          buyerId: r.buyer_id,
          title: r.title,
          description: r.description,
          category: r.category,
          imageUrl: r.image_url,
          productUrl: r.product_url,
          deliveryType: r.delivery_type || "standard",
          pickupLocation: r.pickup_location,
          pickupInstructions: r.pickup_instructions,
          itemPrice: r.item_price || "0",
          maxItemPrice: r.max_item_price,
          reward: r.reward || "0",
          fromCountry: r.from_country,
          fromCity: r.from_city,
          toCountry: r.to_country,
          toCity: r.to_city,
          deadline: r.deadline ? new Date(r.deadline) : null,
          status: r.status || "open",
          createdAt: new Date(r.created_at),
          deletedAt: r.deleted_at ? new Date(r.deleted_at) : null,
        },
      });
    }
    console.log(`  ✅ ${requests.length} requests imported\n`);
  }

  // 3. Travel Plans
  const travelPlans = loadJSON("travel_plans.json");
  if (travelPlans.length) {
    console.log(`📥 Travel Plans: ${travelPlans.length}`);
    for (const t of travelPlans) {
      await prisma.travelPlan.upsert({
        where: { id: t.id },
        update: {},
        create: {
          id: t.id,
          tenantSlug: t.tenant_slug || "default",
          userId: t.user_id,
          fromCountry: t.from_country,
          fromCity: t.from_city,
          toCountry: t.to_country,
          toCity: t.to_city,
          departDate: new Date(t.depart_date),
          returnDate: new Date(t.return_date),
          note: t.note,
          capacity: t.capacity || 1,
          status: t.status || "active",
          createdAt: new Date(t.created_at),
        },
      });
    }
    console.log(`  ✅ ${travelPlans.length} travel plans imported\n`);
  }

  // 4. Orders
  const orders = loadJSON("orders.json");
  if (orders.length) {
    console.log(`📥 Orders: ${orders.length}`);
    for (const o of orders) {
      await prisma.order.upsert({
        where: { id: o.id },
        update: {},
        create: {
          id: o.id,
          tenantSlug: o.tenant_slug || "default",
          requestId: o.request_id,
          buyerId: o.buyer_id,
          travelerId: o.traveler_id,
          status: o.status || "offered",
          itemPrice: o.item_price || "0",
          reward: o.reward || "0",
          proposedFee: o.proposed_fee,
          serviceFee: o.service_fee,
          stake: o.stake || "0",
          platformFeePct: o.platform_fee_pct || "0",
          platformFee: o.platform_fee || "0",
          payout: o.payout || "0",
          buyerFunded: o.buyer_funded || false,
          travelerStaked: o.traveler_staked || false,
          receiptUrl: o.receipt_url,
          receiptHash: o.receipt_hash,
          qrHash: o.qr_hash,
          note: o.note,
          timeline: o.timeline || [],
          createdAt: new Date(o.created_at),
        },
      });
    }
    console.log(`  ✅ ${orders.length} orders imported\n`);
  }

  // 5. Chat Messages
  const chatMessages = loadJSON("chat_messages.json");
  if (chatMessages.length) {
    console.log(`📥 Chat Messages: ${chatMessages.length}`);
    for (const m of chatMessages) {
      await prisma.chatMessage.upsert({
        where: { id: m.id },
        update: {},
        create: {
          id: m.id,
          tenantSlug: m.tenant_slug || "default",
          orderId: m.order_id,
          senderId: m.sender_id,
          text: m.text,
          imageUrl: m.image_url,
          readBy: m.read_by || [],
          createdAt: new Date(m.created_at),
        },
      });
    }
    console.log(`  ✅ ${chatMessages.length} chat messages imported\n`);
  }

  // 6. Reviews
  const reviews = loadJSON("reviews.json");
  if (reviews.length) {
    console.log(`📥 Reviews: ${reviews.length}`);
    for (const r of reviews) {
      await prisma.review.upsert({
        where: { id: r.id },
        update: {},
        create: {
          id: r.id,
          tenantSlug: r.tenant_slug || "default",
          orderId: r.order_id,
          reviewerId: r.reviewer_id,
          revieweeId: r.reviewee_id,
          rating: r.rating,
          comment: r.comment,
          createdAt: new Date(r.created_at),
        },
      });
    }
    console.log(`  ✅ ${reviews.length} reviews imported\n`);
  }

  // 7. App Settings
  const appSettings = loadJSON("app_settings.json");
  if (appSettings.length) {
    console.log(`📥 App Settings: ${appSettings.length}`);
    for (const s of appSettings) {
      await prisma.appSetting.upsert({
        where: { key: s.key },
        update: { value: s.value },
        create: {
          key: s.key,
          value: s.value,
          updatedAt: new Date(s.updated_at),
        },
      });
    }
    console.log(`  ✅ ${appSettings.length} app settings imported\n`);
  }

  console.log("🎉 Migration complete!");
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
