"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../utils/Supabase/client";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import {
  CheckCircle2,
  XCircle,
  TrendingUp,
  Users,
  Award,
  Download,
  Eye,
  Clock,
  PenLine,
  Check,
  X,
} from "lucide-react";

type QuestionType = "mc" | "tf" | "fib" | "ms" | "short" | "long";

interface Student {
  id: string;
  name: string;
  status: string;
  score: number | null;
  correct_answers: number | null;
  total_questions: number | null;
  created_at: string;
}

interface StudentAnswer {
  id: string;
  student_id: string;
  question_text: string;
  question_type: QuestionType;
  selected_answer: string;
  correct_answer: string;
  is_correct: boolean | null;
  needs_grading: boolean;
  manual_score: number | null;
  answered_at: string;
}

interface Exam {
  id: string;
  title: string;
  code: string;
}

const TYPE_LABELS: Record<QuestionType, string> = {
  mc: "Multiple Choice",
  tf: "True / False",
  fib: "Fill in the Blank",
  ms: "Multiple Select",
  short: "Short Answer",
  long: "Long Answer",
};

const TYPE_COLORS: Record<QuestionType, string> = {
  mc: "bg-[#25c0f4] text-black",
  tf: "bg-[#00E57A] text-black",
  fib: "bg-[#FFE600] text-black",
  ms: "bg-[#a855f7] text-white",
  short: "bg-[#FF6B9E] text-black",
  long: "bg-[#5A87FF] text-white",
};

// Supabase'den gelen her türlü type değerini normalize et
const normalizeType = (raw: string | undefined | null): QuestionType => {
  const val = (raw || "mc").toString().trim().toLowerCase();
  const map: Record<string, QuestionType> = {
    mc: "mc",
    multiple_choice: "mc",
    "multiple choice": "mc",
    multiplechoice: "mc",
    tf: "tf",
    true_false: "tf",
    "true/false": "tf",
    "true false": "tf",
    fib: "fib",
    fill_in_blank: "fib",
    fill_in_the_blank: "fib",
    "fill in the blank": "fib",
    ms: "ms",
    multiple_select: "ms",
    "multiple select": "ms",
    short: "short",
    short_answer: "short",
    "short answer": "short",
    long: "long",
    long_answer: "long",
    "long answer": "long",
  };
  return map[val] || "mc";
};

const NEEDS_MANUAL: QuestionType[] = ["short", "long"];

export default function TeacherResultsPage() {
  const params = useParams();
  const examCode = params.code as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentAnswers, setStudentAnswers] = useState<StudentAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingAnswers, setViewingAnswers] = useState(false);
  const [pendingGradingCount, setPendingGradingCount] = useState(0);

  // Grading modal state
  const [gradingAnswer, setGradingAnswer] = useState<StudentAnswer | null>(
    null,
  );
  const [manualScore, setManualScore] = useState<string>("");
  const [gradingLoading, setGradingLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [examCode]);

  const fetchData = async () => {
    try {
      const { data: examData } = await supabase
        .from("exams")
        .select("*")
        .ilike("code", examCode)
        .single();

      if (examData) {
        setExam(examData);
        const { count } = await supabase
          .from("questions")
          .select("*", { count: "exact", head: true })
          .eq("exam_id", examData.id);
        if (count) setTotalQuestions(count);

        const { count: pendingCount } = await supabase
          .from("student_answers")
          .select("*", { count: "exact", head: true })
          .eq("exam_id", examData.id)
          .eq("needs_grading", true)
          .is("is_correct", null);
        setPendingGradingCount(pendingCount || 0);
      }

      const { data: studentData } = await supabase
        .from("students")
        .select("*")
        .ilike("exam_code", examCode)
        .order("created_at", { ascending: false });
      if (studentData) setStudents(studentData);
    } catch (err: unknown) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const viewStudentAnswers = async (student: Student) => {
    setSelectedStudent(student);
    setViewingAnswers(true);
    try {
      const { data: answers } = await supabase
        .from("student_answers")
        .select("*")
        .eq("student_id", student.id)
        .order("answered_at", { ascending: true });
      if (answers) {
        // question_type'ı normalize et
        setStudentAnswers(
          answers.map((a) => ({
            ...a,
            question_type: normalizeType(a.question_type),
          })),
        );
      }
    } catch (err: unknown) {
      console.error("Answers fetch error:", err);
    }
  };

  const submitGrade = async (
    answerId: string,
    isCorrect: boolean,
    score?: number,
  ) => {
    setGradingLoading(true);
    try {
      const updatePayload: Record<string, unknown> = {
        is_correct: isCorrect,
        needs_grading: false,
      };
      if (score !== undefined) updatePayload.manual_score = score;
      await supabase
        .from("student_answers")
        .update(updatePayload)
        .eq("id", answerId);
      setStudentAnswers((prev) =>
        prev.map((a) =>
          a.id === answerId
            ? {
                ...a,
                is_correct: isCorrect,
                needs_grading: false,
                manual_score: score ?? null,
              }
            : a,
        ),
      );
      setGradingAnswer(null);
      setManualScore("");
      setPendingGradingCount((c) => Math.max(0, c - 1));
    } catch (err: unknown) {
      console.error("Grading error:", err);
    } finally {
      setGradingLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Name",
      "Percentage (%)",
      "Correct Answers",
      "Total Questions",
      "Status",
      "Date",
    ];
    const rows = students.map((s) => [
      s.name,
      `${s.score || 0}%`,
      s.correct_answers || 0,
      totalQuestions,
      s.status,
      new Date(s.created_at).toLocaleString(),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exam?.title || "exam"}-results.csv`;
    a.click();
  };

  const finishedStudents = students.filter((s) => s.status === "finished");
  const scores = finishedStudents.map((s) => s.score || 0);
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;

  if (loading)
    return (
      <div className="min-h-screen bg-[#FFE600] flex items-center justify-center font-black text-6xl border-[16px] border-black">
        Loading Results...
      </div>
    );

  // ── GRADING MODAL ──
  const GradingModal = () => {
    if (!gradingAnswer) return null;
    const isLong = gradingAnswer.question_type === "long";
    return (
      <div className="fixed inset-0 bg-black/70 z-[500] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-6 max-w-lg w-full">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span
                className={`${TYPE_COLORS[gradingAnswer.question_type]} px-2 py-1 text-xs border-2 border-black font-black`}
              >
                {TYPE_LABELS[gradingAnswer.question_type]}
              </span>
              <h3 className="text-xl font-black uppercase mt-2">
                Grade This Answer
              </h3>
            </div>
            <button
              onClick={() => {
                setGradingAnswer(null);
                setManualScore("");
              }}
              className="bg-black text-white px-3 py-1 font-black text-xl hover:bg-red-500 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="bg-[#f5f8f8] border-4 border-black p-4 mb-3">
            <p className="text-xs font-black uppercase text-black/50 mb-1">
              Question:
            </p>
            <p className="font-bold text-black">
              {gradingAnswer.question_text}
            </p>
          </div>

          <div className="bg-[#FFE600] border-4 border-black p-4 mb-3">
            <p className="text-xs font-black uppercase text-black/50 mb-1">
              Student&apos;s Answer:
            </p>
            <p className="font-bold text-black whitespace-pre-wrap">
              {gradingAnswer.selected_answer}
            </p>
          </div>

          {gradingAnswer.correct_answer && (
            <div className="bg-[#00E57A] border-4 border-black p-4 mb-3">
              <p className="text-xs font-black uppercase text-black/50 mb-1">
                Reference Answer:
              </p>
              <p className="font-bold text-black">
                {gradingAnswer.correct_answer}
              </p>
            </div>
          )}

          {isLong && (
            <div className="mb-4">
              <label className="block text-xs font-black uppercase mb-2">
                Score (optional, 0–100):
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={manualScore}
                onChange={(e) => setManualScore(e.target.value)}
                placeholder="e.g. 75"
                className="w-full border-4 border-black p-3 text-xl font-black text-center outline-none shadow-[3px_3px_0px_0px_#000] focus:shadow-none focus:translate-x-1 focus:translate-y-1 transition-all"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() =>
                submitGrade(
                  gradingAnswer.id,
                  false,
                  isLong && manualScore ? parseInt(manualScore) : undefined,
                )
              }
              disabled={gradingLoading}
              className="flex items-center justify-center gap-2 bg-[#FF6B9E] border-4 border-black p-4 font-black uppercase text-lg shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50"
            >
              <X className="w-6 h-6 stroke-[3]" /> Incorrect
            </button>
            <button
              onClick={() =>
                submitGrade(
                  gradingAnswer.id,
                  true,
                  isLong && manualScore ? parseInt(manualScore) : undefined,
                )
              }
              disabled={gradingLoading}
              className="flex items-center justify-center gap-2 bg-[#00E57A] border-4 border-black p-4 font-black uppercase text-lg shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50"
            >
              <Check className="w-6 h-6 stroke-[3]" /> Correct
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── STUDENT DETAIL VIEW ──
  if (viewingAnswers && selectedStudent) {
    const pendingAnswers = studentAnswers.filter(
      (a) => a.needs_grading && a.is_correct === null,
    );

    return (
      <div
        className="min-h-screen flex flex-col font-sans bg-[#f5f8f8]"
        style={{
          backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      >
        <Navbar />
        <GradingModal />
        <main className="flex-grow p-6 md:p-12 max-w-6xl mx-auto w-full">
          <button
            onClick={() => setViewingAnswers(false)}
            className="text-red-500 mb-8 bg-white border-4 border-black px-6 py-3 font-black uppercase shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            ← Back to Results
          </button>

          {/* Student score header */}
          <div className="text-black bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-8 mb-8">
            <h1 className="text-5xl font-black uppercase tracking-tighter mb-4">
              {selectedStudent.name}
            </h1>
            <div className="flex flex-wrap gap-4">
              <div className="bg-[#00E57A] border-4 border-black px-6 py-3">
                <div className="text-4xl font-black">
                  {selectedStudent.score || 0}%
                </div>
                <div className="text-sm font-black uppercase">Score</div>
              </div>
              <div className="bg-[#5A87FF] border-4 border-black px-6 py-3 text-white">
                <div className="text-4xl font-black">
                  {selectedStudent.correct_answers || 0} / {totalQuestions}
                </div>
                <div className="text-sm font-black uppercase">Correct</div>
              </div>
              {pendingAnswers.length > 0 && (
                <div className="bg-[#FFE600] border-4 border-black px-6 py-3">
                  <div className="text-4xl font-black">
                    {pendingAnswers.length}
                  </div>
                  <div className="text-sm font-black uppercase">
                    Needs Grading
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Answers list */}
          <div className="space-y-6">
            <h2 className="text-black text-3xl font-black uppercase bg-white border-4 border-black inline-block px-4 py-2 shadow-[4px_4px_0px_0px_#000]">
              Question by Question
            </h2>

            {studentAnswers.length === 0 && (
              <div className="bg-white border-4 border-black p-8 text-xl font-bold">
                No answers recorded for this student.
              </div>
            )}

            {studentAnswers.map((answer, idx) => {
              const qType = answer.question_type;
              const isManual = NEEDS_MANUAL.includes(qType);
              const needsGrading =
                answer.needs_grading && answer.is_correct === null;
              const bgColor = needsGrading
                ? "bg-[#FFE600]"
                : answer.is_correct
                  ? "bg-[#00E57A]"
                  : "bg-[#FF6B9E]";

              return (
                <div
                  key={answer.id}
                  className={`text-gray-900 border-[6px] border-black p-6 shadow-[8px_8px_0px_0px_#000] ${bgColor}`}
                >
                  <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="bg-black text-white px-4 py-2 font-black text-2xl">
                        {idx + 1}
                      </div>
                      <span
                        className={`${TYPE_COLORS[qType]} px-2 py-1 text-xs border-2 border-black font-black`}
                      >
                        {TYPE_LABELS[qType]}
                      </span>
                      {needsGrading ? (
                        <Clock className="w-7 h-7 text-black" strokeWidth={3} />
                      ) : answer.is_correct ? (
                        <CheckCircle2
                          className="w-7 h-7 text-black"
                          strokeWidth={3}
                        />
                      ) : (
                        <XCircle
                          className="w-7 h-7 text-black"
                          strokeWidth={3}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {answer.manual_score !== null && (
                        <span className="text-sm font-black uppercase bg-black text-white px-3 py-1 border-2 border-black">
                          Score: {answer.manual_score}/100
                        </span>
                      )}
                      <div className="text-sm font-black uppercase bg-black text-white px-3 py-1 border-2 border-black">
                        {needsGrading
                          ? "⏳ Pending"
                          : answer.is_correct
                            ? "✓ Correct"
                            : "✗ Incorrect"}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-2xl font-black mb-4 uppercase">
                    {answer.question_text}
                  </h3>

                  <div className="space-y-2 bg-white/50 p-4 border-4 border-black">
                    <div className="flex gap-2 flex-wrap">
                      <span className="font-black uppercase text-sm whitespace-nowrap">
                        Student Answer:
                      </span>
                      <span className="font-bold whitespace-pre-wrap">
                        {answer.selected_answer}
                      </span>
                    </div>
                    {/* Show correct answer only for auto-graded wrong answers */}
                    {!isManual &&
                      !answer.is_correct &&
                      answer.correct_answer && (
                        <div className="flex gap-2 flex-wrap">
                          <span className="font-black uppercase text-sm whitespace-nowrap">
                            Correct Answer:
                          </span>
                          <span className="font-bold">
                            {answer.correct_answer}
                          </span>
                        </div>
                      )}
                    {/* Show reference for manual types */}
                    {isManual && answer.correct_answer && (
                      <div className="flex gap-2 flex-wrap">
                        <span className="font-black uppercase text-sm text-black/50 whitespace-nowrap">
                          Reference:
                        </span>
                        <span className="font-bold text-black/60">
                          {answer.correct_answer}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Grade button for short/long */}
                  {isManual && (
                    <button
                      onClick={() => {
                        setGradingAnswer(answer);
                        setManualScore(answer.manual_score?.toString() || "");
                      }}
                      className="mt-4 flex items-center gap-2 bg-black text-white border-4 border-black px-4 py-2 font-black uppercase text-sm shadow-[4px_4px_0px_0px_#555] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                    >
                      <PenLine className="w-4 h-4" />
                      {needsGrading ? "Grade Answer" : "Re-grade"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── MAIN RESULTS DASHBOARD ──
  return (
    <div
      className="min-h-screen flex flex-col font-sans bg-[#FFE600]"
      style={{
        backgroundImage: "radial-gradient(#000 2px, transparent 2px)",
        backgroundSize: "32px 32px",
      }}
    >
      <Navbar />
      <GradingModal />
      <main className="flex-grow p-6 md:p-12 max-w-[1600px] mx-auto w-full">
        {/* HEADER */}
        <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="bg-black text-white inline-block px-4 py-1 font-black uppercase text-sm mb-4 border-2 border-black shadow-[2px_2px_0px_0px_#25c0f4]">
                Results Dashboard
              </div>
              <h1 className="text-[#25c0f4] text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">
                {exam?.title || "Exam Results"}
              </h1>
              <p className="text-black text-2xl font-bold mt-2">
                CODE:{" "}
                <span className="bg-[#FFE600] px-2 border-2 border-black">
                  {examCode}
                </span>
              </p>
            </div>
            <button
              onClick={exportToCSV}
              className="bg-[#25c0f4] border-4 border-black px-6 py-3 font-black uppercase shadow-[6px_6px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2"
            >
              <Download className="w-6 h-6 stroke-[3]" /> Export CSV
            </button>
          </div>
        </div>

        {/* PENDING GRADING BANNER */}
        {pendingGradingCount > 0 && (
          <div className="bg-[#FFE600] border-[4px] border-black shadow-[6px_6px_0px_0px_#000] p-4 mb-8 flex items-center gap-4">
            <PenLine className="w-8 h-8 stroke-[3] flex-shrink-0" />
            <div>
              <p className="font-black uppercase text-lg">
                {pendingGradingCount} answer{pendingGradingCount > 1 ? "s" : ""}{" "}
                need manual grading
              </p>
              <p className="font-bold text-black/70 text-sm uppercase">
                Click &quot;View Answers&quot; on each student to grade short /
                long answers
              </p>
            </div>
          </div>
        )}

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#5A87FF] border-4 border-black shadow-[6px_6px_0px_0px_#000] p-6 hover:-translate-y-1 transition-transform">
            <Users className="w-10 h-10 text-white mb-2" strokeWidth={3} />
            <div className="text-4xl font-black text-white">
              {students.length}
            </div>
            <div className="text-sm font-black uppercase text-white tracking-widest mt-1">
              Total Students
            </div>
          </div>
          <div className="bg-[#00E57A] border-4 border-black shadow-[6px_6px_0px_0px_#000] p-6 hover:-translate-y-1 transition-transform">
            <CheckCircle2
              className="w-10 h-10 text-black mb-2"
              strokeWidth={3}
            />
            <div className="text-4xl font-black text-black">
              {finishedStudents.length}
            </div>
            <div className="text-sm font-black uppercase tracking-widest mt-1">
              Completed
            </div>
          </div>
          <div className="bg-[#FF6B9E] border-4 border-black shadow-[6px_6px_0px_0px_#000] p-6 hover:-translate-y-1 transition-transform">
            <TrendingUp className="w-10 h-10 text-black mb-2" strokeWidth={3} />
            <div className="text-4xl font-black text-black">{avgScore}%</div>
            <div className="text-sm font-black uppercase tracking-widest mt-1">
              Average Score
            </div>
          </div>
          <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_#000] p-6 hover:-translate-y-1 transition-transform">
            <Award className="w-10 h-10 text-black mb-2" strokeWidth={3} />
            <div className="text-4xl font-black text-black">
              {highestScore}%
            </div>
            <div className="text-sm font-black uppercase tracking-widest mt-1">
              Highest Score
            </div>
          </div>
        </div>

        {/* STUDENTS TABLE */}
        <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black text-white border-b-4 border-black">
                  <th className="p-4 font-black uppercase text-sm tracking-widest">
                    Student Name
                  </th>
                  <th className="p-4 font-black uppercase text-sm tracking-widest">
                    Percentage
                  </th>
                  <th className="p-4 font-black uppercase text-sm tracking-widest">
                    Correct Answers
                  </th>
                  <th className="p-4 font-black uppercase text-sm tracking-widest">
                    Status
                  </th>
                  <th className="p-4 font-black uppercase text-sm tracking-widest">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center font-black uppercase text-xl"
                    >
                      Awaiting initial student data...
                    </td>
                  </tr>
                )}
                {students.map((student) => {
                  const isFinished = student.status === "finished";
                  const percentage = student.score || 0;
                  const correctCount = student.correct_answers || 0;
                  let scoreColor = "bg-[#FF6B9E]";
                  if (percentage >= 80) scoreColor = "bg-[#00E57A]";
                  else if (percentage >= 60) scoreColor = "bg-[#FFE600]";

                  return (
                    <tr
                      key={student.id}
                      className="border-b-4 border-black last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <td className="text-black p-4 font-black uppercase tracking-tight text-lg">
                        {student.name}
                      </td>
                      <td className="text-black p-4">
                        {isFinished ? (
                          <span
                            className={`${scoreColor} px-3 py-1 border-4 border-black font-black text-xl shadow-[2px_2px_0px_0px_#000] inline-block whitespace-nowrap`}
                          >
                            {percentage}%
                          </span>
                        ) : (
                          <span className="text-black/30 font-black text-xl">
                            —
                          </span>
                        )}
                      </td>
                      <td className="text-black p-4">
                        {isFinished ? (
                          <span className="bg-white px-3 py-1 border-4 border-black font-black text-xl shadow-[2px_2px_0px_0px_#000] inline-block whitespace-nowrap">
                            {correctCount} / {totalQuestions}
                          </span>
                        ) : (
                          <span className="text-black/30 font-black text-xl">
                            —
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 font-black uppercase text-xs border-2 border-black ${isFinished ? "bg-[#00E57A] text-black shadow-[2px_2px_0px_0px_#000]" : "bg-white text-black/50 border-black/50"}`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {isFinished && (
                          <button
                            onClick={() => viewStudentAnswers(student)}
                            className="bg-[#5A87FF] text-white border-4 border-black px-4 py-2 font-black uppercase text-sm shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2"
                          >
                            <Eye className="w-5 h-5 stroke-[3]" /> View Answers
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
