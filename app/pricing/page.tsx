"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../utils/Supabase/client";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Check, Zap, Rocket, Star, ArrowRight } from "lucide-react";

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    checkUser();
  }, []);

  const handleStripeRedirect = async (priceId: string, planName: string) => {
    setLoading(planName);

    // 1. Get the current logged-in teacher
    if (!user) {
      alert("Please login to continue with the payment.");
      router.push("/teacher/login");
      return;
    }

    try {
      // 2. Call your internal API to create a Stripe session
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: priceId, // From Stripe Dashboard
          userId: user.id,
          userEmail: user.email,
        }),
      });

      const { url, error } = await response.json();
      
      if (error) throw new Error(error);

      // 3. Redirect user to the Stripe-hosted checkout page
      window.location.href = url;
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Could not start payment. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      name: "Free Trial",
      price: "0",
      description: "Test the platform for free",
      features: ["1 Full Exam Session", "Standard Support", "Basic Analytics"],
      priceId: null,
      buttonText: "Start Free",
      icon: <Star className="w-8 h-8" />,
      color: "bg-white",
    },
    {
      name: "Single Strike",
      price: "1",
      description: "Perfect for a single assessment",
      features: ["1 Full Exam Session", "Priority Support", "Detailed Analytics"],
      priceId: "price_SINGLE_EXAM_ID", // Replace with your Stripe Price ID
      buttonText: "Buy 1 Credit",
      icon: <Zap className="w-8 h-8" />,
      color: "bg-[#25c0f4]",
    },
    {
      name: "Power Pack",
      price: "8",
      description: "Best value for active teachers",
      features: ["5 Full Exam Sessions", "Priority Support", "Detailed Analytics", "Custom Templates"],
      priceId: "price_FIVE_EXAMS_ID", // Replace with your Stripe Price ID
      buttonText: "Buy 5 Credits",
      icon: <Rocket className="w-8 h-8" />,
      color: "bg-[#FFE600]",
    },
  ];

  return (
    <div 
      className="min-h-screen bg-[#FFE600] relative flex flex-col font-sans selection:bg-black selection:text-[#FFE600]"
      style={{
        backgroundImage: "radial-gradient(#000 2px, transparent 2px)",
        backgroundSize: "32px 32px",
      }}
    >
      <Navbar />

      <main className="flex-1 py-20 px-6 relative z-10">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none text-black mb-6">
            Pick Your <br /> <span className="bg-black text-white px-4">Power.</span>
          </h1>
          <p className="text-xl font-bold uppercase text-black/70 italic">No Subscriptions. Just Flow.</p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.name} className={`flex flex-col border-8 border-black text-black p-8 shadow-[12px_12px_0px_0px_#000] ${plan.color}`}>
              <div className="mb-6 flex justify-between items-start">
                <div className="p-3 bg-black text-white border-4 border-black">
                  {plan.icon}
                </div>
                <div className="text-right">
                  <p className="text-5xl font-black uppercase">€{plan.price}</p>
                </div>
              </div>

              <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">{plan.name}</h3>
              <p className="font-bold text-sm uppercase mb-8">{plan.description}</p>

              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 font-bold uppercase text-sm">
                    <Check className="w-5 h-5 stroke-[4] shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => plan.priceId ? handleStripeRedirect(plan.priceId, plan.name) : router.push("/teacher/signup")}
                disabled={loading === plan.name}
                className="w-full bg-black text-white p-5 text-xl font-black uppercase flex items-center justify-center gap-3 hover:translate-x-1 hover:translate-y-1 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] transition-all disabled:opacity-50"
              >
                {loading === plan.name ? "Redirecting..." : plan.buttonText}
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
