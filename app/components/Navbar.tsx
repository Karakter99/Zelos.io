"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SquareTerminal, ArrowRight, LogOut, User } from "lucide-react";
import { supabase } from "../utils/Supabase/client";

export default function Navbar() {
  const router = useRouter();

  // State to hold the logged-in user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);

  // 1. Listen for Auth Changes on Load
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    checkUser();

    // Set up a listener so the Navbar instantly updates if they log in/out
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <nav className="w-full flex justify-between items-center p-6 relative z-50 bg-transparent">
      {/* 1. LOGO SECTION */}
      <Link
        href="/"
        className="flex items-center gap-3 select-none group cursor-pointer"
      >
        <div className="bg-[#5A87FF] border-4 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all">
          <SquareTerminal className="w-8 h-8 text-white" strokeWidth={3} />
        </div>
        <span className="font-black text-3xl tracking-tighter text-black">
          ExamFlow
        </span>
      </Link>

      {/* 2. CENTER LINKS (Hidden on mobile) */}
      <div className="hidden md:flex items-center gap-8 bg-[#e4edcf] text-[#8c470a] border-4 border-black px-8 py-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] font-black text-sm hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all">
        <Link
          href="#"
          className="hover:underline decoration-4 underline-offset-4 decoration-[#FF6B9E]"
        >
          How it works
        </Link>
        <Link
          href="#"
          className="hover:underline decoration-4 underline-offset-4 decoration-[#00E57A]"
        >
          Features
        </Link>
        <Link
          href="/pricing"
          className="hover:underline decoration-4 underline-offset-4 decoration-[#5A87FF]"
        >
          Pricing
        </Link>
      </div>

      {/* 3. DYNAMIC AUTH BUTTONS */}
      <div className="flex items-center gap-4 md:gap-6 font-bold">
        {user ? (
          /* --- LOGGED IN VIEW --- */
          <>
            <Link
              href="/teacher"
              className="hidden md:flex items-center gap-2 bg-[#00E57A] text-black px-5 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all font-black uppercase tracking-tight"
            >
              <User className="w-5 h-5 stroke-[3]" />
              {/* Extract the full name from the metadata we saved during signup */}
              {user.user_metadata?.full_name || "Dashboard"}
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white text-black px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all font-black uppercase text-sm"
            >
              <LogOut className="w-5 h-5 stroke-[3]" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        ) : (
          /* --- LOGGED OUT VIEW --- */
          <>
            <Link
              href="/teacher/login"
              className="hidden md:block bg-[#e4edcf] text-[#8c470a] px-5 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all font-black"
            >
              Log in
            </Link>

            <Link
              href="/get-started"
              className="flex items-center gap-2 bg-black text-white px-6 py-3 border-4 border-black hover:bg-gray-800 transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
            >
              Get Started
              <ArrowRight className="w-5 h-5" strokeWidth={3} />
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
