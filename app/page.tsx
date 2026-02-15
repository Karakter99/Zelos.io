import Link from "next/link";
import Navbar from "./components/Navbar"; // Adjust path if needed
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div
      className="min-h-screen bg-[#FFE600] relative overflow-hidden flex flex-col font-sans selection:bg-black selection:text-[#FFE600]"
      style={{
        backgroundImage: "radial-gradient(#000 2px, transparent 2px)",
        backgroundSize: "32px 32px",
      }}
    >
      <Navbar />

      {/* FLOATING DECORATIONS (Absolute positioned) */}
      <div className="absolute top-32 left-20 text-black bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-6xl font-black w-28 h-28 flex items-center justify-center -rotate-6 z-0 hidden lg:flex">
        A
      </div>
      <div className="absolute bottom-40 right-40 bg-[#5A87FF] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-8xl font-black text-white w-32 h-32 flex items-center justify-center rotate-3 z-0 hidden lg:flex">
        B
      </div>
      <div className="absolute top-40 right-32 bg-[#FF6B9E] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-5xl font-black w-20 h-20 flex items-center justify-center rotate-12 z-0 hidden md:flex">
        C
      </div>
      <div className="absolute bottom-40 left-32 text-amber-950 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-7xl font-black w-32 h-32 flex items-center justify-center rotate-6 z-0 hidden lg:flex">
        X
      </div>
      <div className="absolute top-1/2 left-10 bg-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] text-4xl font-black text-white w-16 h-16 flex items-center justify-center -rotate-12 z-0 hidden md:flex">
        Y
      </div>
      <div className="absolute top-1/2 right-12 text-green-500 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-5xl font-black w-24 h-24 flex items-center justify-center rotate-6 z-0 hidden lg:flex">
        Z
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-grow flex flex-col items-center justify-center text-center relative z-10 px-4 mt-12 mb-32">
        {/* Tiny floating label */}
        <div className="bg-white border-4  text-lime-700 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-4 py-1 mb-8 font-bold text-sm tracking-widest uppercase rotate-2">
          <span className="inline-block w-3 h-3bg-[#00E57A] border-2 border-black mr-2"></span>
          The Future of Testing is Here
        </div>

        {/* MASSIVE HEADING */}
        <h1 className="text-[5rem] md:text-[7rem] lg:text-[8rem] font-black leading-[0.9] tracking-tighter text-black uppercase mb-8">
          Evaluate With
          <br />
          <span className="italic relative inline-block">
            Clarity & Speed
            {/* The Blue Underline */}
            <div className="absolute bottom-2 md:bottom-4 left-0 w-full h-4 md:h-6 bg-[#5A87FF] -z-10 -rotate-1"></div>
          </span>
        </h1>

        {/* SUBTEXT BOX */}
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-3xl p-6 md:p-8 mb-12 transform -rotate-1">
          <p className="text-xl md:text-2xl font-bold text-black leading-relaxed">
            A distraction-free, secure environment for modern assessments.
            Teachers create instantly. Students join seamlessly.
          </p>
        </div>

        {/* CTA BUTTON */}
        <Link
          href="/exam"
          className="bg-[#FF6B9E] border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-black text-2xl md:text-4xl font-black px-12 py-6 hover:translate-x-1 hover:translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-4 group"
        >
          START EXAM
          <svg
            className="w-8 h-8 group-hover:translate-x-2 transition-transform"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </Link>
      </main>
      <Footer />
    </div>
  );
}
