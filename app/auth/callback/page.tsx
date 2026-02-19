"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/utils/Supabase/client";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    // 1. Get the URL hash
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", "?"));

    // 2. Check for errors
    const errorDescription = params.get("error_description");
    const errorCode = params.get("error_code");

    if (errorDescription || errorCode) {
      setTimeout(() => {
        setError(
          errorDescription?.replace(/\+/g, " ") || "Link expired or invalid",
        );
      }, 0);
      return;
    }

    // 🟢 3. NEW: Check if Supabase ALREADY logged them in while the page was rendering
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/teacher"); // Or "/teacher/dashboard" depending on your setup
      }
    });

    // 4. Listen for the "Auto-Login" event (if it takes a second)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || session) {
        router.push("/teacher");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // 🔴 ERROR UI (Link Expired)
  if (error) {
    return (
      <div
        className="min-h-screen bg-[#FFE600] flex items-center justify-center p-6 text-black"
        style={{
          backgroundImage: "radial-gradient(#000 2px, transparent 2px)",
          backgroundSize: "32px 32px",
        }}
      >
        <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-10 max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-[#FF6B9E] mx-auto mb-4 stroke-3" />
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">
            Link Expired
          </h1>
          <p className="font-bold mb-8">{error}</p>
          <button
            onClick={() => router.push("/teacher/signup")}
            className="w-full bg-black text-white font-black uppercase py-4 border-4 border-black hover:bg-[#25c0f4] hover:text-black transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // 🟡 LOADING UI (Verifying...)
  return (
    <div
      className="min-h-screen bg-[#25c0f4] flex items-center justify-center p-6 text-black"
      style={{
        backgroundImage: "radial-gradient(#000 2px, transparent 2px)",
        backgroundSize: "32px 32px",
      }}
    >
      <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-10 max-w-md w-full text-center">
        <Loader2 className="w-16 h-16 text-black mx-auto mb-4 animate-spin stroke-3" />
        <h1 className="text-3xl font-black uppercase tracking-tighter">
          Verifying...
        </h1>
        <p className="font-bold mt-2">
          Just a moment while we unlock the gates.
        </p>
      </div>
    </div>
  );
}
