import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import prisma from "@/db";

// Disable body parsing — Stripe needs the raw body for signature verification
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;

        if (orderId) {
          // Update order status to 'funded'
          await prisma.order.update({
            where: { id: orderId },
            data: {
              status: "funded",
              buyerFunded: true,
              timeline: {
                push: {
                  status: "funded",
                  timestamp: new Date().toISOString(),
                  actorId: session.metadata?.buyerId || "system",
                  note: "Payment received via Stripe",
                },
              },
            },
          });

          // Record the transaction
          const buyerId = session.metadata?.buyerId;
          if (buyerId) {
            await prisma.transaction.create({
              data: {
                userId: buyerId,
                type: "escrow_fund",
                amount: (session.amount_total || 0) / 100,
                orderId,
                note: `Stripe checkout session: ${session.id}`,
              },
            });
          }

          console.log(`Order ${orderId} funded via Stripe`);
        }
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;

        if (orderId) {
          console.error(`Payment failed for order ${orderId}`);
          // Optionally update order status or notify buyer
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const orderId = charge.metadata?.orderId;

        if (orderId) {
          // Update order status to 'refunded'
          await prisma.order.update({
            where: { id: orderId },
            data: {
              status: "refunded",
              timeline: {
                push: {
                  status: "refunded",
                  timestamp: new Date().toISOString(),
                  actorId: "system",
                  note: `Refund processed: ${charge.id}`,
                },
              },
            },
          });

          // Record refund transaction
          const buyerId = charge.metadata?.buyerId;
          if (buyerId) {
            await prisma.transaction.create({
              data: {
                userId: buyerId,
                type: "escrow_refund",
                amount: (charge.amount_refunded || 0) / 100,
                orderId,
                note: `Stripe refund: ${charge.id}`,
              },
            });
          }

          console.log(`Order ${orderId} refunded`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Webhook handler error for ${event.type}:`, error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
