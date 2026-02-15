"use client";

import { useEffect, useState } from "react";
import { GraduationCap, Bell, User, Check, Database, Lock } from "lucide-react";

interface SuccessOverlayProps {
  isVisible: boolean;
  title: string;
  subtitle: string;
  onComplete: () => void;
}

export default function SuccessOverlay({
  isVisible,
  title,
  subtitle,
  onComplete,
}: SuccessOverlayProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // If the overlay isn't showing, do absolutely nothing.
    if (!isVisible) return;

    let currentProgress = 0;
    const duration = 1500; // 1.5 seconds
    const interval = 30;
    const step = 100 / (duration / interval);

    const timer = setInterval(() => {
      currentProgress += step;

      if (currentProgress >= 100) {
        setProgress(100);
        clearInterval(timer);
        onComplete(); // Safely trigger the redirect exactly ONE time
      } else {
        setProgress(currentProgress);
      }
    }, interval);

    // Cleanup the timer if the component unmounts
    return () => clearInterval(timer);

    // We intentionally only listen to 'isVisible' to prevent infinite React loops!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FFDE03] font-sans overflow-hidden transition-transform duration-500 ease-out ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      {/* Neo-Brutalist Grid Background */}
      <div
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundSize: "40px 40px",
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,1) 1px, transparent 1px)
          `,
        }}
      />

      {/* Floating Background Math Symbols */}
      <div className="absolute font-black text-black/10 pointer-events-none select-none z-0 text-9xl top-10 left-10">
        A
      </div>
      <div className="absolute font-black text-black/10 pointer-events-none select-none z-0 text-8xl top-1/4 right-20">
        Σ
      </div>
      <div className="absolute font-black text-black/10 pointer-events-none select-none z-0 text-7xl bottom-20 left-1/4">
        π
      </div>
      <div className="absolute font-black text-black/10 pointer-events-none select-none z-0 text-9xl bottom-10 right-10">
        B
      </div>
      <div className="absolute font-black text-black/10 pointer-events-none select-none z-0 text-6xl top-1/2 left-10">
        Ω
      </div>

      <div className="relative z-10 w-full max-w-[960px] px-6">
        {/* Top Nav - Neo Brutalist Style */}
        <header className="flex items-center justify-between bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-6 py-4 mb-12">
          <div className="flex items-center gap-3">
            <div className="bg-[#25c0f4] border-2 border-black p-1 flex items-center justify-center">
              <GraduationCap className="text-black w-6 h-6 stroke-[3]" />
            </div>
            <h2 className="text-black text-xl font-bold tracking-tight uppercase">
              Professor Portal
            </h2>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-white border-2 border-black flex items-center justify-center">
              <Bell className="text-black w-5 h-5 stroke-[3]" />
            </div>
            <div className="w-10 h-10 bg-white border-2 border-black flex items-center justify-center">
              <User className="text-black w-5 h-5 stroke-[3]" />
            </div>
          </div>
        </header>

        {/* Main Success Card */}
        <main className="flex flex-col items-center">
          <div className="bg-white border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 md:p-16 w-full text-center flex flex-col items-center gap-8">
            <div className="w-32 h-32 md:w-48 md:h-48 bg-[#00E676] border-[6px] border-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Check className="text-black w-20 h-20 md:w-32 md:h-32 stroke-[4]" />
            </div>

            <div className="space-y-4">
              <h1 className="text-black text-4xl md:text-6xl font-black leading-none tracking-tighter uppercase italic">
                {title}
              </h1>
              <p className="text-black text-lg md:text-xl font-medium max-w-md mx-auto">
                {subtitle}
              </p>
            </div>

            {/* Dynamic Progress Simulation */}
            <div className="w-full max-w-xs h-6 border-4 border-black bg-white overflow-hidden relative">
              <div
                className="h-full bg-[#25c0f4] border-r-4 border-black transition-all ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Supporting Status Badges */}
          <div className="mt-10 flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-2 bg-black text-white px-4 py-2 border-2 border-black font-bold uppercase text-sm">
              <Database className="w-4 h-4" /> Session: Secure
            </div>
            <div className="flex items-center gap-2 bg-white text-black px-4 py-2 border-2 border-black font-bold uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Lock className="w-4 h-4" /> Encryption Active
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
