import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover", // Kendi Stripe API versiyonuna göre güncelleyebilirsin
});

export async function POST(req: Request) {
  try {
    const { priceId, userId, userEmail } = await req.json();

    // Hangi priceId'nin kaç kredi kazandıracağını belirliyoruz
    let creditsToAward = 0;
    if (priceId === "price_1TVqr90JUB4PrmnjOtoVJrFT") {
      creditsToAward = 1;
    } else if (priceId === "price_1TVqwL0JUB4PrmnjplaDhq7b") {
      creditsToAward = 5;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment", // ABONELİK DEĞİL, TEK SEFERLİK ÖDEME MODU
      customer_email: userEmail,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/teacher?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        userId: userId, // Ödemeyi yapan öğretmenin id'si
        credits: creditsToAward, // Webhook'ta kullanılacak kazanılan kredi miktarı
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
