"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../utils/Supabase/client";
import Navbar from "../../components/Navbar";
import {
  AlertTriangle,
  CheckCircle2,
  Activity,
  Lock,
  Users,
} from "lucide-react";

type Exam = { id: string; title?: string } | null;
type Student = {
  id: string;
  name: string;
  status: string;
  detention_end_time: string | null;
  current_question_index: number;
};

export default function LiveCheatMonitor() {
  const params = useParams();
  const examCode = params.code as string;

  const [exam, setExam] = useState<Exam>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: examData } = await supabase
        .from("exams")
        .select("*")
        .eq("code", examCode)
        .single();

      if (examData) {
        setExam(examData);
        const { count } = await supabase
          .from("questions")
          .select("*", { count: "exact", head: true })
          .eq("exam_id", examData.id);
        setTotalQuestions(count || 1);
      }

      const { data: studentData } = await supabase
        .from("students")
        .select("*")
        .eq("exam_code", examCode)
        .order("created_at", { ascending: false });

      if (studentData) setStudents(studentData);
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 3000); // Live polling!
    return () => clearInterval(interval);
  }, [examCode]);

  const activeCount = students.filter(
    (s) => s.status === "active" && !s.detention_end_time,
  ).length;
  const finishedCount = students.filter((s) => s.status === "finished").length;
  const caughtCount = students.filter((s) => s.detention_end_time).length;

  if (loading)
    return (
      <div className="min-h-screen bg-[#FFE600] flex items-center justify-center font-black text-6xl border-[16px] border-black">
        Loading...
      </div>
    );

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
        <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
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

          <div className="flex flex-wrap gap-4">
            <div className="bg-[#5A87FF] border-4 border-black shadow-[6px_6px_0px_0px_#000] p-4 flex items-center gap-4">
              <Users className="w-10 h-10 text-white stroke-[3]" />
              <div>
                <div className="text-3xl font-black text-white leading-none">
                  {students.length}
                </div>
                <div className="text-xs font-black uppercase tracking-widest text-white">
                  Total
                </div>
              </div>
            </div>
            <div className="bg-[#00E57A] border-4 border-black shadow-[6px_6px_0px_0px_#000] p-4 flex items-center gap-4">
              <CheckCircle2 className="w-10 h-10 text-black stroke-[3]" />
              <div>
                <div className="text-3xl font-black text-black leading-none">
                  {finishedCount}
                </div>
                <div className="text-xs font-black uppercase tracking-widest">
                  Finished
                </div>
              </div>
            </div>
            <div className="bg-[#FF6B9E] border-4 border-black shadow-[6px_6px_0px_0px_#000] p-4 flex items-center gap-4 animate-pulse">
              <AlertTriangle className="w-10 h-10 text-black stroke-[3]" />
              <div>
                <div className="text-3xl font-black text-black leading-none">
                  {caughtCount}
                </div>
                <div className="text-xs font-black uppercase tracking-widest">
                  In Detention
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mt-4">
          {students.length === 0 && (
            <div className="col-span-full bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-16 text-center">
              <h2 className="text-5xl font-black uppercase mb-4">
                Awaiting Students...
              </h2>
              <p className="text-2xl font-bold">
                Share the code <strong>{examCode}</strong> with your class.
              </p>
            </div>
          )}

          {students.map((student) => {
            const isFinished = student.status === "finished";
            const isDetention = student.detention_end_time !== null;
            const progressPercent = Math.min(
              100,
              Math.round(
                (student.current_question_index / totalQuestions) * 100,
              ),
            );

            let cardBg = "bg-white";
            let statusText = "ACTIVE";
            let statusIcon = <Activity className="w-6 h-6 animate-pulse" />;

            if (isFinished) {
              cardBg = "bg-[#00E57A]";
              statusText = "DONE";
              statusIcon = <CheckCircle2 className="w-6 h-6" />;
            } else if (isDetention) {
              cardBg = "bg-[#FF6B9E]";
              statusText = "LOCKED OUT";
              statusIcon = <Lock className="w-6 h-6" />;
            }

            return (
              <div
                key={student.id}
                className={`${cardBg} border-[6px] border-black shadow-[8px_8px_0px_0px_#000] p-6 flex flex-col relative transition-colors duration-300`}
              >
                <div className="absolute -top-5 -right-5 bg-black text-white border-4 border-black shadow-[4px_4px_0px_0px_#fff] px-4 py-2 flex items-center gap-2 font-black uppercase tracking-widest text-sm z-10">
                  {statusIcon} {statusText}
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tighter leading-tight mt-4 truncate pr-8">
                  {student.name}
                </h3>
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
                {isDetention && (
                  <div className="mt-6 bg-black text-white p-3 text-center font-black uppercase tracking-widest text-sm border-2 border-dashed border-[#FF6B9E] animate-pulse">
                    ⚠️ SUSPICIOUS ACTIVITY DETECTED
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
