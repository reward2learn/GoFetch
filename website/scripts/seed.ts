import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding GoFetch database...");

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.review.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.order.deleteMany();
  await prisma.travelPlan.deleteMany();
  await prisma.request.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ──────────────────────────────────────────────────────────────────
  const alice = await prisma.user.create({
    data: {
      walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
      name: "Alice Chen",
      email: "alice@gofetch.local",
      role: "buyer",
      token: "seed-alice",
      reputation: 4.8,
      ordersCompleted: 12,
      usdcBalance: 500,
    },
  });

  const bob = await prisma.user.create({
    data: {
      walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
      name: "Bob Williams",
      email: "bob@gofetch.local",
      role: "traveler",
      token: "seed-bob",
      reputation: 4.9,
      ordersCompleted: 28,
      tripsCompleted: 15,
      usdcBalance: 1200,
    },
  });

  const carol = await prisma.user.create({
    data: {
      walletAddress: "0x9876543210fedcba9876543210fedcba98765432",
      name: "Carol Santos",
      email: "carol@gofetch.local",
      role: "buyer",
      token: "seed-carol",
      reputation: 4.6,
      ordersCompleted: 5,
      usdcBalance: 300,
    },
  });

  const dave = await prisma.user.create({
    data: {
      walletAddress: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
      name: "Dave Tanaka",
      email: "dave@gofetch.local",
      role: "traveler",
      token: "seed-dave",
      reputation: 4.7,
      ordersCompleted: 20,
      tripsCompleted: 10,
      usdcBalance: 800,
    },
  });

  console.log("✅ Created 4 users");

  // ── Requests ───────────────────────────────────────────────────────────────
  const request1 = await prisma.request.create({
    data: {
      buyerId: alice.id,
      title: "Japanese Skincare Set from Tokyo",
      description: "Looking for a SK-II facial treatment essence set from Don Quijote in Tokyo. Will pay item price + reward for safe delivery.",
      category: "Beauty",
      fromCity: "Tokyo",
      fromCountry: "Japan",
      toCity: "Bali",
      toCountry: "Indonesia",
      itemPrice: 180,
      reward: 35,
      status: "open",
    },
  });

  const request2 = await prisma.request.create({
    data: {
      buyerId: carol.id,
      title: "AirPods Pro 2 from Singapore",
      description: "Need Apple AirPods Pro 2nd gen from Apple Store Orchard Road. Original packaging please.",
      category: "Electronics",
      fromCity: "Singapore",
      fromCountry: "Singapore",
      toCity: "Jakarta",
      toCountry: "Indonesia",
      itemPrice: 250,
      reward: 40,
      status: "open",
    },
  });

  const request3 = await prisma.request.create({
    data: {
      buyerId: alice.id,
      title: "Designer Sunglasses from Milan",
      description: "Looking for Gucci GG0018S sunglasses from a boutique in Milan. Any colorway accepted.",
      category: "Fashion",
      fromCity: "Milan",
      fromCountry: "Italy",
      toCity: "Bali",
      toCountry: "Indonesia",
      itemPrice: 450,
      reward: 75,
      status: "open",
    },
  });

  const request4 = await prisma.request.create({
    data: {
      buyerId: carol.id,
      title: "Matcha Kit-Kats from Kyoto",
      description: "Want 5 boxes of Kyoto-exclusive matcha Kit-Kats. Happy to pay extra for careful packaging.",
      category: "Food",
      fromCity: "Kyoto",
      fromCountry: "Japan",
      toCity: "Bali",
      toCountry: "Indonesia",
      itemPrice: 45,
      reward: 20,
      status: "open",
    },
  });

  const request5 = await prisma.request.create({
    data: {
      buyerId: alice.id,
      title: "Kindle Paperwhite from Amazon US",
      description: "Kindle Paperwhite Signature Edition. Need it shipped from US to Bali.",
      category: "Electronics",
      fromCity: "Seattle",
      fromCountry: "United States",
      toCity: "Bali",
      toCountry: "Indonesia",
      itemPrice: 190,
      reward: 30,
      status: "open",
    },
  });

  const request6 = await prisma.request.create({
    data: {
      buyerId: carol.id,
      title: "Korean Beauty Bundle from Seoul",
      description: "Innisfree, COSRX, and Laneige products from Myeongdong. Will provide exact product list.",
      category: "Beauty",
      fromCity: "Seoul",
      fromCountry: "South Korea",
      toCity: "Jakarta",
      toCountry: "Indonesia",
      itemPrice: 120,
      reward: 25,
      status: "open",
    },
  });

  console.log("✅ Created 6 requests");

  // ── Travel Plans ───────────────────────────────────────────────────────────
  await prisma.travelPlan.create({
    data: {
      userId: bob.id,
      fromCity: "Tokyo",
      fromCountry: "Japan",
      toCity: "Bali",
      toCountry: "Indonesia",
      departDate: new Date("2026-09-15"),
      returnDate: new Date("2026-09-22"),
      capacity: 5,
      note: "Traveling light — carry-on only. Can fit small items.",
      status: "active",
    },
  });

  await prisma.travelPlan.create({
    data: {
      userId: dave.id,
      fromCity: "Singapore",
      fromCountry: "Singapore",
      toCity: "Jakarta",
      toCountry: "Indonesia",
      departDate: new Date("2026-09-20"),
      returnDate: new Date("2026-09-25"),
      capacity: 8,
      note: "Checked luggage — 23kg available. Happy to carry electronics.",
      status: "active",
    },
  });

  await prisma.travelPlan.create({
    data: {
      userId: bob.id,
      fromCity: "Seoul",
      fromCountry: "South Korea",
      toCity: "Bali",
      toCountry: "Indonesia",
      departDate: new Date("2026-10-01"),
      returnDate: new Date("2026-10-10"),
      capacity: 3,
      note: "Backpack trip. Small items only.",
      status: "active",
    },
  });

  console.log("✅ Created 3 travel plans");

  // ── Orders (with one in-progress) ─────────────────────────────────────────
  const order1 = await prisma.order.create({
    data: {
      requestId: request1.id,
      buyerId: alice.id,
      travelerId: bob.id,
      status: "in_transit",
      itemPrice: 180,
      reward: 35,
      platformFee: 5.25,
      timeline: JSON.stringify([
        { status: "agreed", at: new Date("2026-08-28") },
        { status: "funded", at: new Date("2026-08-29") },
        { status: "purchased", at: new Date("2026-08-30") },
        { status: "in_transit", at: new Date("2026-08-31") },
      ]),
    },
  });

  await prisma.request.update({
    where: { id: request1.id },
    data: { status: "in_progress" },
  });

  console.log("✅ Created 1 in-progress order");

  // ── Chat Messages ──────────────────────────────────────────────────────────
  await prisma.chatMessage.createMany({
    data: [
      {
        orderId: order1.id,
        senderId: alice.id,
        text: "Hi Bob! Just confirmed the order. Let me know when you're at the store!",
      },
      {
        orderId: order1.id,
        senderId: bob.id,
        text: "Hey Alice! I'm heading to Don Quijote tomorrow morning. Will send a photo when I'm there.",
      },
      {
        orderId: order1.id,
        senderId: alice.id,
        text: "Perfect, thank you! 🙏",
      },
    ],
  });

  console.log("✅ Created 3 chat messages");

  // ── Summary ────────────────────────────────────────────────────────────────
  const counts = {
    users: await prisma.user.count(),
    requests: await prisma.request.count(),
    travelPlans: await prisma.travelPlan.count(),
    orders: await prisma.order.count(),
    chatMessages: await prisma.chatMessage.count(),
  };

  console.log("\n📊 Seed summary:");
  console.log(`   Users: ${counts.users}`);
  console.log(`   Requests: ${counts.requests}`);
  console.log(`   Travel Plans: ${counts.travelPlans}`);
  console.log(`   Orders: ${counts.orders}`);
  console.log(`   Chat Messages: ${counts.chatMessages}`);
  console.log("\n✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
