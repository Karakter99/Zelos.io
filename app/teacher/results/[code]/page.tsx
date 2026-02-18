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
} from "lucide-react";

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
  selected_answer: string;
  correct_answer: string;
  is_correct: boolean;
  answered_at: string;
}

interface Exam {
  id: string;
  title: string;
  code: string;
}

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

  useEffect(() => {
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

    fetchData();
  }, [examCode]);

  const viewStudentAnswers = async (student: Student) => {
    setSelectedStudent(student);
    setViewingAnswers(true);

    try {
      const { data: answers } = await supabase
        .from("student_answers")
        .select("*")
        .eq("student_id", student.id)
        .order("answered_at", { ascending: true });

      if (answers) setStudentAnswers(answers);
    } catch (err: unknown) {
      console.error("Answers fetch error:", err);
    }
  };

  const finishedStudents = students.filter((s) => s.status === "finished");

  const studentPercentages = finishedStudents.map((s) => {
    const correct = s.score || 0;
    return Math.round((correct / totalQuestions) * 100);
  });

  const avgScore =
    studentPercentages.length > 0
      ? Math.round(
          studentPercentages.reduce((sum, score) => sum + score, 0) /
            studentPercentages.length,
        )
      : 0;

  const highestScore =
    studentPercentages.length > 0 ? Math.max(...studentPercentages) : 0;

  const exportToCSV = () => {
    const headers = [
      "Name",
      "Percentage (%)",
      "Correct Answers",
      "Total Questions",
      "Status",
      "Date",
    ];
    const rows = students.map((s) => {
      const correct = s.score || 0;
      const percentage = Math.round((correct / totalQuestions) * 100);

      return [
        s.name,
        `${percentage}%`,
        correct,
        totalQuestions,
        s.status,
        new Date(s.created_at).toLocaleString(),
      ];
    });

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n",
    );

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exam?.title || "exam"}-results.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFE600] flex items-center justify-center font-black text-6xl border-[16px] border-black">
        Loading Results...
      </div>
    );
  }

  // 🟢 STUDENT DETAIL VIEW 🟢
  if (viewingAnswers && selectedStudent) {
    const studentCorrectCount = selectedStudent.score || 0;
    const studentPercentage = Math.round(
      (studentCorrectCount / totalQuestions) * 100,
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
        <main className="flex-grow p-6 md:p-12 max-w-6xl mx-auto w-full">
          <button
            onClick={() => setViewingAnswers(false)}
            className=" text-red-500 mb-8 bg-white border-4 border-black px-6 py-3 font-black uppercase shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            ← Back to Results
          </button>

          <div className="text-black bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-8 mb-8">
            <h1 className="text-5xl font-black uppercase tracking-tighter mb-4">
              {selectedStudent.name}
            </h1>
            <div className="flex flex-wrap gap-4">
              <div className="bg-[#00E57A] border-4 border-black px-6 py-3">
                <div className="text-4xl font-black">{studentPercentage}%</div>
                <div className="text-sm font-black uppercase">Percentage</div>
              </div>
              <div className="bg-[#5A87FF] border-4 border-black px-6 py-3 text-white">
                <div className="text-4xl font-black">
                  {studentCorrectCount} / {totalQuestions}
                </div>
                <div className="text-sm font-black uppercase">
                  Correct Answers
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-black text-3xl font-black uppercase bg-white border-4 border-black inline-block px-4 py-2 shadow-[4px_4px_0px_0px_#000]">
              Question by Question
            </h2>
            {studentAnswers.length === 0 && (
              <div className="bg-white border-4 border-black p-8 text-xl font-bold">
                No answers recorded for this student.
              </div>
            )}
            {studentAnswers.map((answer, idx) => (
              <div
                key={answer.id}
                className={` text-gray-900 border-[6px] border-black p-6 shadow-[8px_8px_0px_0px_#000] ${answer.is_correct ? "bg-[#00E57A]" : "bg-[#FF6B9E]"}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-black text-white px-4 py-2 font-black text-2xl border-2 border-black">
                      {idx + 1}
                    </div>
                    {answer.is_correct ? (
                      <CheckCircle2
                        className="w-8 h-8 text-black"
                        strokeWidth={3}
                      />
                    ) : (
                      <XCircle className="w-8 h-8 text-black" strokeWidth={3} />
                    )}
                  </div>
                  <div className="text-sm font-black uppercase bg-black text-white px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_#fff]">
                    {answer.is_correct ? "Correct" : "Incorrect"}
                  </div>
                </div>

                <h3 className="text-2xl font-black mb-4 uppercase">
                  {answer.question_text}
                </h3>

                <div className="space-y-2 bg-white/50 p-4 border-4 border-black">
                  <div className="flex gap-2">
                    <span className="font-black uppercase text-sm">
                      Student Answer:
                    </span>
                    <span className="font-bold">{answer.selected_answer}</span>
                  </div>
                  {!answer.is_correct && (
                    <div className="flex gap-2">
                      <span className="font-black uppercase text-sm text-black">
                        Correct Answer:
                      </span>
                      <span className="font-bold text-black">
                        {answer.correct_answer}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 🟢 MAIN RESULTS DASHBOARD 🟢
  return (
    <div
      className="min-h-screen flex flex-col font-sans bg-[#FFE600]"
      style={{
        backgroundImage: "radial-gradient(#000 2px, transparent 2px)",
        backgroundSize: "32px 32px",
      }}
    >
      <Navbar />
      <main className="flex-grow p-6 md:p-12 max-w-[1600px] mx-auto w-full">
        <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="bg-black text-white inline-block px-4 py-1 font-black uppercase text-sm mb-4 border-2 border-black shadow-[2px_2px_0px_0px_#25c0f4]">
                Results Dashboard
              </div>
              <h1 className=" text-[#25c0f4] text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">
                {exam?.title || "Exam Results"}
              </h1>
              <p className=" text-black text-2xl font-bold mt-2">
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
              <Download className="w-6 h-6 stroke-[3]" />
              Export CSV
            </button>
          </div>
        </div>

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
                  const correctCount = student.score || 0;
                  const percentage = Math.round(
                    (correctCount / totalQuestions) * 100,
                  );

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

                      {/* 🟢 Percentage Column */}
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

                      {/* 🟢 Correct Answers Column */}
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
                          className={`px-3 py-1 font-black uppercase text-xs border-2 border-black shadow-[2px_2px_0px_0px_#000] ${
                            isFinished
                              ? "bg-[#00E57A] text-black shadow-[2px_2px_0px_0px_#000]"
                              : "bg-white text-black/50 border-black/50 shadow-none"
                          }`}
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
                            <Eye className="w-5 h-5 stroke-[3]" />
                            View Answers
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
