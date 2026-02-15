import Link from "next/link";
import { SquareTerminal, ArrowRight } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="w-full flex justify-between items-center p-6 relative z-50 bg-transparent">
      {/* 1. LOGO SECTION - Now wrapped in a <Link> to go Home */}
      <Link
        href="/"
        className="flex items-center gap-3 select-none group cursor-pointer"
      >
        {/* The Icon Box (Uses group-hover so the whole logo triggers the animation) */}
        <div className="bg-[#5A87FF] border-4 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all">
          <SquareTerminal className="w-8 h-8 text-white" strokeWidth={3} />
        </div>
        {/* The Text */}
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

      {/* 3. AUTH BUTTONS */}
      <div className="flex items-center gap-6 font-bold">
        {/* 🟢 UPDATED: Now links directly to the teacher login page */}
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
      </div>
    </nav>
  );
}
