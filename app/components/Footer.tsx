import { CheckCircle2, Activity, ShieldCheck, Mail, MapPin, SquareTerminal } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-[#1A1A1A] border-t-4 border-black text-white py-4 px-4 md:py-5 md:px-6 relative z-20 flex flex-col md:flex-row justify-between items-center gap-4 selection:bg-[#FFE600] selection:text-black mt-auto">
      
      {/* BRAND & STATUS */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-4 border-b-0 pb-0">
          <Link href="/" className="flex items-center gap-3 select-none group cursor-pointer inline-flex w-max">
            <div className="bg-[#5A87FF] border-4 border-black p-2 shadow-[4px_4px_0px_0px_#FFE600] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all">
              <SquareTerminal className="w-6 h-6 text-black" strokeWidth={3} />
            </div>
            <span className="font-black text-3xl tracking-tighter text-white uppercase">
              Zelos
            </span>
          </Link>
          
          <div className="bg-[#00E57A] border-4 border-black shadow-[4px_4px_0px_0px_#000] px-3 py-1 flex items-center w-max gap-2 text-black font-black uppercase text-[10px] md:text-sm tracking-tight">
            <CheckCircle2 className="w-4 h-4 text-black" strokeWidth={3} />
            System Operational
          </div>
        </div>
        
        <span className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">
          Built for modern teachers
        </span>
      </div>



      {/* STATS */}
      <div className="flex gap-3 font-bold">
        <div className="bg-[#5A87FF] border-4 border-black shadow-[4px_4px_0px_0px_#FFE600] px-4 py-2 h-full text-black text-center flex flex-col justify-center">
          <div className="font-black text-xl md:text-2xl">10K+</div>
          <div className="text-[0.6rem] font-bold uppercase tracking-wider mt-1">
            Exams Taken
          </div>
        </div>
        <div className="bg-[#FF6B9E] border-4 border-black shadow-[4px_4px_0px_0px_#00E57A] px-4 py-2 h-full text-black text-center flex flex-col justify-center">
          <div className="font-black text-xl md:text-2xl flex items-center justify-center gap-1">
            99.9% <Activity className="w-4 h-4" strokeWidth={3} />
          </div>
          <div className="text-[0.6rem] font-bold uppercase tracking-wider mt-1">
            Uptime SLA
          </div>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className="absolute bottom-2 left-12 right-12 text-center text-xs text-gray-600 font-bold uppercase tracking-widest hidden md:block">
        © {new Date().getFullYear()} Zelos. All Rights Reserved. Not a subscription, just flow.
      </div>
    </footer>
  );
}