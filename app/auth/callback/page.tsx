"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/app/utils/Supabase/client";
import { AlertTriangle, Loader2 } from "lucide-react";

// 1. Asıl mantığın çalıştığı İç Bileşen (Content)
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const handleAuth = async () => {
      // Check for standard OAuth errors in the URL
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.replace("#", "?"));
      const errorDescription = params.get("error_description");
      const errorCode = params.get("error_code");

      if (errorDescription || errorCode) {
        setError(
          errorDescription?.replace(/\+/g, " ") || "Link expired or invalid",
        );
        return;
      }

      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const user = session.user;
        const source = searchParams.get("source");

        // SECURITY CHECK: Is this a brand new user who tried to "Login" instead of "Sign Up"?
        const createdTime = new Date(user.created_at).getTime();
        const now = new Date().getTime();
        const isBrandNewAccount = now - createdTime < 10000;

        if (isBrandNewAccount && source === "login") {
          // They clicked "Login" but didn't have an account!
          await supabase.auth.signOut();
          setError(
            "ACCOUNT NOT FOUND! You must Sign Up before you can log in.",
          );
          return;
        }

        // Success! Let them in.
        router.push("/teacher");
      }
    };

    handleAuth();

    // Listen for state changes just in case
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        handleAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, [router, searchParams]);

  // 🔴 ERROR UI
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
          <AlertTriangle className="w-16 h-16 text-[#FF6B9E] mx-auto mb-4 stroke-[3]" />
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-2 leading-none">
            Access Denied
          </h1>
          <p className="font-bold mb-8 text-black/80">{error}</p>
          <button
            onClick={() => router.push("/teacher/signup")}
            className="w-full bg-black text-white font-black uppercase py-4 border-4 border-black hover:bg-[#25c0f4] hover:text-black transition-all shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
          >
            Go to Sign Up
          </button>
        </div>
      </div>
    );
  }

  // 🟡 LOADING UI
  return (
    <div
      className="min-h-screen bg-[#25c0f4] flex items-center justify-center p-6 text-black"
      style={{
        backgroundImage: "radial-gradient(#000 2px, transparent 2px)",
        backgroundSize: "32px 32px",
      }}
    >
      <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-10 max-w-md w-full text-center">
        <Loader2 className="w-16 h-16 text-black mx-auto mb-4 animate-spin stroke-[3]" />
        <h1 className="text-3xl font-black uppercase tracking-tighter">
          Verifying...
        </h1>
        <p className="font-bold mt-2 text-black/80">
          Checking your credentials...
        </p>
      </div>
    </div>
  );
}

// 2. Ana Sayfa Dışa Aktarımı (Suspense ile Sarılmış Hali)
export default function AuthCallbackPage() {
  return (
    // Fallback UI: React Suspense yüklenirken gösterilecek brutalist loading ekranı
    <Suspense
      fallback={
        <div
          className="min-h-screen bg-[#25c0f4] flex items-center justify-center p-6 text-black"
          style={{
            backgroundImage: "radial-gradient(#000 2px, transparent 2px)",
            backgroundSize: "32px 32px",
          }}
        >
          <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-10 max-w-md w-full text-center">
            <Loader2 className="w-16 h-16 text-black mx-auto mb-4 animate-spin stroke-[3]" />
            <h1 className="text-3xl font-black uppercase tracking-tighter">
              Loading...
            </h1>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
