"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, AlertTriangle, XOctagon, Clock } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase } from "../utils/Supabase/client";

export default function ExamEntryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [examCode, setExamCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [grade, setGrade] = useState("");

  // 🟢 YENİ: ÖZEL BİLDİRİM STATE'İ
  const [alertModal, setAlertModal] = useState<{
    type: "error" | "waiting" | "closed";
    title: string;
    message: string;
  } | null>(null);

  const handleJoin = async () => {
    if (!firstName || !surname || !grade || !examCode) {
      return setAlertModal({
        type: "error",
        title: "MISSING FIELDS",
        message: "Please fill out your name, surname, grade, and exam code to continue."
      });
    }
    setLoading(true);

    try {
      const cleanCode = examCode.trim().toUpperCase();

      const { data: exam, error: examError } = await supabase
        .from("exams")
        .select("id, status")
        .ilike("code", cleanCode)
        .single();

      if (examError || !exam) {
        setLoading(false);
        return setAlertModal({
          type: "error",
          title: "NOT FOUND",
          message: `We couldn't find any exam matching the code "${cleanCode}". Please check your code.`
        });
      }

      // 🟢 GÜVENLİK DUVARI 1: SINAV BİTMİŞ Mİ?
      if (exam.status === "finished") {
        setLoading(false);
        return setAlertModal({
          type: "closed",
          title: "EXAM CLOSED",
          message: "This exam has officially ended. You can no longer join or submit answers."
        });
      }

      // 🟢 GÜVENLİK DUVARI 2: SINAV HENÜZ BAŞLAMAMIŞ MI?
      if (exam.status === "waiting" || !exam.status) {
        setLoading(false);
        return setAlertModal({
          type: "waiting",
          title: "PLEASE WAIT",
          message: "The teacher hasn't started this exam yet. Hold tight and try again in a moment!"
        });
      }

      const fullStudentName = `${firstName.trim()} ${surname.trim()} (Grade ${grade.trim()})`;

      const { data: student, error: studentError } = await supabase
        .from("students")
        .insert([
          {
            name: fullStudentName,
            exam_code: cleanCode,
            status: "active",
            current_question_index: 0,
          },
        ])
        .select()
        .single();

      if (studentError) throw studentError;

      sessionStorage.setItem("activeStudentId", student.id);
      sessionStorage.setItem("activeExamCode", cleanCode);
      sessionStorage.setItem("activeStudentName", fullStudentName);

      router.push("/exam/live");
    } catch (error: unknown) {
      console.error("Join Error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      
      setAlertModal({
        type: "error",
        title: "SYSTEM ERROR",
        message: errorMessage
      });
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#8B5CF6] relative flex flex-col font-sans selection:bg-black selection:text-[#FFE600]"
      style={{
        backgroundImage: "radial-gradient(#000 2px, transparent 2px)",
        backgroundSize: "32px 32px",
      }}
    >
      <Navbar />

      {/* 🟢 NEO-BRUTALIST ÖZEL BİLDİRİM PENCERESİ */}
      {alertModal && (
        <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-8 md:p-10 max-w-lg w-full flex flex-col items-center text-center animate-in zoom-in-95 duration-200 ${
            alertModal.type === 'error' ? 'bg-[#FF6B9E]' : 
            alertModal.type === 'closed' ? 'bg-black text-white' : 
            'bg-[#FFE600]'
          }`}>
            
            <div className={`p-4 border-4 border-black mb-6 ${alertModal.type === 'closed' ? 'bg-[#FF6B9E] text-black' : 'bg-white text-black'} shadow-[4px_4px_0px_0px_#000]`}>
              {alertModal.type === 'error' && <AlertTriangle className="w-12 h-12 stroke-[3]" />}
              {alertModal.type === 'closed' && <XOctagon className="w-12 h-12 stroke-[3]" />}
              {alertModal.type === 'waiting' && <Clock className="w-12 h-12 stroke-[3]" />}
            </div>

            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 leading-none">
              {alertModal.title}
            </h2>
            <p className={`text-xl font-bold uppercase tracking-widest mb-10 ${alertModal.type === 'closed' ? 'text-white/80' : 'text-black/80'}`}>
              {alertModal.message}
            </p>

            <button 
              onClick={() => setAlertModal(null)}
              className={`w-full py-5 text-2xl font-black uppercase border-4 border-black transition-all flex items-center justify-center ${
                alertModal.type === 'closed' 
                  ? 'bg-[#00E57A] text-black shadow-[6px_6px_0px_0px_#fff] hover:translate-x-1 hover:translate-y-1 hover:shadow-none' 
                  : 'bg-black text-white shadow-[6px_6px_0px_0px_#fff] hover:translate-x-1 hover:translate-y-1 hover:shadow-none'
              }`}
            >
              GOT IT
            </button>
          </div>
        </div>
      )}

      <main className=" text-black flex-grow flex flex-col items-center justify-center p-4 z-10 w-full mb-12">
        <div className="bg-white border-8 border-black shadow-[20px_20px_0px_0px_#000] p-8 md:p-16 w-full max-w-4xl flex flex-col gap-8">
          <input
            className="w-full text-2xl md:text-5xl font-black p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] outline-none uppercase placeholder:text-black/20 focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all"
            placeholder="ENTER EXAM CODE"
            value={examCode}
            onChange={(e) => setExamCode(e.target.value)}
          />
          <input
            className="w-full text-2xl md:text-5xl font-black p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] outline-none uppercase placeholder:text-black/20 focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all"
            placeholder="NAME"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            className="w-full text-2xl md:text-5xl font-black p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] outline-none uppercase placeholder:text-black/20 focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all"
            placeholder="SURNAME"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
          />
          <input
            className="w-full text-2xl md:text-5xl font-black p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] outline-none uppercase placeholder:text-black/20 focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all"
            placeholder="GRADE"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          />
          <button
            onClick={handleJoin}
            disabled={loading}
            className="w-full mt-4 bg-[#00E57A] border-4 border-black shadow-[8px_8px_0px_0px_#000] text-black text-3xl md:text-6xl font-black py-8 hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all flex justify-center items-center gap-4 uppercase"
          >
            {loading ? "LOADING..." : "START TEST"}
            {!loading && <ArrowRight className="w-14 h-14" strokeWidth={4} />}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}