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
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentAnswers, setStudentAnswers] = useState<StudentAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingAnswers, setViewingAnswers] = useState(false);

  // Fetch exam and students
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get exam details
        const { data: examData } = await supabase
          .from("exams")
          .select("*")
          .ilike("code", examCode)
          .single();

        if (examData) setExam(examData);

        // Get all students who took this exam
        const { data: studentData } = await supabase
          .from("students")
          .select("*")
          .ilike("exam_code", examCode)
          .order("created_at", { ascending: false });

        if (studentData) setStudents(studentData);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [examCode]);

  // Fetch individual student's answers
  const viewStudentAnswers = async (student: Student) => {
    setSelectedStudent(student);
    setViewingAnswers(true);

    const { data: answers } = await supabase
      .from("student_answers")
      .select("*")
      .eq("student_id", student.id)
      .order("answered_at", { ascending: true });

    if (answers) setStudentAnswers(answers);
  };

  // Calculate statistics
  const finishedStudents = students.filter((s) => s.status === "finished");
  const avgScore =
    finishedStudents.length > 0
      ? Math.round(
          finishedStudents.reduce((sum, s) => sum + (s.score || 0), 0) /
            finishedStudents.length,
        )
      : 0;
  const highestScore = Math.max(...finishedStudents.map((s) => s.score || 0));

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Name", "Score", "Correct", "Total", "Status", "Date"];
    const rows = students.map((s) => [
      s.name,
      s.score || "N/A",
      s.correct_answers || "N/A",
      s.total_questions || "N/A",
      s.status,
      new Date(s.created_at).toLocaleString(),
    ]);

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
      <div className="min-h-screen bg-[#FFE600] flex items-center justify-center font-black text-6xl">
        Loading Results...
      </div>
    );
  }

  // Student Detail View
  if (viewingAnswers && selectedStudent) {
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
          {/* Back Button */}
          <button
            onClick={() => setViewingAnswers(false)}
            className="mb-8 bg-white border-4 border-black px-6 py-3 font-black uppercase shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            ← Back to Results
          </button>

          {/* Student Header */}
          <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-8 mb-8">
            <h1 className="text-5xl font-black uppercase tracking-tighter mb-4">
              {selectedStudent.name}
            </h1>
            <div className="flex flex-wrap gap-4">
              <div className="bg-[#00E57A] border-4 border-black px-6 py-3">
                <div className="text-4xl font-black">
                  {selectedStudent.score}%
                </div>
                <div className="text-sm font-black uppercase">Final Score</div>
              </div>
              <div className="bg-[#5A87FF] border-4 border-black px-6 py-3 text-white">
                <div className="text-4xl font-black">
                  {selectedStudent.correct_answers} /{" "}
                  {selectedStudent.total_questions}
                </div>
                <div className="text-sm font-black uppercase">Correct</div>
              </div>
            </div>
          </div>

          {/* Individual Answers */}
          <div className="space-y-6">
            <h2 className="text-3xl font-black uppercase">
              Question by Question
            </h2>
            {studentAnswers.map((answer, idx) => (
              <div
                key={answer.id}
                className={`border-[6px] border-black p-6 ${answer.is_correct ? "bg-[#00E57A]" : "bg-[#FF6B9E]"}`}
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
                  <div className="text-sm font-black uppercase bg-black text-white px-3 py-1">
                    {answer.is_correct ? "Correct" : "Incorrect"}
                  </div>
                </div>

                <h3 className="text-2xl font-black mb-4 uppercase">
                  {answer.question_text}
                </h3>

                <div className="space-y-2">
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

  // Main Results Dashboard
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
        {/* Header */}
        <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="bg-black text-white inline-block px-4 py-1 font-black uppercase text-sm mb-4">
                Results Dashboard
              </div>
              <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">
                {exam?.title || "Exam Results"}
              </h1>
              <p className="text-2xl font-bold mt-2">
                CODE:{" "}
                <span className="bg-[#FFE600] px-2 border-2 border-black">
                  {examCode}
                </span>
              </p>
            </div>

            <button
              onClick={exportToCSV}
              className="bg-[#25c0f4] border-4 border-black px-6 py-3 font-black uppercase shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#5A87FF] border-4 border-black shadow-[6px_6px_0px_0px_#000] p-6">
            <Users className="w-10 h-10 text-white mb-2" strokeWidth={3} />
            <div className="text-4xl font-black text-white">
              {students.length}
            </div>
            <div className="text-sm font-black uppercase text-white">
              Total Students
            </div>
          </div>

          <div className="bg-[#00E57A] border-4 border-black shadow-[6px_6px_0px_0px_#000] p-6">
            <CheckCircle2
              className="w-10 h-10 text-black mb-2"
              strokeWidth={3}
            />
            <div className="text-4xl font-black text-black">
              {finishedStudents.length}
            </div>
            <div className="text-sm font-black uppercase">Completed</div>
          </div>

          <div className="bg-[#FF6B9E] border-4 border-black shadow-[6px_6px_0px_0px_#000] p-6">
            <TrendingUp className="w-10 h-10 text-black mb-2" strokeWidth={3} />
            <div className="text-4xl font-black text-black">{avgScore}%</div>
            <div className="text-sm font-black uppercase">Average Score</div>
          </div>

          <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_#000] p-6">
            <Award className="w-10 h-10 text-black mb-2" strokeWidth={3} />
            <div className="text-4xl font-black text-black">
              {highestScore}%
            </div>
            <div className="text-sm font-black uppercase">Highest Score</div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-black text-white">
                  <th className="text-left p-4 font-black uppercase text-sm">
                    Student Name
                  </th>
                  <th className="text-left p-4 font-black uppercase text-sm">
                    Score
                  </th>
                  <th className="text-left p-4 font-black uppercase text-sm">
                    Correct
                  </th>
                  <th className="text-left p-4 font-black uppercase text-sm">
                    Status
                  </th>
                  <th className="text-left p-4 font-black uppercase text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center font-bold">
                      No students have taken this exam yet.
                    </td>
                  </tr>
                )}
                {students.map((student) => {
                  const isFinished = student.status === "finished";
                  const score = student.score || 0;
                  let scoreColor = "bg-[#FF6B9E]"; // Red for low scores
                  if (score >= 80)
                    scoreColor = "bg-[#00E57A]"; // Green
                  else if (score >= 60) scoreColor = "bg-[#FFE600]"; // Yellow

                  return (
                    <tr
                      key={student.id}
                      className="border-b-4 border-black last:border-0"
                    >
                      <td className="p-4 font-bold uppercase">
                        {student.name}
                      </td>
                      <td className="p-4">
                        {isFinished ? (
                          <span
                            className={`${scoreColor} px-4 py-2 border-4 border-black font-black text-2xl inline-block`}
                          >
                            {student.score}%
                          </span>
                        ) : (
                          <span className="text-gray-400 font-bold">—</span>
                        )}
                      </td>
                      <td className="p-4 font-bold">
                        {isFinished
                          ? `${student.correct_answers} / ${student.total_questions}`
                          : "—"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 font-black uppercase text-xs border-2 border-black ${
                            isFinished
                              ? "bg-[#00E57A]"
                              : "bg-gray-200 text-gray-600"
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
                            <Eye className="w-4 h-4" />
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
