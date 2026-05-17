"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../utils/Supabase/client";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Trash2, Copy, Plus, Clock, CheckCircle, Zap } from "lucide-react"; // 🟢 Download çıkarıldı, Copy eklendi

const rowColors = ["bg-[#FF6B9E]", "bg-[#5A87FF]", "bg-[#FFE600]", "bg-white"];

type Exam = {
  id: string;
  code: string;
  title: string | null;
  time_limit: number | null;
  is_active: boolean;
  created_at: string;
  status?: string; 
  started_at?: string; 
};

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [exams, setExams] = useState<Exam[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const [confirmModal, setConfirmModal] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // 🟢 KOPYALAMA MODALI İÇİN YENİ STATE
  const [duplicateModal, setDuplicateModal] = useState<{
    examId: string;
    newTitle: string;
    newTimeLimit: number | null;
  } | null>(null);

  useEffect(() => {
    if (searchParams?.get("payment") === "success") {
      setShowSuccess(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
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

        const { data: profileData, error: profileError } = await supabase
          .from("teacher_profiles")
          .select("credits")
          .eq("id", user.id)
          .single();

        if (!profileError && profileData) {
          setCredits(profileData.credits || 0);
        }

        const { data: examsData, error: dbError } = await supabase
          .from("exams")
          .select("*")
          .eq("teacher_id", user.id)
          .order("created_at", { ascending: false });

        if (dbError) throw dbError;

        if (examsData) {
          const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
          const nowMs = Date.now();
          const examsToClose: string[] = [];

          const processedExams = examsData.map((exam) => {
            if (exam.status === "live" && exam.started_at) {
              const startedTime = new Date(exam.started_at).getTime();
              if (nowMs - startedTime > TWELVE_HOURS_MS) {
                examsToClose.push(exam.id);
                return { ...exam, status: "finished" }; 
              }
            }
            return exam;
          });

          if (examsToClose.length > 0) {
            await supabase
              .from("exams")
              .update({ status: "finished" })
              .in("id", examsToClose);
          }

          setExams(processedExams);
        }
      } catch (err: unknown) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, searchParams]);

  const handleCreateClick = () => {
    if (credits !== null && credits > 0) {
      router.push("/teacher/create");
    } else {
      setConfirmModal({
        message:
          "⚠️ NO CREDITS: You need at least 1 credit to create a new exam.",
        onConfirm: () => router.push("/pricing"),
      });
    }
  };

  const handleDelete = async (e: React.MouseEvent, examId: string) => {
    e.preventDefault();
    e.stopPropagation();

    setConfirmModal({
      message:
        "⚠️ WARNING: Delete this exam? All results will be permanently lost.",
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from("exams")
            .delete()
            .eq("id", examId);
          if (error) throw error;
          setExams((prev) => prev.filter((exam) => exam.id !== examId));
        } catch (err: unknown) {
          console.error("Delete Error:", err);
          alert("Failed to delete exam.");
        }
      },
    });
  };

  // 🟢 SINAV KOPYALAMA İŞLEMİNİ YAPAN FONKSİYON
  const handleDuplicateSubmit = async () => {
    if (!duplicateModal) return;
    
    if (credits === null || credits < 1) {
      setDuplicateModal(null);
      setConfirmModal({
        message: "⚠️ NO CREDITS: You need 1 credit to duplicate an exam.",
        onConfirm: () => router.push("/pricing"),
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // 1. Krediyi düşür
      await supabase.from("teacher_profiles").update({ credits: credits - 1 }).eq("id", user.id);
      setCredits(credits - 1);

      // 2. Yeni kod üret
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // 3. Eski sınavın detaylarını al (Örn: penalty_seconds'ı kopyalamak için)
      const { data: originalExam } = await supabase.from("exams").select("*").eq("id", duplicateModal.examId).single();

      // 4. Yeni sınavı 'waiting' (taslak) olarak ekle
      const { data: newExam, error: examErr } = await supabase
        .from("exams")
        .insert([{
          title: duplicateModal.newTitle,
          code: newCode,
          time_limit: duplicateModal.newTimeLimit,
          penalty_seconds: originalExam?.penalty_seconds || 0,
          teacher_id: user.id,
          is_active: true,
          status: "waiting"
        }])
        .select()
        .single();

      if (examErr) throw examErr;

      // 5. Soruları kopyala
      const { data: oldQuestions } = await supabase.from("questions").select("*").eq("exam_id", duplicateModal.examId);

      if (oldQuestions && oldQuestions.length > 0) {
        const newQuestions = oldQuestions.map(q => {
          const { id, exam_id, created_at, ...rest } = q;
          return { ...rest, exam_id: newExam.id };
        });
        const { error: qErr } = await supabase.from("questions").insert(newQuestions);
        if (qErr) throw qErr;
      }

      setExams(prev => [newExam, ...prev]);
      setDuplicateModal(null);
      alert(`✅ Exam duplicated successfully! New Code: ${newCode}`);
    } catch (err: unknown) {
      console.error(err);
      alert("Failed to duplicate exam.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* MEVCUT SİLME/ONAY MODALI */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4">
          <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-8 max-w-md w-full">
            <p className="text-xl font-black uppercase mb-8 text-black bg-[#FFE600] px-4 py-3 border-4 border-black">
              {confirmModal.message}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 bg-white text-black border-4 border-black py-4 font-black uppercase text-lg shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className="flex-1 bg-[#00E57A] text-black border-4 border-black py-4 font-black uppercase text-lg shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
              >
                {credits === 0 ? "BUY CREDITS" : "YES, DELETE"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 YENİ: KOPYALAMA / DUPLICATE MODALI */}
      {duplicateModal && (
        <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#25c0f4] p-8 max-w-md w-full animate-in zoom-in duration-200">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-black mb-6 border-b-4 border-black pb-2">
              Duplicate Exam
            </h2>
            
            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-sm font-black uppercase mb-2 text-black">New Exam Name</label>
                <input 
                  type="text" 
                  value={duplicateModal.newTitle} 
                  onChange={(e) => setDuplicateModal({...duplicateModal, newTitle: e.target.value})}
                  className="w-full border-4 border-black p-4 text-xl font-black text-black shadow-[4px_4px_0px_0px_#000] outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-black uppercase mb-2 text-black">Time Limit (Mins)</label>
                <input 
                  type="number" 
                  value={duplicateModal.newTimeLimit || ""} 
                  onChange={(e) => setDuplicateModal({...duplicateModal, newTimeLimit: Number(e.target.value) || null})}
                  placeholder="Leave empty for NO LIMIT"
                  className="w-full border-4 border-black p-4 text-xl font-black text-black shadow-[4px_4px_0px_0px_#000] outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all" 
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setDuplicateModal(null)}
                className="flex-1 bg-white text-black border-4 border-black py-4 font-black uppercase text-sm shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
              >
                CANCEL
              </button>
              <button
                onClick={handleDuplicateSubmit}
                className="flex-[2] bg-[#a855f7] text-white border-4 border-black py-4 font-black uppercase text-sm shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <Copy className="w-5 h-5 stroke-[3]" /> DUPLICATE (1 CR)
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="grow flex flex-col md:flex-row p-6 md:p-12 gap-8 md:gap-12 relative z-10 max-w-400 mx-auto w-full">
        {/* SOL MENÜ */}
        <nav className="w-full md:w-72 bg-[#00E57A] border-[6px] border-black shadow-[16px_16px_0px_0px_#000] p-8 md:p-10 flex flex-col gap-8 h-fit z-10 shrink-0">
          <Link href="/teacher" className="text-3xl font-black text-black uppercase hover:translate-x-2 transition-transform opacity-100">
            Dashboard
          </Link>
          <Link href="/teacher/grade" className="text-3xl font-black text-black uppercase hover:translate-x-2 transition-transform opacity-50 hover:opacity-100">
            Grade
          </Link>
          <Link href="/teacher/edit" className="text-3xl font-black text-black uppercase hover:translate-x-2 transition-transform opacity-50 hover:opacity-100">
            Exam Edit
          </Link>
          <Link href="/teacher/analytics/" className="text-3xl font-black text-black uppercase hover:translate-x-2 transition-transform opacity-50 hover:opacity-100">
            Analytics
          </Link>
          <Link href="/teacher/results" className="text-3xl font-black text-black uppercase hover:translate-x-2 transition-transform opacity-50 hover:opacity-100">
            Results
          </Link>
          <Link href="#" className="text-3xl font-black text-black uppercase hover:translate-x-2 transition-transform opacity-50 pointer-events-none">
            Students
          </Link>
          <Link href="/teacher/settings" className="text-3xl font-black text-black uppercase hover:translate-x-2 transition-transform opacity-50 hover:opacity-100">
            Settings
          </Link>
        </nav>

        <div className="flex-1 flex flex-col gap-8 z-10 w-full">
          {showSuccess && (
            <div className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-[#00E57A] border-[8px] border-black shadow-[20px_20px_0px_0px_#000] p-10 md:p-16 max-w-2xl w-full text-center flex flex-col items-center gap-8 animate-in zoom-in duration-300">
                <div className="bg-black p-6 border-4 border-black rotate-3">
                  <CheckCircle className="w-20 h-20 text-[#00E57A] stroke-[3]" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-black">
                    PAYMENT SUCCESSFUL!
                  </h2>
                  <p className="text-xl md:text-2xl font-black uppercase bg-black text-white px-4 py-2 inline-block">
                    Credits have been added.
                  </p>
                </div>
                <button
                  onClick={() => setShowSuccess(false)}
                  className="bg-black text-white px-12 py-5 text-2xl font-black uppercase border-4 border-black shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-1 hover:translate-y-1 transition-all"
                >
                  GO TO DASHBOARD
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-8">
            <button
              onClick={handleCreateClick}
              className="flex-1 bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-6 md:p-8 text-center hover:translate-x-2 hover:translate-y-2 hover:shadow-[4px_4px_0px_0px_#000] transition-all group flex flex-col md:flex-row items-center justify-center gap-4"
            >
              <Plus className="w-12 h-12 stroke-[4] text-black group-hover:rotate-90 transition-transform duration-300" />
              <h1 className="text-3xl md:text-5xl font-black text-black uppercase tracking-tighter">
                Create New Exam
              </h1>
            </button>

            <div className="bg-[#25c0f4] border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-6 md:p-8 flex flex-col items-center justify-center gap-2 shrink-0 md:w-64">
              <Zap className="w-8 h-8 stroke-[3] text-black" />
              <h2 className="text-xl font-black uppercase text-black">
                Credits
              </h2>
              <span className="text-7xl font-black text-black tracking-tighter">
                {credits !== null ? credits : "-"}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {loading ? (
              <p className="text-2xl font-black uppercase p-8 bg-white border-4 border-black w-fit">
                Loading...
              </p>
            ) : exams.length === 0 ? (
              <div className="bg-white border-[6px] border-black shadow-[8px_8px_0px_0px_#000] p-10">
                <h2 className="text-4xl font-black uppercase">No Exams Yet</h2>
                <p className="text-xl font-bold mt-2">
                  Click "Create New Exam" to get started.
                </p>
              </div>
            ) : (
              exams.map((exam, index) => {
                const colorClass = rowColors[index % rowColors.length];
                
                let statusBadge = null;
                if (exam.status === 'live' && exam.started_at) {
                  const startedTime = new Date(exam.started_at).getTime();
                  const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
                  const timeLeft = startedTime + TWELVE_HOURS_MS - currentTime;
                  
                  if (timeLeft > 0) {
                    const h = Math.floor(timeLeft / (1000 * 60 * 60));
                    const m = Math.floor((timeLeft / (1000 * 60)) % 60);
                    statusBadge = (
                      <span className="bg-[#FF6B9E] text-black px-3 py-1 border-2 border-black font-black uppercase shadow-[2px_2px_0px_0px_#000] animate-pulse">
                        CLOSES IN: {h}H {m}M
                      </span>
                    );
                  } else {
                    statusBadge = (
                      <span className="bg-black text-[#00E57A] px-3 py-1 border-2 border-black font-black uppercase shadow-[2px_2px_0px_0px_#00E57A]">
                        FINISHED
                      </span>
                    );
                  }
                } else if (exam.status === 'finished') {
                  statusBadge = (
                    <span className="bg-black text-[#00E57A] px-3 py-1 border-2 border-black font-black uppercase shadow-[2px_2px_0px_0px_#00E57A]">
                      FINISHED
                    </span>
                  );
                } else {
                  statusBadge = (
                    <span className="bg-white/50 text-black px-3 py-1 border-2 border-black font-black uppercase shadow-[2px_2px_0px_0px_#000]">
                      DRAFT (WAITING)
                    </span>
                  );
                }

                return (
                  <div
                    key={exam.id}
                    className={`${colorClass} border-[6px] border-black shadow-[8px_8px_0px_0px_#000] p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 hover:translate-x-1 transition-all`}
                  >
                    <div className="flex-1 w-full">
                      <h2 className="text-3xl md:text-4xl font-black text-black uppercase tracking-tighter mb-3 truncate">
                        {exam.title || "Untitled"}
                      </h2>
                      <div className="flex flex-wrap items-center gap-3 font-black text-sm text-black">
                        <span className="bg-white px-3 py-1 border-2 border-black flex items-center gap-1 shadow-[2px_2px_0px_0px_#000] uppercase">
                          <Clock className="w-4 h-4" />{" "}
                          {exam.time_limit
                            ? `${exam.time_limit} MIN`
                            : "NO LIMIT"}
                        </span>
                        <span className="bg-white px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_#000] uppercase">
                          CODE: {exam.code}
                        </span>
                        {statusBadge}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                      {/* 🟢 İNDİR BUTONU YERİNE KOPYALA BUTONU EKLENDİ */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDuplicateModal({
                            examId: exam.id,
                            newTitle: `${exam.title} (Copy)`,
                            newTimeLimit: exam.time_limit
                          });
                        }}
                        className="bg-white text-black border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] hover:bg-[#a855f7] hover:text-white transition-all flex-none"
                        title="Duplicate Exam"
                      >
                        <Copy className="w-7 h-7 stroke-[3]" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, exam.id)}
                        className="bg-white text-black border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] hover:bg-black hover:text-[#FF6B9E] transition-all flex-none"
                        title="Delete Exam"
                      >
                        <Trash2 className="w-7 h-7 stroke-[3]" />
                      </button>
                      <Link
                        href={`/teacher/monitor/${exam.code}`}
                        className="flex-1 lg:flex-none text-center bg-black text-white px-6 py-4 font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:bg-[#00E57A] hover:text-black transition-all"
                      >
                        Monitor
                      </Link>
                      <Link
                        href={`/teacher/grade/${exam.code}`}
                        className="flex-1 lg:flex-none text-center bg-white text-black px-6 py-4 font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:bg-[#5A87FF] hover:text-white transition-all"
                      >
                        Grade
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </>
  );
}

export default function TeacherDashboard() {
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
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center font-black text-4xl uppercase text-black">
            Loading Dashboard...
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
      <Footer />
    </div>
  );
}