import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {});

// Her priceId'ye kaç kredi karşılık gelir
const PRICE_CREDITS: Record<string, number> = {
  price_1TVqr90JUB4PrmnjOtoVJrFT: 1, // Single Strike → 1 kredi
  price_1TVqwL0JUB4PrmnjplaDhq7b: 5, // Power Pack → 5 kredi
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { priceId, userId } = body;

    if (!priceId) {
      return NextResponse.json(
        { error: "Price ID is required" },
        { status: 400 },
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const creditsToAward = PRICE_CREDITS[priceId];
    if (!creditsToAward) {
      return NextResponse.json({ error: "Unknown price ID" }, { status: 400 });
    }

    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zelos.io";
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      baseUrl = `https://${baseUrl}`;
    }
    baseUrl = baseUrl.replace(/\/+$/, "");

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/teacher?payment=success`,
      cancel_url: `${baseUrl}/pricing`,
      // ✅ Webhook'un kredi eklemesi için kritik bilgiler burada taşınıyor
      metadata: {
        userId: userId,
        credits: String(creditsToAward),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
