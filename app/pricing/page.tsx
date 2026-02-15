"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import { CheckCircle2, Share2, Mail, Globe } from "lucide-react";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div
      className="min-h-screen w-full flex flex-col font-sans selection:bg-black selection:text-[#fbbf24] bg-[#fbbf24]"
      style={{
        backgroundImage: "radial-gradient(#000000 2px, transparent 2px)",
        backgroundSize: "24px 24px",
        backgroundAttachment: "fixed",
      }}
    >
      <Navbar />

      {/* --- Main Content --- */}
      <main className="flex-grow flex flex-col items-center px-4 py-16 md:py-24 relative z-10">
        {/* Hero Title */}
        <div className="max-w-4xl text-center mb-16">
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-black uppercase leading-none tracking-tighter mb-6 bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000] inline-block">
            Simple Pricing
          </h2>
          <div className="mt-4">
            <p className="text-xl md:text-2xl font-bold bg-[#25c0f4] border-4 border-black inline-block px-4 py-2 shadow-[4px_4px_0px_0px_#000] uppercase text-black">
              For High-Stakes Exams
            </p>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center gap-6 mb-16 bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
          <span
            className={`text-xl font-black uppercase transition-colors ${!isAnnual ? "text-black" : "text-gray-400"}`}
          >
            Monthly
          </span>

          {/* Custom Toggle Switch */}
          <div
            className="relative inline-block w-16 h-8 align-middle select-none transition duration-200 ease-in cursor-pointer"
            onClick={() => setIsAnnual(!isAnnual)}
          >
            <div
              className={`absolute block w-8 h-8 rounded-full bg-white border-4 border-black appearance-none transition-all duration-200 ease-in-out z-10 ${isAnnual ? "right-0" : "right-8"}`}
            />
            <div className="block overflow-hidden h-8 rounded-full bg-black border-4 border-black" />
          </div>

          <span
            className={`text-xl font-black uppercase flex items-center gap-2 transition-colors ${isAnnual ? "text-black" : "text-gray-400"}`}
          >
            Annual{" "}
            <span className="bg-[#25c0f4] text-black text-xs px-2 py-1 border-4 border-black shadow-none ml-2">
              Save 20%
            </span>
          </span>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-7xl px-4">
          {/* Free Plan */}
          <div className="bg-white border-4 border-black p-8 flex flex-col shadow-[8px_8px_0px_0px_#000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_0px_#000] transition-all duration-200">
            <div className="mb-8">
              <h3 className="text-4xl font-black uppercase mb-2 text-black">
                Free
              </h3>
              <div className="flex items-baseline gap-1 text-black">
                <span className="text-6xl font-black">$0</span>
                <span className="text-xl font-bold uppercase">/mo</span>
              </div>
            </div>
            <button className="w-full bg-white border-4 border-black py-4 px-6 text-xl font-black uppercase shadow-[4px_4px_0px_0px_#000] mb-10 hover:bg-black hover:text-white active:translate-y-1 active:translate-x-1 active:shadow-none transition-all text-black">
              Select Free
            </button>
            <div className="space-y-6 flex-grow">
              <div className="flex items-start gap-4 text-black">
                <CheckCircle2
                  className="w-8 h-8 font-bold text-black shrink-0"
                  strokeWidth={3}
                />
                <span className="text-lg font-bold uppercase mt-1">
                  5 Exams per month
                </span>
              </div>
              <div className="flex items-start gap-4 text-black">
                <CheckCircle2
                  className="w-8 h-8 font-bold text-black shrink-0"
                  strokeWidth={3}
                />
                <span className="text-lg font-bold uppercase mt-1">
                  Basic analytics
                </span>
              </div>
              <div className="flex items-start gap-4 text-black">
                <CheckCircle2
                  className="w-8 h-8 font-bold text-black shrink-0"
                  strokeWidth={3}
                />
                <span className="text-lg font-bold uppercase mt-1">
                  Community support
                </span>
              </div>
            </div>
          </div>

          {/* Pro Plan (Scaled up) */}
          <div className="bg-white border-4 border-black p-8 flex flex-col shadow-[8px_8px_0px_0px_#000] relative md:scale-110 z-10 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_0px_#000] transition-all duration-200">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#25c0f4] border-4 border-black px-6 py-2 shadow-[4px_4px_0px_0px_#000]">
              <span className="text-xl font-black uppercase whitespace-nowrap text-black">
                Most Popular
              </span>
            </div>
            <div className="mb-8 mt-4 text-black">
              <h3 className="text-4xl font-black uppercase mb-2">Pro</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-black">
                  ${isAnnual ? "23" : "29"}
                </span>
                <span className="text-xl font-bold uppercase">/mo</span>
              </div>
            </div>
            <button className="w-full bg-[#25c0f4] border-4 border-black py-4 px-6 text-xl font-black uppercase shadow-[4px_4px_0px_0px_#000] mb-10 hover:bg-black hover:text-white active:translate-y-1 active:translate-x-1 active:shadow-none transition-all text-black">
              Get Started
            </button>
            <div className="space-y-6 flex-grow">
              <div className="flex items-start gap-4 text-black">
                <CheckCircle2
                  className="w-8 h-8 font-bold text-[#25c0f4] shrink-0"
                  strokeWidth={3}
                />
                <span className="text-lg font-bold uppercase mt-1">
                  Unlimited Exams
                </span>
              </div>
              <div className="flex items-start gap-4 text-black">
                <CheckCircle2
                  className="w-8 h-8 font-bold text-[#25c0f4] shrink-0"
                  strokeWidth={3}
                />
                <span className="text-lg font-bold uppercase mt-1">
                  AI Proctoring
                </span>
              </div>
              <div className="flex items-start gap-4 text-black">
                <CheckCircle2
                  className="w-8 h-8 font-bold text-[#25c0f4] shrink-0"
                  strokeWidth={3}
                />
                <span className="text-lg font-bold uppercase mt-1">
                  Custom branding
                </span>
              </div>
              <div className="flex items-start gap-4 text-black">
                <CheckCircle2
                  className="w-8 h-8 font-bold text-[#25c0f4] shrink-0"
                  strokeWidth={3}
                />
                <span className="text-lg font-bold uppercase mt-1">
                  Priority support
                </span>
              </div>
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-black border-4 border-black p-8 flex flex-col shadow-[8px_8px_0px_0px_#000] text-white hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_0px_#000] transition-all duration-200">
            <div className="mb-8">
              <h3 className="text-4xl font-black uppercase mb-2 text-white">
                Enterprise
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-[#25c0f4]">
                  Custom
                </span>
              </div>
            </div>
            <button className="w-full bg-white text-black border-4 border-white py-4 px-6 text-xl font-black uppercase shadow-[8px_8px_0px_0px_#25c0f4] mb-10 hover:bg-[#25c0f4] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all">
              Contact Us
            </button>
            <div className="space-y-6 flex-grow">
              <div className="flex items-start gap-4 text-white">
                <CheckCircle2
                  className="w-8 h-8 font-bold text-white shrink-0"
                  strokeWidth={3}
                />
                <span className="text-lg font-bold uppercase mt-1">
                  Custom integrations
                </span>
              </div>
              <div className="flex items-start gap-4 text-white">
                <CheckCircle2
                  className="w-8 h-8 font-bold text-white shrink-0"
                  strokeWidth={3}
                />
                <span className="text-lg font-bold uppercase mt-1">
                  Guaranteed SLA
                </span>
              </div>
              <div className="flex items-start gap-4 text-white">
                <CheckCircle2
                  className="w-8 h-8 font-bold text-white shrink-0"
                  strokeWidth={3}
                />
                <span className="text-lg font-bold uppercase mt-1">
                  Dedicated Manager
                </span>
              </div>
              <div className="flex items-start gap-4 text-white">
                <CheckCircle2
                  className="w-8 h-8 font-bold text-white shrink-0"
                  strokeWidth={3}
                />
                <span className="text-lg font-bold uppercase mt-1">
                  White-labeling
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Hint */}
        <div className="mt-24 text-center">
          <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000] max-w-2xl mx-auto">
            <h4 className="text-3xl font-black uppercase mb-4 text-black">
              Need a custom quote?
            </h4>
            <p className="text-xl font-bold mb-6 text-black">
              Our team of experts is ready to help you scale your testing
              platform.
            </p>
            <a
              className="text-2xl font-black uppercase text-black underline decoration-8 underline-offset-8 hover:bg-[#25c0f4] transition-colors px-2"
              href="#"
            >
              Talk to sales →
            </a>
          </div>
        </div>
      </main>

      {/* --- Massive Dark Footer --- */}
      <footer className="w-full bg-black text-white px-6 py-12 border-t-8 border-black z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#25c0f4] border-4 border-white shadow-[4px_4px_0px_0px_#ffffff]">
                <Globe className="text-black w-8 h-8 stroke-[3]" />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tighter text-white">
                ExamFlow
              </h2>
            </div>
            <p className="text-xl font-bold max-w-sm mb-6 uppercase text-gray-300">
              Modern exam administration for the bold generation.
            </p>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-white border-4 border-white flex items-center justify-center cursor-pointer hover:bg-[#25c0f4] hover:border-black hover:text-black transition-colors text-black">
                <Share2 className="w-6 h-6 stroke-[3]" />
              </div>
              <div className="w-12 h-12 bg-white border-4 border-white flex items-center justify-center cursor-pointer hover:bg-[#25c0f4] hover:border-black hover:text-black transition-colors text-black">
                <Mail className="w-6 h-6 stroke-[3]" />
              </div>
              <div className="w-12 h-12 bg-white border-4 border-white flex items-center justify-center cursor-pointer hover:bg-[#25c0f4] hover:border-black hover:text-black transition-colors text-black">
                <Globe className="w-6 h-6 stroke-[3]" />
              </div>
            </div>
          </div>

          <div>
            <h5 className="text-xl font-black uppercase mb-6 text-[#25c0f4]">
              Links
            </h5>
            <ul className="space-y-4 font-bold uppercase text-gray-300">
              <li>
                <a
                  className="hover:underline decoration-2 hover:text-white"
                  href="#"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  className="hover:underline decoration-2 hover:text-white"
                  href="#"
                >
                  Testimonials
                </a>
              </li>
              <li>
                <a
                  className="hover:underline decoration-2 hover:text-white"
                  href="#"
                >
                  API Docs
                </a>
              </li>
              <li>
                <a
                  className="hover:underline decoration-2 hover:text-white"
                  href="#"
                >
                  Privacy
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xl font-black uppercase mb-6 text-[#25c0f4]">
              Company
            </h5>
            <ul className="space-y-4 font-bold uppercase text-gray-300">
              <li>
                <a
                  className="hover:underline decoration-2 hover:text-white"
                  href="#"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  className="hover:underline decoration-2 hover:text-white"
                  href="#"
                >
                  Careers
                </a>
              </li>
              <li>
                <a
                  className="hover:underline decoration-2 hover:text-white"
                  href="#"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  className="hover:underline decoration-2 hover:text-white"
                  href="#"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-12 border-t-4 border-white/20 text-center uppercase font-black tracking-widest text-gray-400">
          © 2026 ExamFlow — No boundaries. Just flow.
        </div>
      </footer>
    </div>
  );
}
