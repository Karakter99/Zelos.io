"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/utils/Supabase/client";
import {
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Clock,
  Hourglass,
} from "lucide-react";

interface Question {
  id: string;
  text: string;
  options: string[];
  // Note: 'answer' is GONE. The frontend never sees it!
}

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [examStatus, setExamStatus] = useState<string>("waiting");
  const [examTimeLimit, setExamTimeLimit] = useState<number | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [isFinished, setIsFinished] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [examId, setExamId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [score, setScore] = useState(0);

  const [isDetention, setIsDetention] = useState(false);
  const [detentionEndTime, setDetentionEndTime] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [problem, setProblem] = useState(createProblem());
  const [mathInput, setMathInput] = useState("");

  const [examEndTime, setExamEndTime] = useState<number | null>(null);
  const [examTimeLeft, setExamTimeLeft] = useState<number | null>(null);

  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(
    new Set(),
  );

  const forceSubmitExam = useCallback(async () => {
    setIsTimedOut(true);
    setIsDetention(false);
    setDetentionEndTime(null);

    try {
      if (studentId) {
        await supabase
          .from("students")
          .update({
            status: "finished",
            detention_end_time: null,
            current_question_index: questions.length,
          })
          .eq("id", studentId);
      }
    } catch (err: unknown) {
      console.error("Auto-submit failed", err);
    }
  }, [studentId, questions.length]);

  // 1. INITIALIZATION
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
          .select("status, detention_end_time, score, current_question_index")
          .eq("id", storedStudentId)
          .single();

        if (studentData) {
          if (studentData.score) setScore(studentData.score);
          if (studentData.status === "finished") setIsFinished(true);
          if (studentData.current_question_index !== null) {
            setCurrentIndex(studentData.current_question_index);
          }

          if (
            studentData.detention_end_time &&
            studentData.status !== "finished"
          ) {
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
          .select("id, time_limit, status")
          .eq("code", storedExamCode)
          .single();

        if (examErr || !examData) throw new Error("Could not find exam.");

        setExamId(examData.id);
        const currentStatus = examData.status || "live";
        setExamStatus(currentStatus);
        setExamTimeLimit(examData.time_limit);

        if (
          currentStatus === "live" &&
          examData.time_limit &&
          !studentData?.status?.includes("finished")
        ) {
          const storageKey = `exam-start-${storedStudentId}`;
          let examStartTime = localStorage.getItem(storageKey);
          if (!examStartTime) {
            examStartTime = Date.now().toString();
            localStorage.setItem(storageKey, examStartTime);
          }
          setExamEndTime(
            parseInt(examStartTime) + examData.time_limit * 60 * 1000,
          );
        }

        // 🟢 SECURE FETCH: CALL V2 (Matches the new SQL script) 🟢
        const { data: questionsData, error: questionsErr } = await supabase.rpc(
          "get_exam_questions_v2",
          { p_exam_id: examData.id }, // Note the new parameter name 'p_exam_id'
        );

        if (questionsErr || !questionsData)
          throw new Error("Could not load questions.");

        if (questionsData && questionsData.length > 0) {
          const savedOrder = localStorage.getItem(
            `order-${storedExamCode}-${storedName}`,
          );
          let finalQuestions: Question[] = [];

          if (savedOrder) {
            const orderIds = JSON.parse(savedOrder);
            const orderedQs = orderIds
              .map((id: string) =>
                questionsData.find((q: Question) => q.id === id),
              )
              .filter(Boolean) as Question[];
            const newQs = questionsData.filter(
              (q: Question) => !orderIds.includes(q.id),
            ) as Question[];
            finalQuestions = [...orderedQs, ...newQs];
          } else {
            finalQuestions = [...questionsData].sort(
              () => Math.random() - 0.5,
            ) as Question[];
            localStorage.setItem(
              `order-${storedExamCode}-${storedName}`,
              JSON.stringify(finalQuestions.map((q: Question) => q.id)),
            );
          }
          setQuestions(finalQuestions);
        }
      } catch (err: unknown) {
        console.error("Initialization Error:", err);
        router.push("/exam");
      } finally {
        setLoading(false);
      }
    };

    startExam();
  }, [router, forceSubmitExam]);

  // 2. REALTIME LISTENERS
  useEffect(() => {
    if (!examId) return;
    const channel = supabase
      .channel(`exam-updates-${examId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "exams",
          filter: `id=eq.${examId}`,
        },
        (payload) => {
          const updatedExam = payload.new;
          if (updatedExam.status === "live") {
            setExamStatus("live");
            const timeLimitToUse = updatedExam.time_limit || examTimeLimit;
            if (timeLimitToUse && studentId) {
              const storageKey = `exam-start-${studentId}`;
              let examStartTime = localStorage.getItem(storageKey);
              if (!examStartTime) {
                examStartTime = Date.now().toString();
                localStorage.setItem(storageKey, examStartTime);
              }
              setExamEndTime(
                parseInt(examStartTime) + timeLimitToUse * 60 * 1000,
              );
            }
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [examId, examTimeLimit, studentId]);

  useEffect(() => {
    if (!studentId) return;
    const channel = supabase
      .channel(`student-${studentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "students",
          filter: `id=eq.${studentId}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          const newEndTime = payload.new.detention_end_time;
          // 🟢 LISTEN FOR SCORE UPDATES FROM DB TRIGGER
          const newScore = payload.new.score;
          if (newScore !== undefined && newScore !== null) {
            setScore(newScore);
          }

          if (newStatus === "active" && !newEndTime) {
            setIsDetention(false);
            setDetentionEndTime(null);
          } else if (newStatus === "detention" && newEndTime) {
            setIsDetention(true);
            setDetentionEndTime(newEndTime);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  // Timer & Detention Logic
  useEffect(() => {
    if (!examEndTime || isFinished || isTimedOut || examStatus === "waiting")
      return;
    const checkTime = () => {
      const remainingMs = examEndTime - Date.now();
      if (remainingMs <= 0) {
        setExamTimeLeft(0);
        forceSubmitExam();
        return true;
      }
      setExamTimeLeft(Math.floor(remainingMs / 1000));
      return false;
    };
    if (checkTime()) return;
    const timer = setInterval(() => {
      if (checkTime()) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [examEndTime, isFinished, isTimedOut, examStatus, forceSubmitExam]);

  useEffect(() => {
    if (
      !studentId ||
      isFinished ||
      isTimedOut ||
      isDetention ||
      examStatus === "waiting"
    )
      return;
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
            current_question_index: currentIndex,
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
  }, [
    studentId,
    isFinished,
    isTimedOut,
    isDetention,
    examStatus,
    currentIndex,
  ]);

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

  const handleMathSubmit = async () => {
    if (parseInt(mathInput) === problem.answer) {
      const currentEnd = new Date(detentionEndTime || Date.now()).getTime();
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

  // 🟢 3. NEXT QUESTION (NO CLIENT GRADING) 🟢
  const handleNextQuestion = async () => {
    if (!selectedOption) {
      setErrorMsg("⚠️ YOU MUST SELECT AN ANSWER!");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const isLastQuestion = currentIndex === questions.length - 1;
      const currentQ = questions[currentIndex];

      if (answeredQuestions.has(currentQ.id)) {
        if (!isLastQuestion) {
          setCurrentIndex(currentIndex + 1);
          setSelectedOption("");
        } else {
          setIsFinished(true);
        }
        setIsSubmitting(false);
        return;
      }

      const optionIndex = currentQ.options.findIndex(
        (opt) => opt.trim() === selectedOption.trim(),
      );
      const studentLetter =
        optionIndex !== -1 ? String.fromCharCode(65 + optionIndex) : "UNKNOWN";

      // 🟢 CHECK DB: Did we already answer this?
      const { data: existingAnswer } = await supabase
        .from("student_answers")
        .select("id")
        .eq("student_id", studentId)
        .eq("question_id", currentQ.id)
        .maybeSingle();

      if (!existingAnswer) {
        // 🟢 SUBMIT ANSWER BLINDLY - DB WILL GRADE IT 🟢
        const { error: insertError } = await supabase
          .from("student_answers")
          .insert({
            student_id: studentId,
            exam_id: examId,
            question_id: currentQ.id,
            question_text: currentQ.text,
            selected_answer: studentLetter,
            // NO correct_answer or is_correct here! DB Trigger handles it!
          });

        if (!insertError)
          setAnsweredQuestions((prev) => new Set(prev).add(currentQ.id));
      } else {
        setAnsweredQuestions((prev) => new Set(prev).add(currentQ.id));
      }

      if (!isLastQuestion) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setSelectedOption("");
        await supabase
          .from("students")
          .update({ current_question_index: nextIndex })
          .eq("id", studentId);
      } else {
        setIsFinished(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#25c0f4] flex items-center justify-center font-black text-6xl uppercase border-16px border-black">
        Loading...
      </div>
    );

  if (examStatus === "waiting") {
    return (
      <div
        className="min-h-screen bg-[#FFE600] flex flex-col items-center justify-center p-6 text-center"
        style={{
          backgroundImage: "radial-gradient(#000 2px, transparent 2px)",
          backgroundSize: "32px 32px",
        }}
      >
        <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-10 md:p-16 max-w-2xl w-full animate-in zoom-in duration-500">
          <div className="size-24 bg-black text-[#FFE600] flex items-center justify-center mx-auto mb-6 border-4 border-black shadow-[6px_6px_0px_0px_#25c0f4] animate-spin-slow">
            <Hourglass className="w-12 h-12 stroke-[3]" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-black mb-4 leading-none">
            Waiting Room
          </h1>
          <p className="text-xl font-bold uppercase tracking-widest text-black/70 mb-4 border-2 border-dashed border-black p-4 bg-gray-50">
            Wait for your teacher to open the exam. Do not refresh this page.
          </p>
        </div>
      </div>
    );
  }

  if (isTimedOut)
    return (
      <div
        className="min-h-screen bg-[#25c0f4] flex flex-col items-center justify-center p-6 text-center selection:bg-black selection:text-[#25c0f4]"
        style={{
          backgroundImage: "radial-gradient(#000 2px, transparent 2px)",
          backgroundSize: "32px 32px",
        }}
      >
        <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-10 md:p-16 max-w-2xl w-full">
          <Clock className="w-16 h-16 stroke-[3] mx-auto mb-6 text-[#25c0f4]" />
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-black mb-4 leading-none">
            Time&apos;s Up!
          </h1>
          <p className="text-xl font-bold uppercase tracking-widest text-black/70 mb-10">
            Your exam time has ended.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem(`exam-start-${studentId}`);
              sessionStorage.clear();
              router.push("/");
            }}
            className="w-full bg-[#FFE600] border-[4px] border-black p-5 text-2xl font-black uppercase text-black shadow-[6px_6px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            Return to Home
          </button>
        </div>
      </div>
    );

  if (isFinished)
    return (
      <div
        className="min-h-screen bg-[#00E57A] flex flex-col items-center justify-center p-6 text-center selection:bg-black selection:text-[#00E57A]"
        style={{
          backgroundImage: "radial-gradient(#000 2px, transparent 2px)",
          backgroundSize: "32px 32px",
        }}
      >
        <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-10 md:p-16 max-w-2xl w-full">
          <CheckCircle2 className="w-16 h-16 stroke-[3] mx-auto mb-6 text-[#00E57A]" />
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-black mb-4 leading-none">
            Exam Complete!
          </h1>
          <button
            onClick={() => {
              localStorage.removeItem(`exam-start-${studentId}`);
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

  if (isDetention)
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
            <AlertTriangle className="w-6 h-6 text-[#FF6B9E]" /> Solve to reduce
            time (-30s)
          </p>
          <div className="text-5xl md:text-6xl font-black mb-6">
            {problem.text} = ?
          </div>
          <input
            type="number"
            autoFocus
            className="text-black text-4xl font-black text-center p-4 w-full mb-6 outline-none border-[4px] border-black shadow-[6px_6px_0px_0px_#000] focus:translate-x-1 focus:translate-y-1 transition-all"
            value={mathInput}
            onChange={(e) => setMathInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleMathSubmit()}
            placeholder="?"
          />
          <button
            onClick={handleMathSubmit}
            className="w-full bg-[#FFE600] text-black font-black text-2xl uppercase py-4 border-[4px] border-black shadow-[6px_6px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 active:bg-black active:text-white transition-all"
          >
            Submit Answer
          </button>
        </div>
      </div>
    );

  const currentQuestion = questions[currentIndex];
  const progressPercent =
    questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  const isTimeRunningOut = examTimeLeft !== null && examTimeLeft <= 60;

  if (!currentQuestion)
    return (
      <div className="min-h-screen bg-[#FF6B9E] flex items-center justify-center font-black text-5xl border-[8px] border-black">
        Error loading questions.
      </div>
    );

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
        <div className="bg-black text-white px-3 py-1 font-black uppercase tracking-widest text-xs z-10 hidden sm:block">
          Integrity Guard
        </div>

        {examTimeLeft !== null && (
          <div
            className={`flex items-center justify-center gap-2 px-4 py-1 font-black uppercase tracking-widest text-lg z-10 border-[3px] border-black transition-colors ${isTimeRunningOut ? "bg-[#FF6B9E] text-black animate-pulse shadow-[2px_2px_0px_0px_#000]" : "bg-white text-black shadow-[2px_2px_0px_0px_#000]"}`}
          >
            <Clock className="w-5 h-5 stroke-[3]" />
            {formatTime(examTimeLeft)}
          </div>
        )}

        <div className="font-black text-xl uppercase tracking-tighter bg-white px-3 py-1 border-[3px] border-black z-10 shadow-[2px_2px_0px_0px_#000]">
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
            {currentQuestion.text}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {currentQuestion.options?.map((option, idx) => {
            if (!option) return null;
            const isSelected = selectedOption === option;

            return (
              <button
                key={idx}
                onClick={() => !isSubmitting && setSelectedOption(option)}
                className={`text-left p-4 md:p-6 border-[4px] border-black text-lg md:text-xl font-black uppercase tracking-tight transition-all flex items-center ${isSelected ? "bg-black text-[#00E57A] shadow-none translate-x-1 translate-y-1" : "bg-white text-black shadow-[6px_6px_0px_0px_#000] hover:bg-gray-50"} ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span
                  className={`px-3 py-1 mr-4 border-[3px] font-black ${isSelected ? "bg-[#00E57A] text-black border-[#00E57A]" : "bg-black text-white border-black"}`}
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
          disabled={isSubmitting}
          className="mt-4 bg-[#00E57A] border-[4px] border-black p-5 flex items-center justify-between shadow-[8px_8px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-2 active:translate-y-2 active:shadow-none active:bg-black active:text-white transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-black group-active:text-white">
            {isSubmitting
              ? "Submitting..."
              : currentIndex === questions.length - 1
                ? "Submit Exam"
                : "Next Question"}
          </span>
          <ArrowRight className="w-10 h-10 stroke-[4] transition-transform group-hover:translate-x-3 text-black group-active:text-white" />
        </button>
      </main>
    </div>
  );
}
