"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/utils/Supabase/client";
import Navbar from "@/app/components/Navbar";
import { Lock, Unlock, Users, ShieldAlert, CheckCircle2 } from "lucide-react";

interface Student {
  id: string;
  name: string;
  status: string;
  score: number | null;
  current_question_index: number | null;
  detention_end_time: string | null;
}

export default function TeacherMonitorPage() {
  const params = useParams();
  const router = useRouter();
  const examCode = params.code as string;

  const [students, setStudents] = useState<Student[]>([]);
  const [examTitle, setExamTitle] = useState("Loading Exam...");
  const [totalQuestions, setTotalQuestions] = useState(1);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Initial Data
  useEffect(() => {
    const fetchExamData = async () => {
      try {
        // Get Exam Title and ID
        const { data: examData } = await supabase
          .from("exams")
          .select("id, title")
          .ilike("code", examCode)
          .single();

        if (examData) {
          setExamTitle(examData.title || "Untitled Exam");

          // Get True Question Count
          const { count } = await supabase
            .from("questions")
            .select("*", { count: "exact", head: true })
            .eq("exam_id", examData.id);

          if (count) setTotalQuestions(count);
        }

        // Get Initial Students
        const { data: studentData } = await supabase
          .from("students")
          .select("*")
          .ilike("exam_code", examCode)
          .order("created_at", { ascending: false });

        if (studentData) setStudents(studentData);
      } catch (err: unknown) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [examCode]);

  // 2. 🟢 REAL-TIME RADAR: Listen for live student updates 🟢
  useEffect(() => {
    const channel = supabase
      .channel("teacher-monitor")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "students",
          filter: `exam_code=ilike.${examCode}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setStudents((prev) => [payload.new as Student, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setStudents((prev) =>
              prev.map((s) =>
                s.id === payload.new.id ? (payload.new as Student) : s,
              ),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [examCode]);

  // 3. 🟢 THE BLOCK BUTTON (Sends to Detention) 🟢
  const handleBlockStudent = async (studentId: string) => {
    // Manually add a 2-minute penalty from right NOW
    const penaltyTime = new Date(Date.now() + 120000).toISOString();

    try {
      await supabase
        .from("students")
        .update({
          status: "detention",
          detention_end_time: penaltyTime,
        })
        .eq("id", studentId);
    } catch (err: unknown) {
      console.error("Error blocking student:", err);
    }
  };

  // 4. 🟢 THE FORGIVE BUTTON (Removes Detention) 🟢
  const handleForgiveStudent = async (studentId: string) => {
    try {
      await supabase
        .from("students")
        .update({
          status: "active",
          detention_end_time: null,
        })
        .eq("id", studentId);
    } catch (err: unknown) {
      console.error("Error forgiving student:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFE600] flex items-center justify-center font-black text-5xl border-[8px] border-black">
        Activating Radar...
      </div>
    );
  }

  const activeCount = students.filter((s) => s.status === "active").length;
  const detentionCount = students.filter(
    (s) => s.status === "detention",
  ).length;
  const finishedCount = students.filter(
    (s) => s.status === "finished" || s.status === "failed",
  ).length;

  return (
    <div
      className="min-h-screen bg-[#f5f8f8] flex flex-col font-sans selection:bg-[#FFE600] selection:text-black"
      style={{
        backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
      <Navbar />

      <main className="flex-grow p-6 md:p-12 max-w-[1600px] mx-auto w-full flex flex-col gap-8">
        {/* Header Section */}
        <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="bg-black text-white inline-block px-4 py-1 font-black uppercase tracking-widest text-sm mb-4 flex items-center gap-2 border-2 border-black">
              <ShieldAlert className="w-4 h-4" /> Live Monitor
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">
              {examTitle}
            </h1>
            <p className="text-2xl font-bold mt-2">
              EXAM CODE:{" "}
              <span className="bg-[#FFE600] px-3 border-2 border-black">
                {examCode}
              </span>
            </p>
          </div>

          <button
            onClick={() => router.push(`/teacher/results/${examCode}`)}
            className="bg-[#5A87FF] text-white border-4 border-black px-8 py-4 font-black text-xl uppercase shadow-[6px_6px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            End & View Results
          </button>
        </div>

        {/* Live Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black p-6 flex items-center gap-4 shadow-[6px_6px_0px_0px_#000]">
            <div className="bg-[#25c0f4] p-4 border-2 border-black">
              <Users className="w-8 h-8 text-black" />
            </div>
            <div>
              <div className="text-4xl font-black">{activeCount}</div>
              <div className="font-bold uppercase text-sm text-black/60">
                Active Testing
              </div>
            </div>
          </div>
          <div className="bg-white border-4 border-black p-6 flex items-center gap-4 shadow-[6px_6px_0px_0px_#000]">
            <div className="bg-[#FF6B9E] p-4 border-2 border-black animate-pulse">
              <Lock className="w-8 h-8 text-black" />
            </div>
            <div>
              <div className="text-4xl font-black">{detentionCount}</div>
              <div className="font-bold uppercase text-sm text-black/60">
                In Detention
              </div>
            </div>
          </div>
          <div className="bg-white border-4 border-black p-6 flex items-center gap-4 shadow-[6px_6px_0px_0px_#000]">
            <div className="bg-[#00E57A] p-4 border-2 border-black">
              <CheckCircle2 className="w-8 h-8 text-black" />
            </div>
            <div>
              <div className="text-4xl font-black">{finishedCount}</div>
              <div className="font-bold uppercase text-sm text-black/60">
                Completed
              </div>
            </div>
          </div>
        </div>

        {/* Student Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {students.length === 0 && (
            <div className="col-span-full bg-white border-4 border-black p-12 text-center shadow-[8px_8px_0px_0px_#000]">
              <h2 className="text-3xl font-black uppercase">
                Waiting for students to join...
              </h2>
              <p className="text-xl font-bold mt-2">
                Share the exam code with your class.
              </p>
            </div>
          )}

          {students.map((student) => {
            const isDetention = student.status === "detention";
            const isFinished =
              student.status === "finished" || student.status === "failed";

            // Calculate live progress percentage
            const answeredCount = student.current_question_index || 0;
            const progressPercent = Math.min(
              (answeredCount / totalQuestions) * 100,
              100,
            );

            // Dynamic Styling based on status
            let cardColor = "bg-white";
            let statusBadge = "bg-[#00E57A] text-black";
            let statusText = "Active";

            if (isDetention) {
              cardColor = "bg-[#FF6B9E]";
              statusBadge = "bg-black text-white animate-pulse";
              statusText = "LOCKED OUT";
            } else if (isFinished) {
              cardColor = "bg-gray-100 opacity-60";
              statusBadge = "bg-gray-300 text-gray-600";
              statusText = "FINISHED";
            }

            return (
              <div
                key={student.id}
                className={`${cardColor} border-[4px] border-black p-6 shadow-[6px_6px_0px_0px_#000] flex flex-col gap-4 transition-colors duration-300`}
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <h3 className="text-2xl font-black uppercase tracking-tight break-words max-w-[70%]">
                    {student.name}
                  </h3>
                  <span
                    className={`${statusBadge} px-3 py-1 text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_0px_#000]`}
                  >
                    {statusText}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-black uppercase">
                    <span>Progress</span>
                    <span>
                      {answeredCount} / {totalQuestions}
                    </span>
                  </div>
                  <div className="w-full h-4 bg-white border-2 border-black overflow-hidden relative">
                    <div
                      className="absolute top-0 left-0 h-full bg-[#25c0f4] transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* 🟢 TEACHER ACTIONS 🟢 */}
                <div className="mt-auto pt-4 border-t-4 border-black border-dashed">
                  {!isFinished && !isDetention && (
                    <button
                      onClick={() => handleBlockStudent(student.id)}
                      className="w-full bg-[#FF6B9E] text-black border-4 border-black p-3 font-black uppercase shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                      <Lock className="w-5 h-5 stroke-[3]" /> Force Block
                    </button>
                  )}

                  {!isFinished && isDetention && (
                    <button
                      onClick={() => handleForgiveStudent(student.id)}
                      className="w-full bg-[#00E57A] text-black border-4 border-black p-3 font-black uppercase shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                      <Unlock className="w-5 h-5 stroke-[3]" /> Forgive Student
                    </button>
                  )}

                  {isFinished && (
                    <div className="w-full bg-black text-white p-3 font-black uppercase text-center border-4 border-black">
                      Exam Submitted
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
