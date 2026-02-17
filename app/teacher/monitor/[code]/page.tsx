"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/utils/Supabase/client";
import Navbar from "@/app/components/Navbar";
import {
  AlertTriangle,
  CheckCircle2,
  Activity,
  Lock,
  Users,
  Download,
  Unlock,
  PlayCircle,
  Radio,
} from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";

interface Exam {
  id: string;
  title?: string;
  status?: string;
}

interface Student {
  id: string;
  name: string;
  status: string;
  detention_end_time: string | null;
  current_question_index: number;
  score: number;
}

export default function LiveCheatMonitor() {
  const params = useParams();
  const router = useRouter();
  const rawCode = params.code as string;
  const examCode = rawCode
    ? decodeURIComponent(rawCode).trim().toUpperCase()
    : "";

  const [exam, setExam] = useState<Exam | null>(null);
  const [examStatus, setExamStatus] = useState<string>("waiting");
  const [students, setStudents] = useState<Student[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!examCode) return;

    const fetchData = async () => {
      try {
        const { data: examData, error: examErr } = await supabase
          .from("exams")
          .select("*")
          .ilike("code", `%${examCode}%`)
          .single();

        if (examData) {
          setExam(examData);
          setExamStatus(examData.status || "waiting");

          const { count } = await supabase
            .from("questions")
            .select("*", { count: "exact", head: true })
            .eq("exam_id", examData.id);

          setTotalQuestions(count || 1);
        }

        const { data: studentData, error: studentErr } = await supabase
          .from("students")
          .select("*")
          .ilike("exam_code", `%${examCode}%`)
          .order("created_at", { ascending: false });

        if (studentErr) console.error("❌ Supabase Error:", studentErr.message);

        if (studentData && studentData.length > 0) {
          setStudents(studentData as unknown as Student[]);
        }
      } catch (err: unknown) {
        console.error("Data Sync Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [examCode]);

  // --- 🟢 MASTER SWITCH FUNCTION 🟢 ---
  const handleStartExam = async () => {
    if (
      !window.confirm(
        "Are you sure? This will instantly start the timer for all students!",
      )
    )
      return;

    try {
      const now = new Date().toISOString();
      await supabase
        .from("exams")
        .update({ status: "live", started_at: now })
        .eq("id", exam?.id);

      setExamStatus("live");
    } catch (err: unknown) {
      console.error("Error starting exam:", err);
      alert("Failed to start exam.");
    }
  };

  const exportToExcel = () => {
    if (students.length === 0) return alert("No students to export yet!");

    const data = students.map((s) => {
      const correct = s.score || 0;
      const mistakes = totalQuestions - correct;
      const percentage = Math.round((correct / totalQuestions) * 100) || 0;

      return {
        "Student Name": s.name,
        Status: s.status === "finished" ? "Completed" : "Active/Quit",
        "Questions Answered": `${s.current_question_index} / ${totalQuestions}`,
        "Correct Answers": correct,
        Mistakes: mistakes,
        "Final Score (%)": `${percentage}%`,
        "Caught Cheating?": s.detention_end_time ? "🚨 YES" : "No",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");

    const safeTitle = exam?.title
      ? exam.title.replace(/[^a-z0-9]/gi, "_")
      : "Exam";
    XLSX.writeFile(workbook, `${safeTitle}_Class_Results.xlsx`);
  };

  const handleRemoveSuspension = async (studentId: string) => {
    if (!window.confirm("Are you sure you want to unlock this student?"))
      return;
    try {
      await supabase
        .from("students")
        .update({ status: "active", detention_end_time: null })
        .eq("id", studentId);
      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId
            ? { ...s, status: "active", detention_end_time: null }
            : s,
        ),
      );
    } catch (err: unknown) {
      console.error("Failed to unlock:", err);
    }
  };

  const handleForceBlock = async (studentId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to send this student to detention?",
      )
    )
      return;
    const penaltyTime = new Date(Date.now() + 120000).toISOString();
    try {
      await supabase
        .from("students")
        .update({ status: "detention", detention_end_time: penaltyTime })
        .eq("id", studentId);
      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId
            ? { ...s, status: "detention", detention_end_time: penaltyTime }
            : s,
        ),
      );
    } catch (err: unknown) {
      console.error("Failed to force block:", err);
    }
  };

  const activeCount = students.filter(
    (s) => s.status === "active" && !s.detention_end_time,
  ).length;
  const finishedCount = students.filter((s) => s.status === "finished").length;
  const caughtCount = students.filter((s) => s.detention_end_time).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFE600] flex items-center justify-center font-black text-6xl border-[16px] border-black uppercase tracking-tighter">
        Initializing Radar...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col font-sans selection:bg-black selection:text-[#00E57A] bg-[#FFE600]"
      style={{
        backgroundImage: "radial-gradient(circle, #000 2px, transparent 2px)",
        backgroundSize: "32px 32px",
        backgroundAttachment: "fixed",
      }}
    >
      <Navbar />

      <main className="flex-grow flex flex-col p-6 md:p-12 relative z-10 max-w-[1600px] mx-auto w-full gap-8">
        <div className=" text-black bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <div className="bg-black text-white inline-block px-4 py-1 font-black uppercase tracking-widest text-sm mb-4 border-2 border-black shadow-[4px_4px_0px_0px_#25c0f4]">
              Live Monitor
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-black uppercase tracking-tighter leading-none">
              {exam?.title || "Exam"}
            </h1>
            <p className="text-2xl font-bold mt-2">
              CODE:{" "}
              <span className="bg-[#FFE600] px-2 border-2 border-black">
                {examCode}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* 🟢 THE MASTER SWITCH UI (SMALLER ICON) 🟢 */}
            {examStatus === "waiting" || !examStatus ? (
              <button
                onClick={handleStartExam}
                className="bg-[#00E57A] text-black border-4 border-black shadow-[6px_6px_0px_0px_#000] p-4 flex items-center gap-3 hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:bg-black active:text-white transition-all group animate-pulse"
              >
                <PlayCircle className="w-7 h-7 stroke-[3]" />
                <div className="text-left">
                  <div className="text-2xl font-black uppercase leading-none tracking-tighter">
                    Start Exam
                  </div>
                  <div className="text-xs font-black uppercase tracking-widest opacity-80">
                    Waiting Room
                  </div>
                </div>
              </button>
            ) : (
              <div className="bg-black text-[#00E57A] border-4 border-black shadow-[6px_6px_0px_0px_#00E57A] p-4 flex items-center gap-3">
                <Radio className="w-7 h-7 stroke-[3] animate-pulse" />
                <div className="text-left">
                  <div className="text-2xl font-black uppercase leading-none tracking-tighter">
                    Live
                  </div>
                  <div className="text-xs font-black uppercase tracking-widest opacity-80">
                    Test Active
                  </div>
                </div>
              </div>
            )}

            {/* Total Students Box (SMALLER ICON) */}
            <div className="bg-[#5A87FF] border-4 border-black shadow-[6px_6px_0px_0px_#000] p-4 flex items-center gap-3">
              <Users className="w-7 h-7 text-white stroke-[3]" />
              <div>
                <div className="text-3xl font-black text-white leading-none">
                  {students.length}
                </div>
                <div className="text-xs font-black uppercase tracking-widest text-white/80">
                  Total
                </div>
              </div>
            </div>

            {/* Finished Box (SMALLER ICON) */}
            <div className="bg-[#00E57A] border-4 border-black shadow-[6px_6px_0px_0px_#000] p-4 flex items-center gap-3">
              <CheckCircle2 className="w-7 h-7 text-black stroke-[3]" />
              <div>
                <div className="text-3xl font-black text-black leading-none">
                  {finishedCount}
                </div>
                <div className="text-xs font-black uppercase tracking-widest">
                  Finished
                </div>
              </div>
            </div>

            {/* Detention Box (SMALLER ICON) */}
            <div className="bg-[#FF6B9E] border-4 border-black shadow-[6px_6px_0px_0px_#000] p-4 flex items-center gap-3 animate-pulse">
              <AlertTriangle className="w-7 h-7 text-black stroke-[3]" />
              <div>
                <div className="text-3xl font-black text-black leading-none">
                  {caughtCount}
                </div>
                <div className="text-xs font-black uppercase tracking-widest">
                  In Detention
                </div>
              </div>
            </div>

            {/* Results Button */}
            <Link
              href={`/teacher/results/${examCode}`}
              className="bg-[#FFE600] text-black border-4 border-black shadow-[6px_6px_0px_0px_#000] p-4 flex items-center gap-3 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer"
            >
              <div className="text-left">
                <div className="text-2xl font-black uppercase leading-none tracking-tighter">
                  Results
                </div>
                <div className="text-xs font-black uppercase tracking-widest">
                  View Live →
                </div>
              </div>
            </Link>

            {/* Export Button (SMALLER ICON) */}
            <button
              onClick={exportToExcel}
              className="bg-[#a855f7] text-white border-4 border-black shadow-[6px_6px_0px_0px_#000] p-4 flex items-center gap-3 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer group"
            >
              <Download className="w-7 h-7 stroke-[3] group-hover:-translate-y-1 transition-transform" />
              <div className="text-left hidden sm:block">
                <div className="text-2xl font-black uppercase leading-none tracking-tighter">
                  Export
                </div>
                <div className="text-xs font-black uppercase tracking-widest text-white/80">
                  .XLSX File
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mt-4">
          {students.length === 0 && (
            <div className="col-span-full bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-16 text-center">
              <h2 className="text-5xl font-black uppercase mb-4">
                Awaiting Students...
              </h2>
              <p className="text-2xl font-bold">
                Share the code <strong>{examCode}</strong> with your class. They
                will appear here instantly.
              </p>
            </div>
          )}

          {students.map((student) => {
            const isFinished = student.status === "finished";

            const isDetention =
              student.status === "detained" ||
              student.status === "locked" ||
              student.status === "detention" ||
              student.detention_end_time !== null;

            const progressPercent = Math.min(
              100,
              Math.round(
                (student.current_question_index / totalQuestions) * 100,
              ),
            );

            let cardBg = "bg-white";
            let statusText = examStatus === "waiting" ? "WAITING" : "ACTIVE";
            let statusIcon =
              examStatus === "waiting" ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Activity className="w-4 h-4 animate-pulse" />
              );

            if (isFinished) {
              cardBg = "bg-[#00E57A]";
              statusText = "DONE";
              statusIcon = <CheckCircle2 className="w-4 h-4" />;
            } else if (isDetention) {
              cardBg = "bg-[#FF6B9E]";
              statusText = "LOCKED OUT";
              statusIcon = <Lock className="w-4 h-4" />;
            }

            return (
              <div
                key={student.id}
                className={`${cardBg} border-[6px] border-black shadow-[8px_8px_0px_0px_#000] p-6 flex flex-col relative transition-colors duration-300`}
              >
                {/* 🟢 SMALLER STATUS ICON 🟢 */}
                <div className="absolute -top-5 -right-5 bg-black text-white border-4 border-black shadow-[4px_4px_0px_0px_#fff] px-4 py-2 flex items-center gap-2 font-black uppercase tracking-widest text-sm z-10">
                  {statusIcon} {statusText}
                </div>

                <div className="flex justify-between items-start mt-4 gap-2">
                  <h3 className="text-3xl font-black uppercase tracking-tighter leading-tight truncate">
                    {student.name}
                  </h3>
                  {isFinished && (
                    <div className="bg-black text-white px-3 py-1 font-black text-xl border-2 border-black whitespace-nowrap">
                      {Math.round((student.score / totalQuestions) * 100)}%
                    </div>
                  )}
                </div>

                <div className="mt-8">
                  <div className="flex justify-between font-black uppercase text-sm tracking-widest mb-2">
                    <span>Progress</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full h-8 bg-white border-4 border-black overflow-hidden relative">
                    <div
                      className={`h-full border-r-4 border-black transition-all duration-1000 ${isDetention ? "bg-black" : "bg-[#5A87FF]"}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Hide teacher actions if the exam hasn't started yet! */}
                {examStatus === "live" && !isFinished && !isDetention && (
                  <div className="mt-6">
                    <button
                      onClick={() => handleForceBlock(student.id)}
                      className="w-full bg-[#FF6B9E] text-black border-4 border-black p-3 font-black uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2 group cursor-pointer"
                    >
                      <Lock className="w-4 h-4 stroke-[3] group-hover:scale-110 transition-transform" />{" "}
                      Force Block
                    </button>
                  </div>
                )}

                {examStatus === "live" && isDetention && (
                  <div className="mt-6 flex flex-col gap-3">
                    <div className="bg-black text-white p-3 text-center font-black uppercase tracking-widest text-sm border-2 border-dashed border-[#FF6B9E] animate-pulse">
                      ⚠️ SUSPICIOUS ACTIVITY
                    </div>
                    <button
                      onClick={() => handleRemoveSuspension(student.id)}
                      className="bg-[#00E57A] text-black border-4 border-black p-3 font-black uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2 group cursor-pointer"
                    >
                      <Unlock className="w-4 h-4 stroke-[3] group-hover:scale-110 transition-transform" />{" "}
                      Forgive & Unlock
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
