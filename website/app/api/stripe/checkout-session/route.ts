import { NextRequest, NextResponse } from "next/server";
import { stripe, calcPlatformFee } from "@/lib/stripe";
import prisma from "@/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    // Fetch the order with request details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { request: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only the buyer can fund the order
    if (order.buyerId !== session.userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Order must be in 'agreed' status to be funded
    if (order.status !== "agreed") {
      return NextResponse.json(
        { error: `Order status is "${order.status}", expected "agreed"` },
        { status: 400 }
      );
    }

    // Calculate total amount (item price + reward)
    const itemPrice = parseFloat(order.itemPrice.toString());
    const reward = parseFloat(order.reward.toString());
    const totalAmount = itemPrice + reward;

    // Determine currency (default to USD for now)
    const currency = "usd";

    // Calculate platform fee
    const totalSmallestUnit = Math.round(totalAmount * 100); // cents
    const platformFeeSmallestUnit = calcPlatformFee(totalSmallestUnit, currency);

    // Create Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: order.request?.title || `Order #${order.id.slice(0, 8)}`,
              description: `Item: $${itemPrice.toFixed(2)} + Delivery reward: $${reward.toFixed(2)}`,
            },
            unit_amount: totalSmallestUnit,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: platformFeeSmallestUnit,
        metadata: {
          orderId: order.id,
          buyerId: order.buyerId,
          travelerId: order.travelerId || "",
          itemPrice: itemPrice.toString(),
          reward: reward.toString(),
        },
      },
      metadata: {
        orderId: order.id,
        buyerId: order.buyerId,
      },
      client_reference_id: order.id,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/app/orders?paid=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/app/orders?cancelled=true`,
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("[stripe/checkout-session]", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
