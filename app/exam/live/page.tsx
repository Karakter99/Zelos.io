"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/utils/Supabase/client";
import { CheckCircle2, ArrowRight, AlertTriangle } from "lucide-react";

interface Question {
  id: string;
  text: string;
  options: string[];
  correct_answer: string;
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
  const [examId, setExamId] = useState(""); // 🟢 NEW: Store the Exam ID for the answers table
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

        // 🟢 Save the examId to state so we can use it when submitting answers!
        setExamId(examData.id);

        const { data: qData, error: qErr } = await supabase
          .from("questions")
          .select("id, text, options, correct_answer")
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

  // 5. 🟢 PERFECTLY MATCHED AUTO-GRADER 🟢
  // 5. 🟢 PERFECTLY MATCHED AUTO-GRADER 🟢
  const handleNextQuestion = async () => {
    if (!selectedOption) {
      setErrorMsg("⚠️ YOU MUST SELECT AN ANSWER!");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }

    try {
      const isLastQuestion = currentIndex === questions.length - 1;
      const currentQ = questions[currentIndex];

      // 1. Safety Net: Fallback if the database has a 'null' correct answer
      const actualCorrectAnswer = currentQ.correct_answer || "Not Set";

      // 2. Check if it's correct and update score
      const isCorrect = selectedOption === actualCorrectAnswer;
      let newScore = score;
      if (isCorrect) {
        newScore += 1;
        setScore(newScore);
      }

      // 3. 🟢 INSERT PERFECTLY FORMATTED DATA INTO student_answers
      const { error: answerError } = await supabase
        .from("student_answers")
        .insert({
          student_id: studentId,
          exam_id: examId,
          question_id: currentQ.id,
          question_text: currentQ.text,
          selected_answer: selectedOption,
          correct_answer: actualCorrectAnswer, // 🟢 Never sends 'null' anymore!
          is_correct: isCorrect,
        });

      // Show loud error if Supabase rejects the insert
      if (answerError) {
        console.error("❌ SUPABASE INSERT ERROR:", answerError.message);
        alert("Database Insert Error: " + answerError.message);
      }
      // 3. Update the student's progress and total score
      if (!isLastQuestion) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setSelectedOption(""); // Reset choice for next screen

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

  // --- LOADING SCREEN ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#25c0f4] flex items-center justify-center font-black text-6xl uppercase border-[16px] border-black">
        Loading Questions...
      </div>
    );
  }

  // --- MATH DETENTION SCREEN ---
  if (isDetention) {
    return (
      <div
        className="fixed inset-0 bg-[#FF6B9E] z-50 flex flex-col items-center justify-center p-6 text-black font-sans select-none"
        style={{
          backgroundImage: "radial-gradient(#000 2px, transparent 2px)",
          backgroundSize: "32px 32px",
        }}
      >
        <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tight bg-white border-[6px] border-black px-8 py-2 shadow-[12px_12px_0px_0px_#000] rotate-2">
          LOCKED OUT
        </h1>

        <div className="text-8xl md:text-9xl font-black bg-white px-10 py-4 mb-12 border-[6px] border-black shadow-[12px_12px_0px_0px_#000] -rotate-1">
          {Math.floor(timeLeft / 60)}:
          {(timeLeft % 60).toString().padStart(2, "0")}
        </div>

        <div className="bg-white p-8 md:p-12 border-[6px] border-black shadow-[16px_16px_0px_0px_#000] w-full max-w-xl text-center">
          <p className="mb-6 text-black font-black uppercase tracking-widest text-lg flex items-center justify-center gap-2">
            <AlertTriangle className="w-8 h-8 text-[#FF6B9E]" />
            Solve to reduce time (-30s)
          </p>

          <div className="text-6xl md:text-7xl font-black mb-8">
            {problem.text} = ?
          </div>

          <input
            type="number"
            autoFocus
            className="text-black text-5xl font-black text-center p-6 w-full mb-6 outline-none border-[6px] border-black shadow-[8px_8px_0px_0px_#000] focus:translate-x-2 focus:translate-y-2 focus:shadow-none transition-all"
            value={mathInput}
            onChange={(e) => setMathInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleMathSubmit()}
            placeholder="?"
          />

          <button
            onClick={handleMathSubmit}
            className="w-full bg-[#FFE600] text-black font-black text-3xl uppercase py-6 border-[6px] border-black shadow-[8px_8px_0px_0px_#000] hover:translate-x-2 hover:translate-y-2 hover:shadow-none active:bg-black active:text-white transition-all"
          >
            Submit Answer
          </button>
        </div>
      </div>
    );
  }

  // --- CONGRATULATIONS SCREEN ---
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
              sessionStorage.clear();
              router.push("/");
            }}
            className="w-full bg-[#25c0f4] border-[6px] border-black p-6 text-3xl font-black uppercase text-black shadow-[8px_8px_0px_0px_#000] hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // --- ACTIVE QUESTION SCREEN ---
  const currentQuestion = questions[currentIndex];
  const progressPercent = (currentIndex / questions.length) * 100;

  return (
    <div
      className="min-h-screen bg-[#f5f8f8] flex flex-col items-center p-6 font-sans selection:bg-[#FFE600] selection:text-black"
      style={{
        backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
      <header className="w-full max-w-4xl bg-white border-[6px] border-black p-4 flex justify-between items-center shadow-[8px_8px_0px_0px_#000] mb-8 relative overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-[#25c0f4] border-r-[6px] border-black z-0 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
        <div className="bg-black text-white px-4 py-2 font-black uppercase tracking-widest text-sm z-10">
          Integrity Guard
        </div>
        <div className="font-black text-2xl uppercase tracking-tighter bg-white px-4 py-1 border-4 border-black z-10">
          Q: {currentIndex + 1} / {questions.length}
        </div>
      </header>

      {errorMsg && (
        <div className="w-full max-w-4xl bg-[#FF6B9E] text-black border-[6px] border-black shadow-[8px_8px_0px_0px_#000] p-4 font-black uppercase text-center mb-8 animate-pulse">
          {errorMsg}
        </div>
      )}

      <main className="w-full max-w-4xl flex flex-col gap-8 flex-grow">
        <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-8 md:p-12">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-tight text-black">
            {currentQuestion?.text}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentQuestion?.options.map((option, idx) => {
            if (!option) return null;
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

        <button
          onClick={handleNextQuestion}
          className="mt-8 bg-[#00E57A] border-[6px] border-black p-8 flex items-center justify-between shadow-[12px_12px_0px_0px_#000] hover:translate-x-2 hover:translate-y-2 hover:shadow-none active:bg-black active:text-white transition-all group"
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
