import { CheckCircle2, Activity } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t-4 border-black p-4 flex flex-col md:flex-row justify-between items-center gap-4 relative z-20">
      <div className="flex items-center gap-6 font-bold">
        <div className="bg-[#00E57A] border-4 border-black shadow-[4px_4px_0px_0px_#000] px-4 py-2 flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-black" strokeWidth={3} />
          System Operational
        </div>
        <span className="text-gray-500 hidden md:block tracking-widest font-mono text-sm">
          Yakup Akyniyazov
        </span>
      </div>

      <div className="flex gap-4 font-bold">
        <div className="bg-[#5A87FF] border-4 border-black shadow-[4px_4px_0px_0px_#000] px-5 py-2 text-white text-center">
          <div className="font-black text-xl">1K</div>
          <div className="text-[0.6rem] font-bold uppercase tracking-wider">
            Active Exams
          </div>
        </div>
        <div className="bg-[#FF6B9E] border-4 border-black shadow-[4px_4px_0px_0px_#000] px-5 py-2 text-black text-center">
          <div className="font-black text-xl flex items-center justify-center gap-1">
            50% <Activity className="w-4 h-4" strokeWidth={3} />
          </div>
          <div className="text-[0.6rem] font-bold uppercase tracking-wider">
            Uptime
          </div>
        </div>
      </div>
    </footer>
  );
}
