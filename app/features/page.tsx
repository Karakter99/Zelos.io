"use client";

import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function FeaturesPage() {
  return (
    <div 
      className="bg-[#FFE600] font-sans text-black overflow-x-hidden min-h-screen flex flex-col selection:bg-[#25c0f4] selection:text-black"
      style={{
        backgroundImage: "radial-gradient(#000 2px, transparent 2px)",
        backgroundSize: "32px 32px",
      }}
    >
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 pt-12 pb-24 relative z-10 flex-grow w-full">
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row gap-12 items-center mb-32">
          <div className="lg:w-3/5">
            <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 rotate-[-1deg]">
              <h1 className="text-6xl md:text-8xl font-black leading-none uppercase mb-6 tracking-tighter">
                Exam <span className="text-[#25c0f4] italic">Management</span>, Brutally Simplified.
              </h1>
              <p className="text-xl md:text-2xl font-bold leading-tight max-w-2xl border-l-[6px] border-black pl-4">
                High-energy proctoring and analytics for modern educators. Built with zero-lag and Fort Knox security.
              </p>
            </div>
            <div className="flex flex-wrap gap-6">
              <button className="bg-[#25c0f4] border-4 border-black px-10 py-5 text-xl font-black uppercase shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                Start Free Trial
              </button>
              <button className="bg-white border-4 border-black px-10 py-5 text-xl font-black uppercase shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                View Demo
              </button>
            </div>
          </div>
          <div className="lg:w-2/5 relative">
            <div className="w-full aspect-square bg-[#25c0f4] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rotate-[3deg] overflow-hidden">
              <div 
                className="w-full h-full bg-cover bg-center" 
                style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBXaBMxlpay6j3C4w9wSO9sCBKz3PNvsytQOKkIh0HYvxOLa04ZNY9P4dTQTHANYiPZNqQhAIG9NoJZ4vfXIVwnYJv1SrGeqS7BcS8xd91zYsNnpTpjv5uJoviRmUPlciQEOxDtl0jSSO1pmvfikU_vkRYhP-KgMfWTx-xVwTHY2s3xkyP1AJ0LHFwAJE7IglM8aQsJy-iNvOzn1C3yBN_iZUtYTXsjwdoA_X_wSC-J64Wf4tIbD9yTy0nYujNp6pAfZyhAoqBKOv8')"}}
              ></div>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[-6deg] hidden md:block">
              <span className="text-2xl font-black italic">100% SECURE</span>
            </div>
          </div>
        </div>

        {/* Features Bento Grid */}
        <div className="mb-20">
          <h2 className="text-5xl font-black uppercase mb-12 flex items-center gap-4">
            <span className="bg-black text-[#FFD600] px-4 py-1">Core Features</span>
            <span className="material-symbols-outlined text-4xl">bolt</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Feature 1: Security */}
            <div className="md:col-span-7 bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group hover:bg-[#25c0f4] transition-colors cursor-pointer">
              <div className="flex justify-between items-start mb-8">
                <span className="material-symbols-outlined text-[6rem] leading-none mb-0 font-light">shield</span>
                <div className="bg-black text-white px-3 py-1 font-black text-xs uppercase tracking-widest border-2 border-black mt-2">Advanced</div>
              </div>
              <h3 className="text-4xl font-black uppercase mb-4 tracking-tighter">Fort Knox Security</h3>
              <p className="text-xl font-bold leading-snug">Heavy-duty encryption and AI-detection to keep your finals secure. No bypass, no leaks, just pure integrity.</p>
            </div>
            
            {/* Feature 2: Speed */}
            <div className="md:col-span-5 bg-[#25c0f4] border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rotate-[1deg] flex flex-col justify-between cursor-pointer hover:bg-white transition-colors">
              <div>
                <span className="material-symbols-outlined text-[6rem] leading-none mb-4">timer</span>
                <h3 className="text-4xl font-black uppercase mb-4 tracking-tighter">Zero-Lag Proctoring</h3>
              </div>
              <p className="text-xl font-bold leading-snug">Engineered for speed. No delays, no excuses. Real-time monitoring that actually works on any connection.</p>
            </div>
            
            {/* Feature 3: Analytics */}
            <div className="md:col-span-5 bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rotate-[-1deg] flex flex-col justify-between cursor-pointer hover:bg-[#FFD600] transition-colors">
              <div>
                <span className="material-symbols-outlined text-[6rem] leading-none mb-4">analytics</span>
                <h3 className="text-4xl font-black uppercase mb-4 tracking-tighter">Data that Screams</h3>
              </div>
              <p className="text-xl font-bold leading-snug">Visual data that actually makes sense. Bold charts for bold decisions. Insights delivered instantly.</p>
            </div>
            
            {/* Feature 4: Small Items */}
            <div className="md:col-span-7 grid grid-cols-2 gap-8">
              <div className="bg-black text-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#25c0f4] hover:-translate-y-2 transition-transform cursor-pointer">
                <span className="material-symbols-outlined text-[#25c0f4] text-5xl mb-2">psychology</span>
                <h4 className="text-2xl font-black uppercase mb-2">AI-Detection</h4>
                <p className="text-base font-bold text-gray-300">Smart monitoring that flags behavior, not just movement.</p>
              </div>
              <div className="bg-[#FFD600] border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-transform cursor-pointer">
                <span className="material-symbols-outlined text-black text-5xl mb-2">devices</span>
                <h4 className="text-2xl font-black uppercase mb-2">Multi-Device</h4>
                <p className="text-base font-bold">Phones, tablets, laptops. We run on everything.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Marquee Divider */}
        <div className="w-[110vw] relative left-1/2 -translate-x-1/2 bg-black text-white py-6 border-y-4 border-black rotate-[2deg] mb-32 overflow-hidden flex items-center">
          <div className="flex whitespace-nowrap gap-12 text-4xl font-black uppercase italic animate-pulse w-[200%]">
            <span>* Zero-Lag Architecture *</span>
            <span>* 24/7 Global Support *</span>
            <span>* Military Grade Encryption *</span>
            <span>* Zero-Lag Architecture *</span>
            <span>* 24/7 Global Support *</span>
            <span>* Military Grade Encryption *</span>
            <span>* Zero-Lag Architecture *</span>
            <span>* 24/7 Global Support *</span>
            <span>* Military Grade Encryption *</span>
          </div>
        </div>

        {/* Secondary Features Asymmetrical Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative z-10">
              <div className="aspect-video w-full bg-[#25c0f4]/20 flex items-center justify-center overflow-hidden border-2 border-black">
                <div 
                  className="w-full h-full bg-cover bg-center" 
                  style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBivtdd9udHWaCmUp63rHFNmlT5qs1PXYAEo0jP93850xI7cwfAxRlw-d-lh6-QByFakj-ysrkzi2-nyRmuMsFCPM7gZj44wrBq9GH5z7iJ90mZCfQS3Ce4VykY-7_bynsnqI_t2q4BXuskHgcZ_uHTu7M8yjLgzKaIYTrHTtAfDC9DkzJrn7Wc9fd52B5irMyQF01yTQ-thRIQihEOZMeiDRzZdd7cZ8w8aUybBRBVOu6dUKoJnvCK1iHiEws6Yxvfd9e6wbA11_U')"}}
                ></div>
              </div>
            </div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#FFD600] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -z-0 rotate-12 flex items-center justify-center p-4">
              <span className="text-black font-black text-center text-lg uppercase leading-tight">Optimized<br/>for Speed</span>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="space-y-8">
              <div className="inline-block bg-[#25c0f4] border-4 border-black px-4 py-1 text-sm font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Built for Enterprise</div>
              <h2 className="text-6xl font-black uppercase tracking-tighter leading-none">The Future of Testing is Here.</h2>
              <p className="text-xl font-bold border-l-[8px] border-[#25c0f4] pl-6 py-2">We didn't just build a platform; we built a powerhouse. Every feature is designed to reduce friction and maximize academic integrity.</p>
              <ul className="space-y-5 mt-8">
                <li className="flex items-center gap-4 text-xl font-extrabold uppercase bg-white border-2 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-1 hover:rotate-0 transition-transform cursor-default">
                  <span className="material-symbols-outlined bg-black text-white p-1 border-2 border-black text-sm">check</span>
                  Real-time ID Verification
                </li>
                <li className="flex items-center gap-4 text-xl font-extrabold uppercase bg-white border-2 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-1 hover:rotate-0 transition-transform cursor-default">
                  <span className="material-symbols-outlined bg-black text-white p-1 border-2 border-black text-sm">check</span>
                  Dynamic Question Randomization
                </li>
                <li className="flex items-center gap-4 text-xl font-extrabold uppercase bg-white border-2 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-1 hover:rotate-0 transition-transform cursor-default">
                  <span className="material-symbols-outlined bg-black text-white p-1 border-2 border-black text-sm">check</span>
                  Seamless LMS Integration
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-40 bg-black text-white border-4 border-black p-12 md:p-20 shadow-[12px_12px_0px_0px_#25c0f4] text-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-5xl md:text-7xl font-black uppercase mb-8 tracking-tighter">Ready to <span className="text-[#25c0f4] italic">Transform</span> Your Exams?</h2>
            <p className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto font-bold text-gray-300 italic">Join 500+ institutions already using ExamFlow for their high-stakes assessments.</p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button className="bg-[#25c0f4] text-black border-4 border-black px-12 py-6 text-2xl font-black uppercase shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">Get Started Now</button>
              <button className="bg-white text-black border-4 border-black px-12 py-6 text-2xl font-black uppercase shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">Talk to Sales</button>
            </div>
          </div>
          {/* Abstract floating shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#25c0f4] opacity-20 rotate-45 translate-x-32 -translate-y-32 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#FFD600] opacity-20 -rotate-12 -translate-x-12 translate-y-12 blur-2xl"></div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
