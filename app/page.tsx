import Link from "next/link";
import Navbar from "./components/Navbar";
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

      {/* FLOATING LETTERS — Kusursuz Kutulu ve Renkli Yapı */}
      <div
        className="absolute pointer-events-none select-none"
        style={{ top: 80, bottom: 80, left: 0, right: 0, zIndex: 0, overflow: "hidden" }}
      >
        {/* A — Beyaz Kutu, Siyah Harf (Sol Üst) */}
        <div
          className="animate-float-fast-1 absolute bg-white text-black border-4 border-black shadow-[6px_6px_0px_0px_#000] font-black text-6xl w-24 h-24 flex items-center justify-center"
          style={{ top: "12%", left: "6%" }}
        >
          A
        </div>

        {/* C — Pembe Kutu, Beyaz Harf (Sağ Üst) */}
        <div
          className="animate-float-fast-3 absolute bg-[#FF6B9E] text-white border-4 border-black shadow-[6px_6px_0px_0px_#000] font-black text-5xl w-20 h-20 flex items-center justify-center"
          style={{ top: "15%", right: "8%", animationDelay: "1s" }}
        >
          C
        </div>

        {/* Y — Siyah Kutu, Beyaz Harf (Sol Orta) */}
        <div
          className="animate-float-fast-2 absolute bg-black text-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)] font-black text-4xl w-16 h-16 flex items-center justify-center"
          style={{ top: "52%", left: "4%", animationDelay: "2s" }}
        >
          Y
        </div>

        {/* Z — Beyaz Kutu, Yeşil Harf (Sağ Orta) */}
        <div
          className="animate-float-fast-4 absolute bg-white text-[#00E57A] border-4 border-black shadow-[6px_6px_0px_0px_#000] font-black text-5xl w-22 h-22 flex items-center justify-center"
          style={{ top: "48%", right: "5%", animationDelay: "1.5s" }}
        >
          Z
        </div>

        {/* X — Beyaz Kutu, Kahverengi Harf (Sol Alt) */}
        <div
          className="animate-float-fast-1 absolute bg-white text-[#5c3a21] border-4 border-black shadow-[6px_6px_0px_0px_#000] font-black text-7xl w-28 h-28 flex items-center justify-center"
          style={{ bottom: "14%", left: "7%", animationDelay: "0.5s" }}
        >
          X
        </div>

        {/* B — Mavi Kutu, Beyaz Harf (Sağ Alt) */}
        <div
          className="animate-float-fast-2 absolute bg-[#5A87FF] text-white border-4 border-black shadow-[6px_6px_0px_0px_#000] font-black text-8xl w-32 h-32 flex items-center justify-center"
          style={{ bottom: "12%", right: "6%", animationDelay: "2.5s" }}
        >
          B
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-grow flex flex-col items-center justify-center text-center relative z-10 px-4 mt-12 mb-32">
        {/* Tiny floating label */}
        <div className="bg-white border-4 text-lime-700 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-4 py-1 mb-8 font-bold text-sm tracking-widest uppercase rotate-2">
          <span className="inline-block w-3 h-3 bg-[#00E57A] border-2 border-black mr-2 align-middle"></span>
          The Future of Testing is Here
        </div>

        {/* MASSIVE HEADING */}
        <h1 className="text-[5rem] md:text-[7rem] lg:text-[8rem] font-black leading-[0.9] tracking-tighter text-black uppercase mb-8">
          Evaluate With
          <br />
          <span className="italic relative inline-block">
            Clarity & Speed
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </main>

      <Footer />
    </div>
  );
}