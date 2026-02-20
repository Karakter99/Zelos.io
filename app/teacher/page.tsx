"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../utils/Supabase/client";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  Trash2,
  AlertTriangle,
  Download,
  Monitor,
  Plus,
  Clock,
} from "lucide-react";
import * as XLSX from "xlsx";

const rowColors = ["bg-[#FF6B9E]", "bg-[#5A87FF]", "bg-[#FFE600]", "bg-white"];

type Exam = {
  id: string;
  code: string;
  title: string | null;
  time_limit: number | null;
  is_active: boolean;
  created_at: string;
};

export default function TeacherDashboard() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          await supabase.auth.signOut();
          router.push("/");
          return;
        }

        const { data, error: dbError } = await supabase
          .from("exams")
          .select("*")
          .eq("teacher_id", user.id)
          .order("created_at", { ascending: false });

        if (dbError) throw dbError;
        if (data) setExams(data);
      } catch (err: unknown) {
        console.error("Error fetching exams:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString)
      .toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
      .toUpperCase();
  };

  // 🗑️ Handle Exam Deletion
  const handleDelete = async (e: React.MouseEvent, examId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("⚠️ WARNING: Delete this exam? Results will be lost."))
      return;

    try {
      const { error } = await supabase.from("exams").delete().eq("id", examId);
      if (error) throw error;
      setExams((prev) => prev.filter((exam) => exam.id !== examId));
    } catch (err) {
      console.error("Delete Error:", err);
      alert("Failed to delete exam.");
    }
  };

  // 📥 HANDLE DOWNLOAD
  const handleDownloadResults = async (
    e: React.MouseEvent,
    examCode: string,
    examTitle: string | null,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const { data: students, error } = await supabase
        .from("students")
        .select("*")
        .ilike("exam_code", `%${examCode}%`);
      if (error) throw error;
      if (!students || students.length === 0)
        return alert("No students found for this exam.");

      const { data: examData } = await supabase
        .from("exams")
        .select("id")
        .eq("code", examCode)
        .single();
      let totalQuestions = 1;

      if (examData) {
        const { count } = await supabase
          .from("questions")
          .select("*", { count: "exact", head: true })
          .eq("exam_id", examData.id);
        if (count) totalQuestions = count;
      }

      const excelData = students.map((s) => ({
        "Student Name": s.name,
        Status: s.status === "finished" ? "Completed" : "Incomplete",
        Score: s.score || 0,
        Total: totalQuestions,
        Percentage: `${Math.round(((s.score || 0) / totalQuestions) * 100) || 0}%`,
        "Cheating Flag": s.detention_end_time ? "YES" : "No",
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Grades");
      XLSX.writeFile(
        workbook,
        `${examTitle?.replace(/[^a-z0-9]/gi, "_") || "Exam"}_Results.xlsx`,
      );
    } catch (err) {
      console.error("Download Error:", err);
      alert("Failed to download.");
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

      <main className="flex-grow flex flex-col md:flex-row p-6 md:p-12 gap-8 md:gap-12 relative z-10 max-w-[1600px] mx-auto w-full">
        <div className="absolute top-0 bottom-0 left-[340px] w-2 bg-black hidden md:block z-0 -ml-4" />
        <div className="absolute top-[200px] left-[340px] right-0 h-2 bg-black hidden md:block z-0" />

        {/* 1. LEFT SIDEBAR */}
        <nav className="w-full md:w-72 bg-[#00E57A] border-[6px] border-black shadow-[16px_16px_0px_0px_#000] p-8 md:p-10 flex flex-col gap-8 h-fit z-10 shrink-0">
          <Link
            href="/teacher"
            className="text-3xl font-black text-black uppercase hover:translate-x-2 transition-transform opacity-50 hover:opacity-100"
          >
            Dashboard
          </Link>
          <Link
            href="/teacher/new"
            className="text-3xl font-black text-black uppercase hover:translate-x-2 transition-transform opacity-50 hover:opacity-100"
          >
            Exam
          </Link>
          <Link
            href="#"
            className="text-3xl font-black text-black uppercase hover:translate-x-2 transition-transform opacity-50 pointer-events-none"
          >
            Students
          </Link>
          <Link
            href="/teacher/settings"
            className="text-3xl font-black text-black uppercase hover:translate-x-2 transition-transform opacity-50 hover:opacity-100"
          >
            Settings
          </Link>
        </nav>

        {/* 2. RIGHT CONTENT AREA */}
        <div className="flex-1 flex flex-col gap-8 z-10 w-full animate-in slide-in-from-bottom-8 duration-500">
          <Link
            href="/teacher/create"
            className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-6 md:p-8 text-center hover:translate-x-2 hover:translate-y-2 hover:shadow-[4px_4px_0px_0px_#000] active:translate-x-4 active:translate-y-4 active:shadow-none transition-all group flex flex-col md:flex-row items-center justify-center gap-4"
          >
            <Plus className="w-12 h-12 stroke-[4] text-black group-hover:rotate-90 transition-transform duration-300" />
            <h1 className="text-3xl md:text-5xl font-black text-black uppercase tracking-tighter">
              Create New Exam
            </h1>
          </Link>

          <div className="bg-black text-white border-[6px] border-black shadow-[8px_8px_0px_0px_#FF6B9E] p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="bg-[#FF6B9E] p-3 border-4 border-black shrink-0 animate-pulse">
              <AlertTriangle className="w-8 h-8 text-black stroke-[3]" />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-widest text-xl text-[#FF6B9E] mb-1">
                Teacher Dashboard
              </h3>
              <p className="font-bold uppercase text-sm md:text-base text-white/80">
                This is your command center. Use the{" "}
                <span className="text-[#00E57A]">Manager</span> tab to edit or
                duplicate exams.
              </p>
            </div>
          </div>

          {/* 🟢 LIST VIEW FOR EXAMS */}
          <div className="flex flex-col gap-6 pt-4">
            {loading && (
              <p className="text-2xl font-black uppercase p-8 bg-white border-4 border-black w-fit">
                Loading...
              </p>
            )}

            {!loading && exams.length === 0 && (
              <div className="bg-white border-[6px] border-black shadow-[8px_8px_0px_0px_#000] p-10">
                <h2 className="text-4xl font-black uppercase">No Exams Yet</h2>
                <p className="text-xl font-bold mt-2">
                  Click "Create New Exam" to get started.
                </p>
              </div>
            )}

            {exams.map((exam, index) => {
              const colorClass = rowColors[index % rowColors.length];

              return (
                <div
                  key={exam.id}
                  className={`${colorClass} border-[6px] border-black shadow-[8px_8px_0px_0px_#000] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_#000] transition-all group`}
                >
                  <div className="flex-1">
                    <h2 className="text-3xl md:text-4xl font-black text-black uppercase leading-[1.1] tracking-tighter break-words mb-3">
                      {exam.title || "Untitled"}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 font-bold uppercase text-black/80 text-sm md:text-base">
                      <span className="flex items-center gap-1 bg-white/50 px-2 py-1 border-2 border-black">
                        <Clock className="w-4 h-4" />{" "}
                        {exam.time_limit
                          ? `${exam.time_limit} MIN`
                          : "NO LIMIT"}
                      </span>
                      <span className="bg-white/50 px-2 py-1 border-2 border-black">
                        CODE: {exam.code}
                      </span>
                      <span className="bg-black/10 px-2 py-1 border-2 border-black/20">
                        {formatDate(exam.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap md:flex-nowrap items-center gap-3 shrink-0 w-full md:w-auto">
                    <button
                      onClick={(e) =>
                        handleDownloadResults(e, exam.code, exam.title)
                      }
                      className="bg-white text-black border-[4px] border-black p-3 md:p-4 shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none hover:bg-[#a855f7] hover:text-white transition-all group/btn"
                      title="Download Results"
                    >
                      <Download className="w-6 h-6 md:w-7 md:h-7 stroke-[3] group-hover/btn:animate-bounce" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, exam.id)}
                      className="bg-white text-black border-[4px] border-black p-3 md:p-4 shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none hover:bg-black hover:text-[#FF6B9E] transition-all"
                      title="Delete Exam"
                    >
                      <Trash2 className="w-6 h-6 md:w-7 md:h-7 stroke-[3]" />
                    </button>
                    <Link
                      href={`/teacher/monitor/${exam.code}`}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-black text-white px-6 py-4 font-black uppercase tracking-widest border-[4px] border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none hover:bg-[#00E57A] hover:text-black transition-all whitespace-nowrap"
                    >
                      <Monitor className="w-6 h-6 stroke-[3]" /> Monitor
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
