"use client";

import React from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { 
  Building, 
  Send, 
  BarChart, 
  Edit, 
  Download,
  Terminal
} from "lucide-react";
import * as XLSX from "xlsx";

interface ExcelQuestionRow {
  text: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  answer: string;
}

export default function HowItWorks() {
  const downloadTemplate = () => {
    const templateData: ExcelQuestionRow[] = [
      {
        text: "What is 2 + 2?",
        option1: "3",
        option2: "4",
        option3: "5",
        option4: "6",
        answer: "4",
      },
      {
        text: "What is the capital of France?",
        option1: "Berlin",
        option2: "London",
        option3: "Paris",
        option4: "Rome",
        answer: "Paris",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");

    XLSX.writeFile(workbook, "exam_template.xlsx");
  };

  return (
    <div 
      className="bg-[#FFE600] font-sans text-[#101e22] overflow-x-hidden min-h-screen flex flex-col selection:bg-[#25c0f4] selection:text-black"
      style={{
        backgroundImage: "radial-gradient(#000 2px, transparent 2px)",
        backgroundSize: "32px 32px",
      }}
    >
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-15">
        <span className="absolute text-9xl top-10 left-10 rotate-12 font-black">A+</span>
        <span className="absolute text-8xl top-1/4 right-20 -rotate-12 font-black">∑</span>
        <span className="absolute text-[12rem] bottom-20 left-1/3 rotate-45 font-black">?</span>
        <span className="absolute text-[15rem] -bottom-10 right-10 -rotate-12 font-black">π</span>
      </div>

      <Navbar />

      <main className="relative z-10 flex-grow px-6 pt-20 pb-32">
        <div className="max-w-5xl mx-auto text-center mb-24">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase mb-6 leading-none">
            High-Impact <br /> 
            <span className="bg-[#101e22] text-white px-4">Workflow.</span>
          </h1>
          <p className="text-xl md:text-2xl font-bold max-w-2xl mx-auto uppercase">
            Build, distribute, and analyze exams with neo-brutalist precision. No fluff, just results.
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-24">
          {/* Step 1: Create & Spreadsheet Logic */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-[#101e22] text-white p-10 border-4 border-black shadow-[8px_8px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] transition-all group">
              <div className="flex items-start justify-between mb-8">
                <span className="text-8xl font-black text-[#25c0f4] leading-none">01</span>
                <Building className="w-16 h-16 text-white group-hover:rotate-12 transition-transform" />
              </div>
              <h2 className="text-4xl font-black uppercase mb-4 tracking-tighter">Create & Upload</h2>
              <p className="text-lg text-gray-400 font-medium leading-relaxed mb-6">
                Build your exams in seconds by uploading a spreadsheet. Our system supports Multiple Choice, True/False, and Short Answer formats.
              </p>
              
              <div className="bg-white/10 p-4 border-2 border-dashed border-[#25c0f4] mb-6">
                <h4 className="text-[#25c0f4] font-black uppercase text-sm mb-2 flex items-center gap-2">
                  <Terminal className="w-4 h-4" /> Spreadsheet Requirements:
                </h4>
                <ul className="text-xs font-bold uppercase space-y-1 text-gray-300">
                  <li>• Columns: text, type, option1, option2, option3, option4, answer</li>
                  <li>• Types: multiple_choice, true_false, short_answer</li>
                </ul>
              </div>

              <button 
                onClick={downloadTemplate}
                className="w-full bg-white text-black font-bold px-8 py-3 rounded-full border-2 border-black hover:bg-[#25c0f4] transition-colors uppercase italic flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Get Template & Upload
              </button>
            </div>
            <div className="relative aspect-square border-4 border-black bg-[#101e22] shadow-[8px_8px_0px_0px_#000] flex items-center justify-center overflow-hidden">
               <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(#25c0f4 2px, transparent 2px)", backgroundSize: "30px 30px" }}></div>
               <div className="z-10 bg-white border-4 border-black p-6 rotate-3 shadow-[8px_8px_0px_0px_#25c0f4]">
                  <p className="font-black text-black">exam_template.xlsx</p>
                  <div className="mt-2 space-y-2">
                    <div className="h-2 w-32 bg-gray-200"></div>
                    <div className="h-2 w-24 bg-gray-200"></div>
                  </div>
               </div>
            </div>
          </div>

          {/* Step 2: Share */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 relative aspect-square border-4 border-black bg-[#101e22] shadow-[8px_8px_0px_0px_#000] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(#25c0f4 2px, transparent 2px)", backgroundSize: "30px 30px" }}></div>
                <div className="z-10 bg-[#25c0f4] border-4 border-black p-8 -rotate-3 font-black text-2xl text-black">
                  CODE: AX79B2
                </div>
            </div>
            <div className="order-1 md:order-2 bg-[#101e22] text-white p-10 border-4 border-black shadow-[8px_8px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] transition-all group">
              <div className="flex items-start justify-between mb-8">
                <span className="text-8xl font-black text-[#25c0f4] leading-none">02</span>
                <Send className="w-16 h-16 text-white group-hover:-translate-y-2 transition-transform" />
              </div>
              <h2 className="text-4xl font-black uppercase mb-4 tracking-tighter">Share & Lock</h2>
              <p className="text-lg text-gray-400 font-medium leading-relaxed mb-6">
                Every exam generates a unique 6-digit access code. Students join instantly. Our "Integrity Guard" detects tab-switching and locks cheaters in a detention math-solving mode.
              </p>
              <Link href="/teacher">
                <button className="bg-white text-black font-bold px-8 py-3 rounded-full border-2 border-black hover:bg-[#25c0f4] transition-colors uppercase italic">
                  Manage Exams
                </button>
              </Link>
            </div>
          </div>

          {/* Step 3: Analyze */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-[#101e22] text-white p-10 border-4 border-black shadow-[8px_8px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] transition-all group">
              <div className="flex items-start justify-between mb-8">
                <span className="text-8xl font-black text-[#25c0f4] leading-none">03</span>
                <BarChart className="w-16 h-16 text-white group-hover:scale-110 transition-transform" />
              </div>
              <h2 className="text-4xl font-black uppercase mb-4 tracking-tighter">Analyze Real-Time</h2>
              <p className="text-lg text-gray-400 font-medium leading-relaxed mb-6">
                Monitor student progress as it happens. Our auto-grading engine processes results the moment the exam ends, providing instant grade distribution and performance heatmaps.
              </p>
              <Link href="/teacher/monitor">
                <button className="bg-white text-black font-bold px-8 py-3 rounded-full border-2 border-black hover:bg-[#25c0f4] transition-colors uppercase italic">
                  View Live Monitor
                </button>
              </Link>
            </div>
            <div className="relative aspect-square border-4 border-black bg-[#101e22] shadow-[8px_8px_0px_0px_#000] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(#25c0f4 2px, transparent 2px)", backgroundSize: "30px 30px" }}></div>
                <div className="w-2/3 space-y-4">
                  <div className="h-8 bg-[#00E57A] border-2 border-black w-full shadow-[4px_4px_0px_0px_#000]"></div>
                  <div className="h-8 bg-[#25c0f4] border-2 border-black w-3/4 shadow-[4px_4px_0px_0px_#000]"></div>
                  <div className="h-8 bg-white border-2 border-black w-1/2 shadow-[4px_4px_0px_0px_#000]"></div>
                </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <section className="max-w-5xl mx-auto mt-40 text-center">
          <div className="bg-[#101e22] text-white p-16 border-4 border-black shadow-[12px_12px_0px_0px_#000] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#25c0f4] border-4 border-black -mr-16 -mt-16 rotate-45"></div>
            <h2 className="text-5xl md:text-7xl font-black uppercase mb-8 leading-tight">Ready to start?</h2>
            <Link href="/teacher/signup">
              <button className="bg-[#25c0f4] text-black text-2xl font-black px-12 py-6 rounded-full border-4 border-black hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_#000] transition-all active:translate-y-0 uppercase italic">
                Create Teacher Account
              </button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}