"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/utils/Supabase/client";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface Question {
  id: string;
  text: string;
  options: string[];
}

export default function ActiveExamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Data State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [isFinished, setIsFinished] = useState(false);
  const [studentId, setStudentId] = useState("");

  // 1. Initialize Exam Data
  useEffect(() => {
    const startExam = async () => {
      try {
        const storedStudentId = sessionStorage.getItem("activeStudentId");
        const storedExamCode = sessionStorage.getItem("activeExamCode");

        if (!storedStudentId || !storedExamCode) {
          router.push("/exam");
          return;
        }

        setStudentId(storedStudentId);

        // A. Find the exact Exam ID
        const { data: examData, error: examErr } = await supabase
          .from("exams")
          .select("id")
          .eq("code", storedExamCode)
          .single();

        if (examErr || !examData) throw new Error("Could not find exam.");

        // B. Fetch all questions for this Exam
        const { data: qData, error: qErr } = await supabase
          .from("questions")
          .select("id, text, options")
          .eq("exam_id", examData.id);

        if (qErr) throw qErr;

        if (qData && qData.length > 0) {
          setQuestions(qData);
        } else {
          alert("Teacher has not uploaded questions yet!");
          router.push("/exam/start");
        }
      } catch (err: unknown) {
        console.error("Initialization Error:", err);
        router.push("/exam");
      } finally {
        setLoading(false);
      }
    };

    startExam();
  }, [router]);

  // 2. Handle Progress and Finishing
  const handleNextQuestion = async () => {
    if (!selectedOption) return alert("Please select an answer!");

    try {
      const isLastQuestion = currentIndex === questions.length - 1;

      if (!isLastQuestion) {
        // --- MOVE TO NEXT QUESTION ---
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setSelectedOption(""); // Reset selection for the next question

        // Update Teacher Radar live
        await supabase
          .from("students")
          .update({ current_question_index: nextIndex })
          .eq("id", studentId);
      } else {
        // --- EXAM COMPLETE ---
        setIsFinished(true); // Triggers the Congratulations Screen

        // Tell Database student is DONE (Turns Teacher Radar Green)
        await supabase
          .from("students")
          .update({
            status: "finished",
            current_question_index: questions.length,
          })
          .eq("id", studentId);
      }
    } catch (err: unknown) {
      console.error("Progress Error:", err);
    }
  };

  // --- LOADING SCREEN ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#25c0f4] flex items-center justify-center font-black text-6xl uppercase border-[16px] border-black">
        Loading Questions...
      </div>
    );
  }

  // --- THE CONGRATULATIONS SCREEN YOU ASKED FOR ---
  if (isFinished) {
    return (
      <div
        className="min-h-screen bg-[#00E57A] flex flex-col items-center justify-center p-6 text-center selection:bg-black selection:text-[#00E57A]"
        style={{
          backgroundImage: "radial-gradient(#000 2px, transparent 2px)",
          backgroundSize: "32px 32px",
        }}
      >
        <div className="bg-white border-[8px] border-black shadow-[16px_16px_0px_0px_#000] p-12 md:p-24 max-w-3xl w-full animate-in zoom-in duration-500">
          <div className="size-32 bg-black text-[#00E57A] flex items-center justify-center mx-auto mb-8 border-4 border-black shadow-[8px_8px_0px_0px_#FFE600] rotate-3">
            <CheckCircle2 className="w-20 h-20 stroke-[3]" />
          </div>

          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-black mb-6 leading-none">
            Exam
            <br />
            Complete!
          </h1>

          <p className="text-2xl font-bold uppercase tracking-widest text-black/70 mb-12">
            Your answers have been securely submitted to the teacher.
          </p>

          <button
            onClick={() => {
              sessionStorage.clear(); // Clear session so they can't re-enter
              router.push("/"); // Send them back to the homepage
            }}
            className="w-full bg-[#25c0f4] border-[6px] border-black p-6 text-3xl font-black uppercase text-black shadow-[8px_8px_0px_0px_#000] hover:translate-x-2 hover:translate-y-2 hover:shadow-none active:bg-black active:text-white transition-all"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // --- ACTIVE QUESTION SCREEN ---
  const currentQuestion = questions[currentIndex];

  return (
    <div
      className="min-h-screen bg-[#f5f8f8] flex flex-col items-center p-6 font-sans selection:bg-[#FFE600] selection:text-black"
      style={{
        backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
      {/* Top Status Bar */}
      <header className="w-full max-w-4xl bg-white border-4 border-black p-4 flex justify-between items-center shadow-[6px_6px_0px_0px_#000] mb-8">
        <div className="bg-black text-white px-4 py-2 font-black uppercase tracking-widest text-sm">
          Integrity Guard Active
        </div>
        <div className="font-black text-xl uppercase tracking-tighter">
          Question {currentIndex + 1} / {questions.length}
        </div>
      </header>

      {/* Question Card */}
      <main className="w-full max-w-4xl flex flex-col gap-8 flex-grow">
        <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-8 md:p-12">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-tight text-black">
            {currentQuestion?.text}
          </h2>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentQuestion?.options.map((option, idx) => {
            if (!option) return null; // Skip empty options
            const isSelected = selectedOption === option;

            return (
              <button
                key={idx}
                onClick={() => setSelectedOption(option)}
                className={`text-left p-6 md:p-8 border-[6px] border-black text-2xl md:text-3xl font-black uppercase tracking-tight transition-all
                  ${
                    isSelected
                      ? "bg-[#FFE600] shadow-none translate-x-2 translate-y-2"
                      : "bg-white shadow-[8px_8px_0px_0px_#000] hover:bg-gray-50"
                  }`}
              >
                <span className="bg-black text-white px-3 py-1 mr-4 border-2 border-black">
                  {String.fromCharCode(65 + idx)}
                </span>
                {option}
              </button>
            );
          })}
        </div>

        {/* Next/Submit Button */}
        <button
          onClick={handleNextQuestion}
          className="mt-8 bg-[#00E57A] border-[6px] border-black p-8 flex items-center justify-between shadow-[12px_12px_0px_0px_#000] hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all group"
        >
          <span className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-black">
            {currentIndex === questions.length - 1
              ? "Submit Exam"
              : "Next Question"}
          </span>
          <ArrowRight className="w-16 h-16 stroke-[4] transition-transform group-hover:translate-x-4" />
        </button>
      </main>
    </div>
  );
}
