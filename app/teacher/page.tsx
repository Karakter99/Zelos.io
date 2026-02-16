"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // 🟢 Added router for kicking out non-logged-in users
import { supabase } from "../utils/Supabase/client";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Trash2, AlertTriangle, Download } from "lucide-react";

// 🟢 Import SheetJS for Excel downloads
import * as XLSX from "xlsx";

const cardColors = ["bg-[#FF6B9E]", "bg-[#5A87FF]", "bg-[#FFE600]", "bg-white"];

type Exam = {
  id: string;
  code: string;
  title: string | null;
  is_active: boolean;
  created_at: string;
};

export default function TeacherDashboard() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. 🟢 FETCH ONLY THIS TEACHER'S EXAMS 🟢
  useEffect(() => {
    const fetchExams = async () => {
      try {
        // Step A: Find out who is currently logged in
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        // 🟢 FIX: If there is a Zombie Token or no user, kill the session completely!
        if (authError || !user) {
          console.warn(
            "Auth error or no user found. Clearing ghost session...",
          );
          await supabase.auth.signOut(); // 🧹 Wipes the corrupted token from the browser
          router.push("/"); // 🥾 Kicks them back to your home/login page
          return;
        }

        // Step B: Ask the database ONLY for exams matching their ID
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
    e.preventDefault();
    e.stopPropagation();

    if (
      !window.confirm(
        "⚠️ WARNING: Are you sure you want to delete this exam? All student results will be lost forever!",
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase.from("exams").delete().eq("id", examId);
      if (error) throw error;
      setExams((prevExams) => prevExams.filter((exam) => exam.id !== examId));
    } catch (err: unknown) {
      console.error("Delete Error:", err);
      alert("Failed to delete the exam.");
    }
  };

  // 📥 HANDLE DOWNLOADING RESULTS TO EXCEL
  const handleDownloadResults = async (
    e: React.MouseEvent,
    examCode: string,
    examTitle: string | null,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const { data: students, error: studentErr } = await supabase
        .from("students")
        .select("*")
        .ilike("exam_code", `%${examCode}%`);

      if (studentErr) throw studentErr;

      if (!students || students.length === 0) {
        alert("No students have taken this exam yet!");
        return;
      }

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

      const excelData = students.map((s) => {
        const correct = s.score || 0;
        const mistakes = totalQuestions - correct;
        const percentage = Math.round((correct / totalQuestions) * 100) || 0;

        return {
          "Student Name": s.name,
          Status: s.status === "finished" ? "Completed" : "Incomplete",
          "Correct Answers": correct,
          Mistakes: mistakes,
          "Final Score (%)": `${percentage}%`,
          "Caught Cheating?": s.detention_end_time ? "YES 🚨" : "No",
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Grades");

      const safeTitle = examTitle
        ? examTitle.replace(/[^a-z0-9]/gi, "_")
        : "Exam";
      XLSX.writeFile(workbook, `${safeTitle}_Results.xlsx`);
    } catch (err: unknown) {
      console.error("Download Error:", err);
      alert("Failed to generate Excel file. Check console for details.");
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
          <Link
            href="/teacher/create"
            className="bg-white border-[6px] border-black shadow-[16px_16px_0px_0px_#000] p-6 md:p-10 text-center hover:translate-x-2 hover:translate-y-2 hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-4 active:translate-y-4 active:shadow-none transition-all group"
          >
            <h1 className="text-4xl md:text-6xl font-black text-black uppercase tracking-tighter group-hover:scale-[1.02] transition-transform">
              + Create New Exam
            </h1>
          </Link>

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
                automatically deleted{" "}
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
              const colorClass = cardColors[index % cardColors.length];
              const isDraft = !exam.is_active;

              return (
                <Link
                  href={`/teacher/monitor/${exam.code}`}
                  key={exam.id}
                  className={`${colorClass} border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-8 md:p-10 flex flex-col justify-between aspect-video md:aspect-auto md:min-h-[280px] hover:translate-x-2 hover:translate-y-2 hover:shadow-[4px_4px_0px_0px_#000] transition-all cursor-pointer group`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <h2 className="text-4xl md:text-5xl font-black text-black uppercase leading-[1.1] tracking-tighter break-words">
                      {exam.title || "Untitled Exam"}
                    </h2>

                    {/* 🟢 ACTION BUTTONS: DOWNLOAD & DELETE */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={(e) =>
                          handleDownloadResults(e, exam.code, exam.title)
                        }
                        className="bg-white text-black border-4 border-black p-3 shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none hover:bg-[#a855f7] hover:text-white transition-all group/btn"
                        title="Download Results to Excel"
                      >
                        <Download className="w-8 h-8 stroke-[3] group-hover/btn:animate-bounce" />
                      </button>

                      <button
                        onClick={(e) => handleDelete(e, exam.id)}
                        className="bg-white text-black border-4 border-black p-3 shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none hover:bg-black hover:text-[#FF6B9E] transition-all"
                        title="Delete Exam"
                      >
                        <Trash2 className="w-8 h-8 stroke-[3]" />
                      </button>
                    </div>
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
