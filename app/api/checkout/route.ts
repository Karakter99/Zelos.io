import { NextResponse } from "next/server";
import Stripe from "stripe";

// Stripe başlatma
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // Eğer özel bir apiVersion kullanıyorsan buraya ekleyebilirsin, yoksa boş kalabilir.
});

export async function POST(request: Request) {
  try {
    // 1. EKSİK OLAN KISIM: İstekten (Request) priceId değerini alıyoruz
    const body = await request.json();
    const { priceId } = body;

    // Eğer priceId gelmediyse hata fırlat
    if (!priceId) {
      return NextResponse.json(
        { error: "Price ID is required" },
        { status: 400 },
      );
    }

    // 2. GÜVENLİ URL OLUŞTURMA (Geçersiz URL hatasını çözen kısım)
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zelos.io";

    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      baseUrl = `https://${baseUrl}`;
    }

    baseUrl = baseUrl.replace(/\/+$/, "");

    // 3. STRIPE SESSION OLUŞTURMA
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId, // Artık priceId tanımlı ve hata vermeyecek!
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/teacher?payment=success`,
      cancel_url: `${baseUrl}/pricing`,
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
