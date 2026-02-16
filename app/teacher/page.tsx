"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../utils/Supabase/client";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Trash2, AlertTriangle } from "lucide-react";

// Array of colors to cycle through for the cards, exactly like your image
const cardColors = ["bg-[#FF6B9E]", "bg-[#5A87FF]", "bg-[#FFE600]", "bg-white"];

type Exam = {
  id: string;
  code: string;
  title: string | null;
  is_active: boolean;
  created_at: string;
};

export default function TeacherDashboard() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      // Fetch all exams created by teachers
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) setExams(data);
      setLoading(false);
    };

    fetchExams();
  }, []);

  // Helper to format dates like "OCT 26, 2024"
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date
      .toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
      .toUpperCase();
  };

  // 🗑️ Handle Exam Deletion
  const handleDelete = async (e: React.MouseEvent, examId: string) => {
    // Stop the <Link> component from navigating to the exam page when clicking delete
    e.preventDefault();
    e.stopPropagation();

    // Confirm before deleting
    if (
      !window.confirm(
        "⚠️ WARNING: Are you sure you want to delete this exam? All student results will be lost forever!",
      )
    ) {
      return;
    }

    try {
      // Delete from Supabase Database
      const { error } = await supabase.from("exams").delete().eq("id", examId);

      if (error) throw error;

      // Update the UI instantly by filtering out the deleted exam
      setExams((prevExams) => prevExams.filter((exam) => exam.id !== examId));
    } catch (err: unknown) {
      console.error("Delete Error:", err);
      alert("Failed to delete the exam.");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col font-sans selection:bg-black selection:text-[#facc15] bg-[#FFE600]"
      style={{
        backgroundImage: "radial-gradient(circle, #000 2px, transparent 2px)",
        backgroundSize: "32px 32px",
        backgroundAttachment: "fixed",
      }}
    >
      <Navbar />

      {/* --- Main Dashboard Content --- */}
      <main className="flex-grow flex flex-col md:flex-row p-6 md:p-12 gap-8 md:gap-12 relative z-10 max-w-[1600px] mx-auto w-full">
        {/* Decorative Grid Lines (Behind content) */}
        <div className="absolute top-0 bottom-0 left-[340px] w-2 bg-black hidden md:block z-0 -ml-4" />
        <div className="absolute top-[200px] left-[340px] right-0 h-2 bg-black hidden md:block z-0" />

        {/* 1. LEFT SIDEBAR (Green Block) */}
        <nav className="w-full md:w-72 bg-[#00E57A] border-[6px] border-black shadow-[16px_16px_0px_0px_#000] p-8 md:p-10 flex flex-col gap-8 h-fit z-10 shrink-0">
          <Link
            href="/teacher"
            className="text-3xl font-black text-black uppercase hover:translate-x-2 transition-transform"
          >
            Dashboard
          </Link>
          <Link
            href="#"
            className="text-3xl font-black text-black uppercase hover:translate-x-2 transition-transform opacity-50 pointer-events-none"
          >
            Exams
          </Link>
          <Link
            href="#"
            className="text-3xl font-black text-black uppercase hover:translate-x-2 transition-transform opacity-50 pointer-events-none"
          >
            Students
          </Link>
          <Link
            href="#"
            className="text-3xl font-black text-black uppercase hover:translate-x-2 transition-transform opacity-50 pointer-events-none"
          >
            Settings
          </Link>
        </nav>

        {/* 2. RIGHT CONTENT AREA */}
        <div className="flex-1 flex flex-col gap-12 z-10 w-full">
          {/* Top Banner Button */}
          <Link
            href="/teacher/create"
            className="bg-white border-[6px] border-black shadow-[16px_16px_0px_0px_#000] p-6 md:p-10 text-center hover:translate-x-2 hover:translate-y-2 hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-4 active:translate-y-4 active:shadow-none transition-all group"
          >
            <h1 className="text-4xl md:text-6xl font-black text-black uppercase tracking-tighter group-hover:scale-[1.02] transition-transform">
              + Create New Exam
            </h1>
          </Link>

          {/* ⚠️ 2-MONTH DELETION WARNING BANNER */}
          <div className="bg-black text-white border-[6px] border-black shadow-[8px_8px_0px_0px_#FF6B9E] p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="bg-[#FF6B9E] p-3 border-4 border-black shrink-0 animate-pulse">
              <AlertTriangle className="w-10 h-10 text-black stroke-[3]" />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-widest text-xl text-[#FF6B9E] mb-1">
                System Notice
              </h3>
              <p className="font-bold uppercase text-sm md:text-base text-white/80">
                To maintain server speed, all exams and student data are
                automatically permanently deleted{" "}
                <span className="text-white underline decoration-[#FF6B9E] decoration-4 underline-offset-4">
                  2 months after creation
                </span>
                .
              </p>
            </div>
          </div>

          {/* Exam Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-8 pt-4">
            {loading && (
              <p className="text-2xl font-black uppercase p-8 bg-white border-4 border-black w-fit">
                Loading Exams...
              </p>
            )}

            {!loading && exams.length === 0 && (
              <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-10 col-span-full">
                <h2 className="text-4xl font-black uppercase">No Exams Yet</h2>
                <p className="text-xl font-bold mt-2">
                  Click the button above to create your first exam.
                </p>
              </div>
            )}

            {exams.map((exam, index) => {
              // Cycle through the colors array based on the index
              const colorClass = cardColors[index % cardColors.length];
              const isDraft = !exam.is_active;

              return (
                <Link
                  href={`/teacher/exam/${exam.code}`}
                  key={exam.id}
                  className={`${colorClass} border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-8 md:p-10 flex flex-col justify-between aspect-video md:aspect-auto md:min-h-[280px] hover:translate-x-2 hover:translate-y-2 hover:shadow-[4px_4px_0px_0px_#000] transition-all cursor-pointer group`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <h2 className="text-4xl md:text-5xl font-black text-black uppercase leading-[1.1] tracking-tighter break-words">
                      {exam.title || "Untitled Exam"}
                    </h2>

                    {/* 🗑️ DELETE BUTTON */}
                    <button
                      onClick={(e) => handleDelete(e, exam.id)}
                      className="bg-white text-black border-4 border-black p-3 shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none hover:bg-black hover:text-[#FF6B9E] transition-all shrink-0"
                      title="Delete Exam"
                    >
                      <Trash2 className="w-8 h-8 stroke-[3]" />
                    </button>
                  </div>

                  <div className="flex justify-between items-end mt-12 font-black text-black uppercase tracking-widest text-sm md:text-base">
                    <span>{formatDate(exam.created_at)}</span>
                    <span className="bg-black/10 px-3 py-1 border-2 border-black/20">
                      {isDraft ? "DRAFT" : "ACTIVE"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
