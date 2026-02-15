"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function GetStartedPage() {
  return (
    <div
      className="min-h-screen flex flex-col font-sans selection:bg-black selection:text-[#FFE600] bg-[#FFE600]"
      style={{
        // This CSS creates the black grid pattern over the yellow background
        backgroundImage:
          "linear-gradient(black 2px, transparent 2px), linear-gradient(90deg, black 2px, transparent 2px)",
        backgroundSize: "64px 64px",
        backgroundPosition: "-2px -2px", // Aligns the grid perfectly
      }}
    >
      <Navbar />

      {/* --- Floating Background Letters --- */}
      <div
        className="absolute top-24 left-8 md:left-24 font-black text-black text-[8rem] md:text-[12rem] leading-none select-none pointer-events-none z-0 hidden md:block"
        style={{ textShadow: "8px 8px 0px #FF5722" }}
      >
        T
      </div>
      <div
        className="absolute bottom-28 right-8 md:right-24 font-black text-black text-[8rem] md:text-[12rem] leading-none select-none pointer-events-none z-0 hidden md:block"
        style={{ textShadow: "8px 8px 0px #FF5722" }}
      >
        S
      </div>

      {/* --- Main Content (The Giant Blocks) --- */}
      <main className="flex-grow flex items-center justify-center p-6 relative z-10 w-full mb-16 mt-8">
        <div className="flex flex-col md:flex-row gap-8 md:gap-16 w-full max-w-6xl justify-center items-center">
          {/* TEACHER BLOCK */}
          <Link
            href="/teacher/signup"
            className="group flex items-center justify-center w-full max-w-sm aspect-square bg-[#00E5FF] border-[6px] border-black shadow-[16px_16px_0px_0px_#000] hover:translate-x-2 hover:translate-y-2 hover:shadow-[4px_4px_0px_0px_#000] focus:shadow-none focus:translate-x-4 focus:translate-y-4 transition-all"
          >
            <h2 className="text-5xl md:text-6xl font-black text-black text-center uppercase tracking-tighter leading-[1.1] group-hover:scale-105 transition-transform duration-300">
              I Am A<br />
              Teacher
            </h2>
          </Link>

          {/* STUDENT BLOCK */}
          <Link
            href="/exam"
            className="group flex items-center justify-center w-full max-w-sm aspect-square bg-[#FF5722] border-[6px] border-black shadow-[16px_16px_0px_0px_#000] hover:translate-x-2 hover:translate-y-2 hover:shadow-[4px_4px_0px_0px_#000] focus:shadow-none focus:translate-x-4 focus:translate-y-4 transition-all"
          >
            <h2 className="text-5xl md:text-6xl font-black text-black text-center uppercase tracking-tighter leading-[1.1] group-hover:scale-105 transition-transform duration-300">
              I Am A<br />
              Student
            </h2>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
