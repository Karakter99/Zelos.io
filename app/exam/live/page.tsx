"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/utils/Supabase/client";
import { CheckCircle2, ArrowRight, AlertTriangle } from "lucide-react";

interface Question {
  id: string;
  text: string;
  options: string[];
  answer: string; // 🟢 FIX 1: Looks for 'answer' in the questions table
}

// Math Problem Generator for Detention
const createProblem = () => {
  const ops = ["*", "+", "-"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a = 0,
    b = 0,
    ans = 0;

  if (op === "*") {
    a = Math.floor(Math.random() * 12) + 2;
    b = Math.floor(Math.random() * 9) + 2;
    ans = a * b;
  } else {
    a = Math.floor(Math.random() * 100);
    b = Math.floor(Math.random() * 100);
    ans = op === "+" ? a + b : a - b;
  }
  return { text: `${a} ${op} ${b}`, answer: ans };
};

export default function ActiveExamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Data State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [isFinished, setIsFinished] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [examId, setExamId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [score, setScore] = useState(0);

  // Anti-Cheat State
  const [isDetention, setIsDetention] = useState(false);
  const [detentionEndTime, setDetentionEndTime] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [problem, setProblem] = useState(createProblem());
  const [mathInput, setMathInput] = useState("");

  // 1. Initialize Exam
  useEffect(() => {
    const startExam = async () => {
      try {
        const storedStudentId = sessionStorage.getItem("activeStudentId");
        const storedExamCode = sessionStorage.getItem("activeExamCode");
        const storedName = sessionStorage.getItem("activeStudentName");

        if (!storedStudentId || !storedExamCode) {
          router.push("/exam");
          return;
        }

        setStudentId(storedStudentId);

        const { data: studentData } = await supabase
          .from("students")
          .select("status, detention_end_time, score")
          .eq("id", storedStudentId)
          .single();

        if (studentData) {
          if (studentData.score) setScore(studentData.score);

          if (studentData.detention_end_time) {
            const remainingMs =
              new Date(studentData.detention_end_time).getTime() - Date.now();
            if (remainingMs > 0) {
              setIsDetention(true);
              setDetentionEndTime(studentData.detention_end_time);
            } else {
              await supabase
                .from("students")
                .update({ status: "active", detention_end_time: null })
                .eq("id", storedStudentId);
            }
          }
        }

        const { data: examData, error: examErr } = await supabase
          .from("exams")
          .select("id")
          .eq("code", storedExamCode)
          .single();

        if (examErr || !examData) throw new Error("Could not find exam.");
        setExamId(examData.id);

        // 🟢 FIX 2: Ask Supabase specifically for 'answer'
        const { data: qData, error: qErr } = await supabase
          .from("questions")
          .select("id, text, options, answer")
          .eq("exam_id", examData.id);

        if (qErr) throw qErr;

        if (qData && qData.length > 0) {
          const savedOrder = localStorage.getItem(
            `order-${storedExamCode}-${storedName}`,
          );
          let finalQuestions: Question[] = [];

          if (savedOrder) {
            const orderIds = JSON.parse(savedOrder);
            finalQuestions = orderIds
              .map((id: string) => qData.find((q) => q.id === id))
              .filter(Boolean) as Question[];
          } else {
            finalQuestions = [...qData].sort(
              () => Math.random() - 0.5,
            ) as Question[];
            localStorage.setItem(
              `order-${storedExamCode}-${storedName}`,
              JSON.stringify(finalQuestions.map((q) => q.id)),
            );
          }
          setQuestions(finalQuestions);
        } else {
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

  // 2. ANTI-CHEAT: Listen for Tab Switching
  useEffect(() => {
    if (!studentId || isFinished || isDetention) return;

    const triggerDetention = async () => {
      const penaltyEndTime = new Date(Date.now() + 120000).toISOString();
      setIsDetention(true);
      setDetentionEndTime(penaltyEndTime);

      try {
        await supabase
          .from("students")
          .update({
            status: "detention",
            detention_end_time: penaltyEndTime,
          })
          .eq("id", studentId);
      } catch (err: unknown) {
        console.error("Failed to update detention", err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) triggerDetention();
    };
    const handleWindowBlur = () => {
      triggerDetention();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [studentId, isFinished, isDetention]);

  // 3. ANTI-CHEAT: Detention Timer Countdown
  useEffect(() => {
    if (!isDetention || !detentionEndTime) return;

    const timer = setInterval(async () => {
      const remainingSeconds = Math.floor(
        (new Date(detentionEndTime).getTime() - Date.now()) / 1000,
      );

      if (remainingSeconds <= 0) {
        setTimeLeft(0);
        setIsDetention(false);
        setDetentionEndTime(null);
        clearInterval(timer);

        await supabase
          .from("students")
          .update({ status: "active", detention_end_time: null })
          .eq("id", studentId);
      } else {
        setTimeLeft(remainingSeconds);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isDetention, detentionEndTime, studentId]);

  // 4. Handle Math Problem Submission
  const handleMathSubmit = async () => {
    if (parseInt(mathInput) === problem.answer) {
      const currentEnd = new Date(detentionEndTime!).getTime();
      const newEndTime = new Date(currentEnd - 30000).toISOString();

      setDetentionEndTime(newEndTime);
      setProblem(createProblem());
      setMathInput("");

      await supabase
        .from("students")
        .update({ detention_end_time: newEndTime })
        .eq("id", studentId);
    } else {
      setMathInput("");
    }
  };

  // 5. 🟢 PERFECT AUTO-GRADER 🟢
  const handleNextQuestion = async () => {
    if (!selectedOption) {
      setErrorMsg("⚠️ YOU MUST SELECT AN ANSWER!");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }

    try {
      const isLastQuestion = currentIndex === questions.length - 1;
      const currentQ = questions[currentIndex];

      // Figure out which LETTER the student clicked (A, B, C, or D)
      const optionIndex = currentQ.options.indexOf(selectedOption);
      const studentLetter = String.fromCharCode(65 + optionIndex);

      // 🟢 FIX 3: Pull the expected LETTER directly from 'currentQ.answer'
      const dbCorrectLetter = (currentQ.answer || "NOT SET")
        .trim()
        .toUpperCase();

      const isCorrect = studentLetter === dbCorrectLetter;

      // 🚨 LOUD DEBUGGER: Check F12 Console!
      console.log("----------------------------------");
      console.log("📝 Question:", currentQ.text);
      console.log(
        "🧑‍🎓 Picked:",
        `"${selectedOption}" (Letter: ${studentLetter})`,
      );
      console.log("🎯 Expected:", `Letter: ${dbCorrectLetter}`);
      console.log("✅ Graded As:", isCorrect ? "CORRECT (+1)" : "WRONG (0)");
      console.log("----------------------------------");

      let newScore = score;
      if (isCorrect) {
        newScore += 1;
        setScore(newScore);
      }

      // 🟢 Save to 'student_answers' using the column names that table expects
      const { error: answerError } = await supabase
        .from("student_answers")
        .insert({
          student_id: studentId,
          exam_id: examId,
          question_id: currentQ.id,
          question_text: currentQ.text,
          selected_answer: studentLetter,
          correct_answer: dbCorrectLetter, // This table expects the name correct_answer
          is_correct: isCorrect,
        });

      if (answerError) {
        console.error("❌ SUPABASE INSERT ERROR:", answerError.message);
        alert("Database Insert Error: " + answerError.message);
      }

      if (!isLastQuestion) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setSelectedOption("");

        await supabase
          .from("students")
          .update({
            current_question_index: nextIndex,
            score: newScore,
          })
          .eq("id", studentId);
      } else {
        setIsFinished(true);

        await supabase
          .from("students")
          .update({
            status: "finished",
            current_question_index: questions.length,
            score: newScore,
          })
          .eq("id", studentId);
      }
    } catch (err: unknown) {
      console.error("Progress Error:", err);
    }
  };

  // --- RENDERING SCREENS ---

  if (loading) {
    return (
      <div className="min-h-screen bg-[#25c0f4] flex items-center justify-center font-black text-4xl md:text-5xl uppercase border-[8px] border-black">
        Loading Questions...
      </div>
    );
  }

  if (isDetention) {
    return (
      <div
        className="fixed inset-0 bg-[#FF6B9E] z-50 flex flex-col items-center justify-center p-6 text-black font-sans select-none"
        style={{
          backgroundImage: "radial-gradient(#000 2px, transparent 2px)",
          backgroundSize: "32px 32px",
        }}
      >
        <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tight bg-white border-[4px] border-black px-8 py-2 shadow-[8px_8px_0px_0px_#000] rotate-2">
          LOCKED OUT
        </h1>

        <div className="text-7xl md:text-8xl font-black bg-white px-10 py-4 mb-10 border-[4px] border-black shadow-[8px_8px_0px_0px_#000] -rotate-1">
          {Math.floor(timeLeft / 60)}:
          {(timeLeft % 60).toString().padStart(2, "0")}
        </div>

        <div className="bg-white p-6 md:p-8 border-[4px] border-black shadow-[12px_12px_0px_0px_#000] w-full max-w-lg text-center">
          <p className="mb-4 text-black font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2">
            <AlertTriangle className="w-6 h-6 text-[#FF6B9E]" />
            Solve to reduce time (-30s)
          </p>

          <div className="text-5xl md:text-6xl font-black mb-6">
            {problem.text} = ?
          </div>

          <input
            type="number"
            autoFocus
            className="text-black text-4xl font-black text-center p-4 w-full mb-6 outline-none border-[4px] border-black shadow-[6px_6px_0px_0px_#000] focus:translate-x-1 focus:translate-y-1 focus:shadow-[2px_2px_0px_0px_#000] transition-all"
            value={mathInput}
            onChange={(e) => setMathInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleMathSubmit()}
            placeholder="?"
          />

          <button
            onClick={handleMathSubmit}
            className="w-full bg-[#FFE600] text-black font-black text-2xl uppercase py-4 border-[4px] border-black shadow-[6px_6px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#000] active:bg-black active:text-white transition-all"
          >
            Submit Answer
          </button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div
        className="min-h-screen bg-[#00E57A] flex flex-col items-center justify-center p-6 text-center selection:bg-black selection:text-[#00E57A]"
        style={{
          backgroundImage: "radial-gradient(#000 2px, transparent 2px)",
          backgroundSize: "32px 32px",
        }}
      >
        <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-10 md:p-16 max-w-2xl w-full animate-in zoom-in duration-500">
          <div className="size-24 bg-black text-[#00E57A] flex items-center justify-center mx-auto mb-6 border-4 border-black shadow-[6px_6px_0px_0px_#FFE600] rotate-3">
            <CheckCircle2 className="w-16 h-16 stroke-[3]" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-black mb-4 leading-none">
            Exam Complete!
          </h1>
          <p className="text-xl font-bold uppercase tracking-widest text-black/70 mb-10">
            Your answers have been securely submitted.
          </p>
          <button
            onClick={() => {
              sessionStorage.clear();
              router.push("/");
            }}
            className="w-full bg-[#25c0f4] border-[4px] border-black p-5 text-2xl font-black uppercase text-black shadow-[6px_6px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progressPercent = (currentIndex / questions.length) * 100;

  return (
    <div
      className="min-h-screen bg-[#f5f8f8] flex flex-col items-center p-4 md:p-8 font-sans selection:bg-[#FFE600] selection:text-black"
      style={{
        backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
      <header className="w-full max-w-3xl bg-white border-[4px] border-black p-3 flex justify-between items-center shadow-[6px_6px_0px_0px_#000] mb-6 relative overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-[#25c0f4] border-r-[4px] border-black z-0 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
        <div className="bg-black text-white px-3 py-1 font-black uppercase tracking-widest text-xs z-10">
          Integrity Guard
        </div>
        <div className="font-black text-xl uppercase tracking-tighter bg-white px-3 py-1 border-[3px] border-black z-10">
          Q: {currentIndex + 1} / {questions.length}
        </div>
      </header>

      {errorMsg && (
        <div className="w-full max-w-3xl bg-[#FF6B9E] text-black border-[4px] border-black shadow-[6px_6px_0px_0px_#000] p-3 font-black uppercase text-center mb-6 animate-pulse text-sm">
          {errorMsg}
        </div>
      )}

      <main className="w-full max-w-3xl flex flex-col gap-6 flex-grow">
        <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-6 md:p-8">
          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter leading-tight text-black">
            {currentQuestion?.text}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {currentQuestion?.options.map((option, idx) => {
            if (!option) return null;
            const isSelected = selectedOption === option;

            return (
              <button
                key={idx}
                onClick={() => setSelectedOption(option)}
                className={`text-left p-4 md:p-6 border-[4px] border-black text-lg md:text-xl font-black uppercase tracking-tight transition-all flex items-center
                  ${
                    isSelected
                      ? "bg-black text-[#00E57A] shadow-none translate-x-1 translate-y-1"
                      : "bg-white text-black shadow-[6px_6px_0px_0px_#000] hover:bg-gray-50"
                  }`}
              >
                <span
                  className={`px-3 py-1 mr-4 border-[3px] font-black
                    ${
                      isSelected
                        ? "bg-[#00E57A] text-black border-[#00E57A]"
                        : "bg-black text-white border-black"
                    }`}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="leading-snug">{option}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleNextQuestion}
          className="mt-4 bg-[#00E57A] border-[4px] border-black p-5 flex items-center justify-between shadow-[8px_8px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-2 active:translate-y-2 active:shadow-none active:bg-black active:text-white transition-all group"
        >
          <span className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-black">
            {currentIndex === questions.length - 1
              ? "Submit Exam"
              : "Next Question"}
          </span>
          <ArrowRight className="w-10 h-10 stroke-[4] transition-transform group-hover:translate-x-3" />
        </button>
      </main>
    </div>
  );
}
