import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

const IMAGES = {
  skincare: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=400&fit=crop",
  perfume: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&h=400&fit=crop",
  makeup: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&h=400&fit=crop",
  headphones: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop",
  camera: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=400&fit=crop",
  phone: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=400&fit=crop",
  sneakers: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=400&fit=crop",
  bag: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=400&fit=crop",
  watch: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&h=400&fit=crop",
  tea: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&h=400&fit=crop",
  chocolate: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&h=400&fit=crop",
  wine: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&h=400&fit=crop",
};

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

  const eva = await prisma.user.create({
    data: {
      walletAddress: "0xbeefbeefbeefbeefbeefbeefbeefbeefbeefbeef",
      name: "Eva Müller",
      email: "eva@gofetch.local",
      role: "buyer",
      token: "seed-eva",
      reputation: 4.5,
      ordersCompleted: 3,
      usdcBalance: 750,
    },
  });

  const frank = await prisma.user.create({
    data: {
      walletAddress: "0xfacefacefacefacefacefacefacefacefaceface",
      name: "Frank Osei",
      email: "frank@gofetch.local",
      role: "traveler",
      token: "seed-frank",
      reputation: 4.8,
      ordersCompleted: 35,
      tripsCompleted: 22,
      usdcBalance: 2000,
    },
  });

  const grace = await prisma.user.create({
    data: {
      walletAddress: "0xcafecafecafecafecafecafecafecafecafecafe",
      name: "Grace Kim",
      email: "grace@gofetch.local",
      role: "buyer",
      token: "seed-grace",
      reputation: 4.9,
      ordersCompleted: 8,
      usdcBalance: 450,
    },
  });

  const henry = await prisma.user.create({
    data: {
      walletAddress: "0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddead",
      name: "Henry Park",
      email: "henry@gofetch.local",
      role: "traveler",
      token: "seed-henry",
      reputation: 4.6,
      ordersCompleted: 15,
      tripsCompleted: 8,
      usdcBalance: 600,
    },
  });

  console.log("✅ Created 8 users");

  // ── Requests ───────────────────────────────────────────────────────────────
  const requests = await Promise.all([
    prisma.request.create({
      data: {
        buyerId: alice.id,
        title: "SK-II Facial Treatment Essence from Tokyo",
        description:
          "Looking for SK-II facial treatment essence (230ml) from Don Quijote in Shibuya. Will pay item price + reward for safe delivery.",
        category: "Beauty",
        imageUrl: IMAGES.skincare,
        fromCity: "Tokyo",
        fromCountry: "Japan",
        toCity: "Bali",
        toCountry: "Indonesia",
        itemPrice: 180,
        reward: 35,
        status: "open",
      },
    }),
    prisma.request.create({
      data: {
        buyerId: carol.id,
        title: "AirPods Pro 2 from Apple Store Singapore",
        description:
          "Need Apple AirPods Pro 2nd gen from Apple Store Orchard Road. Original packaging please.",
        category: "Electronics",
        imageUrl: IMAGES.headphones,
        fromCity: "Singapore",
        fromCountry: "Singapore",
        toCity: "Jakarta",
        toCountry: "Indonesia",
        itemPrice: 250,
        reward: 40,
        status: "open",
      },
    }),
    prisma.request.create({
      data: {
        buyerId: eva.id,
        title: "Gucci GG0018S Sunglasses from Milan",
        description:
          "Looking for Gucci GG0018S sunglasses from a boutique in Milan. Any colorway accepted.",
        category: "Fashion",
        imageUrl: IMAGES.watch,
        fromCity: "Milan",
        fromCountry: "Italy",
        toCity: "Bali",
        toCountry: "Indonesia",
        itemPrice: 450,
        reward: 75,
        status: "open",
      },
    }),
    prisma.request.create({
      data: {
        buyerId: grace.id,
        title: "Kyoto Matcha Kit-Kats (5 boxes)",
        description:
          "Want 5 boxes of Kyoto-exclusive matcha Kit-Kats. Happy to pay extra for careful packaging.",
        category: "Food",
        imageUrl: IMAGES.chocolate,
        fromCity: "Kyoto",
        fromCountry: "Japan",
        toCity: "Bali",
        toCountry: "Indonesia",
        itemPrice: 45,
        reward: 20,
        status: "open",
      },
    }),
    prisma.request.create({
      data: {
        buyerId: alice.id,
        title: "Sony A7IV Camera Body from NYC",
        description:
          "Sony A7IV mirrorless camera body only. Need it shipped from B&H Photo in New York.",
        category: "Electronics",
        imageUrl: IMAGES.camera,
        fromCity: "New York",
        fromCountry: "United States",
        toCity: "Bali",
        toCountry: "Indonesia",
        itemPrice: 650,
        reward: 90,
        status: "in_progress",
      },
    }),
    prisma.request.create({
      data: {
        buyerId: carol.id,
        title: "Nike Air Max 90 from London",
        description:
          "Nike Air Max 90 'Infrared' size 10 from Nike Store Oxford Street.",
        category: "Fashion",
        imageUrl: IMAGES.sneakers,
        fromCity: "London",
        fromCountry: "United Kingdom",
        toCity: "Jakarta",
        toCountry: "Indonesia",
        itemPrice: 140,
        reward: 30,
        status: "open",
      },
    }),
    prisma.request.create({
      data: {
        buyerId: eva.id,
        title: "Chanel No. 5 from Paris",
        description:
          "Chanel No. 5 Eau de Parfum 100ml from Galeries Lafayette.",
        category: "Beauty",
        imageUrl: IMAGES.perfume,
        fromCity: "Paris",
        fromCountry: "France",
        toCity: "Bali",
        toCountry: "Indonesia",
        itemPrice: 320,
        reward: 55,
        status: "open",
      },
    }),
    prisma.request.create({
      data: {
        buyerId: grace.id,
        title: "Thai Tea Concentrate from Bangkok",
        description:
          "ChaTraMue brand Thai tea concentrate, 3 bottles. From their flagship store.",
        category: "Food",
        imageUrl: IMAGES.tea,
        fromCity: "Bangkok",
        fromCountry: "Thailand",
        toCity: "Bali",
        toCountry: "Indonesia",
        itemPrice: 25,
        reward: 15,
        status: "open",
      },
    }),
    prisma.request.create({
      data: {
        buyerId: alice.id,
        title: "Le Labo Santal 33 from Dubai",
        description:
          "Le Labo Santal 33 fragrance 100ml from Dubai Mall.",
        category: "Beauty",
        imageUrl: IMAGES.perfume,
        fromCity: "Dubai",
        fromCountry: "UAE",
        toCity: "Bali",
        toCountry: "Indonesia",
        itemPrice: 290,
        reward: 50,
        status: "open",
      },
    }),
    prisma.request.create({
      data: {
        buyerId: carol.id,
        title: "MacBook Air M3 from Sydney",
        description:
          "MacBook Air 15-inch M3 16GB from Apple Store Sydney. Need receipt for warranty.",
        category: "Electronics",
        imageUrl: IMAGES.phone,
        fromCity: "Sydney",
        fromCountry: "Australia",
        toCity: "Jakarta",
        toCountry: "Indonesia",
        itemPrice: 800,
        reward: 120,
        status: "in_progress",
      },
    }),
    prisma.request.create({
      data: {
        buyerId: eva.id,
        title: "Longchamp Le Pliage from Paris",
        description:
          "Longchamp Le Pliage Large tote in navy blue. From their Rue de Rivoli store.",
        category: "Fashion",
        imageUrl: IMAGES.bag,
        fromCity: "Paris",
        fromCountry: "France",
        toCity: "Bali",
        toCountry: "Indonesia",
        itemPrice: 145,
        reward: 25,
        status: "completed",
      },
    }),
    prisma.request.create({
      data: {
        buyerId: grace.id,
        title: "Korean Skincare Bundle from Seoul",
        description:
          "Innisfree, COSRX, and Laneige products from Myeongdong. Will provide exact product list.",
        category: "Beauty",
        imageUrl: IMAGES.makeup,
        fromCity: "Seoul",
        fromCountry: "South Korea",
        toCity: "Bali",
        toCountry: "Indonesia",
        itemPrice: 120,
        reward: 25,
        status: "completed",
      },
    }),
  ]);

  console.log("✅ Created 12 requests");

  // ── Travel Plans ───────────────────────────────────────────────────────────
  await prisma.travelPlan.createMany({
    data: [
      {
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
      {
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
      {
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
      {
        userId: frank.id,
        fromCity: "London",
        fromCountry: "United Kingdom",
        toCity: "Bali",
        toCountry: "Indonesia",
        departDate: new Date("2026-09-28"),
        returnDate: new Date("2026-10-05"),
        capacity: 10,
        note: "Large suitcase available. Can carry multiple items.",
        status: "active",
      },
      {
        userId: henry.id,
        fromCity: "Dubai",
        fromCountry: "UAE",
        toCity: "Bali",
        toCountry: "Indonesia",
        departDate: new Date("2026-10-05"),
        returnDate: new Date("2026-10-12"),
        capacity: 6,
        note: "Business trip. Premium items welcome.",
        status: "active",
      },
    ],
  });

  console.log("✅ Created 5 travel plans");

  // ── Orders ─────────────────────────────────────────────────────────────────
  // In-progress order (request 5 — camera)
  const order1 = await prisma.order.create({
    data: {
      requestId: requests[4].id,
      buyerId: alice.id,
      travelerId: bob.id,
      status: "in_transit",
      itemPrice: 650,
      reward: 90,
      platformFee: 11.1,
      timeline: JSON.stringify([
        { status: "agreed", at: new Date("2026-08-28") },
        { status: "funded", at: new Date("2026-08-29") },
        { status: "purchased", at: new Date("2026-08-30") },
        { status: "in_transit", at: new Date("2026-08-31") },
      ]),
    },
  });

  // In-progress order (request 10 — MacBook)
  const order2 = await prisma.order.create({
    data: {
      requestId: requests[9].id,
      buyerId: carol.id,
      travelerId: frank.id,
      status: "purchased",
      itemPrice: 800,
      reward: 120,
      platformFee: 14,
      timeline: JSON.stringify([
        { status: "agreed", at: new Date("2026-09-01") },
        { status: "funded", at: new Date("2026-09-02") },
        { status: "purchased", at: new Date("2026-09-03") },
      ]),
    },
  });

  // Completed order (request 11 — Longchamp)
  const order3 = await prisma.order.create({
    data: {
      requestId: requests[10].id,
      buyerId: eva.id,
      travelerId: dave.id,
      status: "completed",
      itemPrice: 145,
      reward: 25,
      platformFee: 2.7,
      timeline: JSON.stringify([
        { status: "agreed", at: new Date("2026-08-15") },
        { status: "funded", at: new Date("2026-08-16") },
        { status: "purchased", at: new Date("2026-08-17") },
        { status: "in_transit", at: new Date("2026-08-18") },
        { status: "delivered", at: new Date("2026-08-22") },
        { status: "completed", at: new Date("2026-08-23") },
      ]),
    },
  });

  // Update request statuses
  await prisma.request.update({
    where: { id: requests[4].id },
    data: { status: "in_progress" },
  });
  await prisma.request.update({
    where: { id: requests[9].id },
    data: { status: "in_progress" },
  });
  await prisma.request.update({
    where: { id: requests[10].id },
    data: { status: "completed" },
  });
  await prisma.request.update({
    where: { id: requests[11].id },
    data: { status: "completed" },
  });

  console.log("✅ Created 3 orders");

  // ── Chat Messages ──────────────────────────────────────────────────────────
  await prisma.chatMessage.createMany({
    data: [
      // Order 1 — Camera
      {
        orderId: order1.id,
        senderId: alice.id,
        text: "Hi Bob! Just confirmed the order. Let me know when you're at B&H Photo!",
      },
      {
        orderId: order1.id,
        senderId: bob.id,
        text: "Hey Alice! Heading there tomorrow morning. Will send a photo when I'm at the store.",
      },
      {
        orderId: order1.id,
        senderId: alice.id,
        text: "Perfect, thank you! 🙏",
      },
      // Order 2 — MacBook
      {
        orderId: order2.id,
        senderId: carol.id,
        text: "Frank, can you also grab a USB-C hub if they have one? I'll add the extra to the reward.",
      },
      {
        orderId: order2.id,
        senderId: frank.id,
        text: "Sure thing! I'm at the Apple Store now. They have the hub in stock. Adding it to the order.",
      },
      // Order 3 — Longchamp (completed)
      {
        orderId: order3.id,
        senderId: dave.id,
        text: "Delivered! Check your doorstep. Bag is in perfect condition. 😊",
      },
    ],
  });

  console.log("✅ Created 6 chat messages");

  // ── Reviews ────────────────────────────────────────────────────────────────
  await prisma.review.createMany({
    data: [
      {
        orderId: order3.id,
        reviewerId: eva.id,
        revieweeId: dave.id,
        rating: 5,
        comment:
          "Dave was amazing! Fast delivery, perfect packaging, and great communication throughout.",
      },
      {
        orderId: order3.id,
        reviewerId: dave.id,
        revieweeId: eva.id,
        rating: 5,
        comment:
          "Eva was very clear about what she needed. Smooth transaction, would deliver again!",
      },
      {
        orderId: order1.id,
        reviewerId: alice.id,
        revieweeId: bob.id,
        rating: 5,
        comment:
          "Bob is so reliable. Always sends photos and keeps me updated. Top traveler!",
      },
      {
        orderId: order2.id,
        reviewerId: carol.id,
        revieweeId: frank.id,
        rating: 4,
        comment:
          "Frank found exactly what I needed and even grabbed a hub. Great service!",
      },
    ],
  });

  console.log("✅ Created 4 reviews");

  // ── Summary ────────────────────────────────────────────────────────────────
  const counts = {
    users: await prisma.user.count(),
    requests: await prisma.request.count(),
    travelPlans: await prisma.travelPlan.count(),
    orders: await prisma.order.count(),
    chatMessages: await prisma.chatMessage.count(),
    reviews: await prisma.review.count(),
  };

  console.log("\n📊 Seed summary:");
  console.log(`   Users: ${counts.users}`);
  console.log(`   Requests: ${counts.requests}`);
  console.log(`   Travel Plans: ${counts.travelPlans}`);
  console.log(`   Orders: ${counts.orders}`);
  console.log(`   Chat Messages: ${counts.chatMessages}`);
  console.log(`   Reviews: ${counts.reviews}`);
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
