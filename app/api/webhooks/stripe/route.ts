import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover", // Kendi API sürümünle uyumlu olmalı
});

// Webhook işlemleri için admin yetkisine sahip bir Supabase istemcisi kullanmalıyız.
// Çünkü Row Level Security (RLS) politikalarını aşarak doğrudan kredi güncellemesi yapabilmeliyiz.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // .env dosmanda bu anahtarın tanımlı olduğundan emin ol!
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Signature is missing" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    // Sinyalin gerçekten Stripe'tan geldiğini doğrulamak için webhook secret kullanıyoruz
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown webhook error";
    console.error(`❌ Webhook imza doğrulama hatası: ${errorMessage}`);
    return NextResponse.json(
      { error: `Webhook Error: ${errorMessage}` },
      { status: 400 },
    );
  }

  // Ödeme başarıyla tamamlandığında tetiklenen olay
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Checkout API rotamızda metadata içerisine userId ve credits bilgilerini koymuştuk
    const userId = session.metadata?.userId;
    const creditsToAward = parseInt(session.metadata?.credits || "0", 10);

    if (userId && creditsToAward > 0) {
      console.log(
        `🔔 Başarılı Ödeme: Kullanıcı ID: ${userId} - Eklenecek Kredi: ${creditsToAward}`,
      );

      try {
        // 1. Önce kullanıcının mevcut kredisini çekiyoruz
        const { data: profile, error: fetchError } = await supabaseAdmin
          .from("teacher_profiles")
          .select("credits")
          .eq("id", userId)
          .single();

        if (fetchError) throw fetchError;

        const currentCredits = profile?.credits || 0;
        const newCredits = currentCredits + creditsToAward;

        // 2. Yeni kredi miktarını güncelliyoruz
        const { error: updateError } = await supabaseAdmin
          .from("teacher_profiles")
          .update({ credits: newCredits })
          .eq("id", userId);

        if (updateError) throw updateError;

        console.log(
          `✅ Başarıyla güncellendi! Eski Kredi: ${currentCredits}, Yeni Kredi: ${newCredits}`,
        );
      } catch (dbError: unknown) {
        const dbErrorMessage =
          dbError instanceof Error ? dbError.message : "Unknown database error";
        console.error(
          `❌ Supabase güncellenirken hata oluştu:`,
          dbErrorMessage,
        );
        return NextResponse.json(
          { error: "Database update failed" },
          { status: 500 },
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
