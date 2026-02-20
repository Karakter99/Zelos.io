"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../utils/Supabase/client";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import {
  Trash2,
  Download,
  Copy,
  Edit3,
  Save,
  X,
  Clock,
  AlertTriangle,
  Plus, // 🟢 Added Plus icon import
} from "lucide-react";
import * as XLSX from "xlsx";

const cardColors = ["bg-[#FF6B9E]", "bg-[#5A87FF]", "bg-[#FFE600]", "bg-white"];

type Exam = {
  id: string;
  code: string;
  title: string | null;
  time_limit: number | null;
  is_active: boolean;
  created_at: string;
  teacher_id: string;
  created_by_email: string;
};

export default function ExamsManagerPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTime, setEditTime] = useState<number | "">("");

  useEffect(() => {
    fetchExams();
  }, [router]);

  const fetchExams = async () => {
    setLoading(true);
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

      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setExams(data);
    } catch (err: unknown) {
      console.error("Error fetching exams:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString)
      .toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
      .toUpperCase();
  };

  // 🗑️ DELETE EXAM
  const handleDelete = async (examId: string) => {
    if (
      !window.confirm(
        "⚠️ WARNING: Delete this exam and all its student results forever?",
      )
    )
      return;
    try {
      const { error } = await supabase.from("exams").delete().eq("id", examId);
      if (error) throw error;
      setExams((prev) => prev.filter((exam) => exam.id !== examId));
    } catch (err) {
      console.error("Delete Error:", err);
      alert("Failed to delete the exam.");
    }
  };

  // 📋 DUPLICATE EXAM
  const handleDuplicate = async (exam: Exam) => {
    if (!window.confirm(`Duplicate "${exam.title}"?`)) return;
    try {
      // 1. Generate new code
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // 2. Clone the Exam record
      const { data: newExam, error: examError } = await supabase
        .from("exams")
        .insert({
          title: `${exam.title} (COPY)`,
          code: newCode,
          time_limit: exam.time_limit,
          is_active: false, // Draft by default so students can't join yet
          teacher_id: exam.teacher_id,
          created_by_email: exam.created_by_email,
        })
        .select()
        .single();

      if (examError || !newExam) throw examError;

      // 3. Fetch old questions
      const { data: oldQuestions, error: qFetchError } = await supabase
        .from("questions")
        .select("*")
        .eq("exam_id", exam.id);

      if (qFetchError) throw qFetchError;

      // 4. Clone the Questions
      if (oldQuestions && oldQuestions.length > 0) {
        const newQuestionsPayload = oldQuestions.map((q) => ({
          exam_id: newExam.id,
          text: q.text,
          type: q.type,
          options: q.options,
          answer: q.answer,
        }));

        const { error: qInsertError } = await supabase
          .from("questions")
          .insert(newQuestionsPayload);
        if (qInsertError) throw qInsertError;
      }

      alert("✅ Exam duplicated successfully!");
      fetchExams(); // Refresh list
    } catch (err) {
      console.error("Duplicate Error:", err);
      alert("Failed to duplicate exam.");
    }
  };

  // ✏️ OPEN EDIT MODAL
  const openEditModal = (exam: Exam) => {
    setEditingExam(exam);
    setEditTitle(exam.title || "");
    setEditTime(exam.time_limit || "");
  };

  // 💾 SAVE EDIT MODAL
  const saveEdit = async () => {
    if (!editingExam) return;
    try {
      const { error } = await supabase
        .from("exams")
        .update({
          title: editTitle,
          time_limit: editTime === "" ? null : editTime,
        })
        .eq("id", editingExam.id);

      if (error) throw error;

      setEditingExam(null);
      fetchExams(); // Refresh list
    } catch (err) {
      console.error("Edit Error:", err);
      alert("Failed to update exam details.");
    }
  };

  // 📥 DOWNLOAD EXCEL
  const handleDownloadResults = async (
    examCode: string,
    examTitle: string | null,
  ) => {
    try {
      const { data: students, error: studentErr } = await supabase
        .from("students")
        .select("*")
        .ilike("exam_code", `%${examCode}%`);
      if (studentErr) throw studentErr;
      if (!students || students.length === 0)
        return alert("No students have taken this exam yet!");

      const { data: examData } = await supabase
        .from("exams")
        .select("id")
        .eq("code", examCode)
        .single();
      let totalQuestions = 1;
      if (examData) {
        const { count } = await supabase
          .from("questions")
          .select("*", { count: "exact", head: true })
          .eq("exam_id", examData.id);
        if (count) totalQuestions = count;
      }

      const excelData = students.map((s) => ({
        "Student Name": s.name,
        Status: s.status === "finished" ? "Completed" : "Incomplete",
        "Correct Answers": s.score || 0,
        Mistakes: totalQuestions - (s.score || 0),
        "Final Score (%)": `${Math.round(((s.score || 0) / totalQuestions) * 100) || 0}%`,
        "Caught Cheating?": s.detention_end_time ? "YES 🚨" : "No",
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Grades");
      XLSX.writeFile(
        workbook,
        `${examTitle ? examTitle.replace(/[^a-z0-9]/gi, "_") : "Exam"}_Results.xlsx`,
      );
    } catch (err) {
      console.error("Download Error:", err);
      alert("Failed to generate Excel file.");
    }
  };

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

      <main className="flex-grow flex flex-col md:flex-row p-6 md:p-12 gap-8 md:gap-12 relative z-10 max-w-[1600px] mx-auto w-full">
        <div className="absolute top-0 bottom-0 left-[340px] w-2 bg-black hidden md:block z-0 -ml-4" />
        <div className="absolute top-[200px] left-[340px] right-0 h-2 bg-black hidden md:block z-0" />

        {/* 1. LEFT SIDEBAR */}
        <nav className="w-full md:w-72 bg-[#00E57A] border-[6px] border-black shadow-[16px_16px_0px_0px_#000] p-8 md:p-10 flex flex-col gap-8 h-fit z-10 shrink-0">
          <Link
            href="/teacher"
            className="text-3xl font-black text-black uppercase hover:translate-x-2 transition-transform opacity-50 hover:opacity-100"
          >
            Dashboard
          </Link>
          <Link
            href="/teacher/new"
            className="text-3xl font-black text-black uppercase hover:translate-x-2 transition-transform"
          >
            Exam
          </Link>
          <Link
            href="#"
            className="text-3xl font-black text-black uppercase hover:translate-x-2 transition-transform opacity-50 pointer-events-none"
          >
            Students
          </Link>
          <Link
            href="/teacher/settings"
            className="text-3xl font-black text-black uppercase hover:translate-x-2 transition-transform opacity-50 hover:opacity-100"
          >
            Settings
          </Link>
        </nav>

        {/* 2. RIGHT CONTENT AREA */}
        <div className="flex-1 flex flex-col gap-10 z-10 w-full animate-in slide-in-from-bottom-8 duration-500">
          {/* 🟢 TITLE - Now on one line */}
          <div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none text-black bg-white inline-block border-[6px] border-black p-4 md:p-6 shadow-[12px_12px_0px_0px_#000]">
              Exam Manager
            </h1>
          </div>

          {/* 🟢 BIG CREATE BUTTON */}
          <Link
            href="/teacher/create"
            className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-6 md:p-8 text-center hover:translate-x-2 hover:translate-y-2 hover:shadow-[4px_4px_0px_0px_#000] active:translate-x-4 active:translate-y-4 active:shadow-none transition-all group flex flex-col md:flex-row items-center justify-center gap-4"
          >
            <Plus className="w-12 h-12 stroke-[4] text-black group-hover:rotate-90 transition-transform duration-300" />
            <h1 className="text-3xl md:text-5xl font-black text-black uppercase tracking-tighter">
              Create New Exam
            </h1>
          </Link>

          {/* Exam Cards Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pt-4">
            {loading && (
              <p className="text-2xl font-black uppercase p-8 bg-white border-4 border-black w-fit">
                Loading Exams...
              </p>
            )}

            {!loading && exams.length === 0 && (
              <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-10 col-span-full">
                <h2 className="text-4xl font-black uppercase">No Exams Yet</h2>
                <p className="text-xl font-bold mt-2">
                  Click the button above to create your first exam.
                </p>
              </div>
            )}

            {exams.map((exam, index) => {
              const colorClass = cardColors[index % cardColors.length];
              return (
                <div
                  key={exam.id}
                  className={`${colorClass} border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-6 md:p-8 flex flex-col justify-between hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_#000] transition-all`}
                >
                  <div className="flex justify-between items-start gap-4 mb-6">
                    <div className="flex-1">
                      <h2 className="text-3xl md:text-4xl font-black text-black uppercase leading-tight tracking-tighter break-words mb-2">
                        {exam.title || "Untitled Exam"}
                      </h2>
                      <div className="flex items-center gap-3 font-bold uppercase text-black/80">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />{" "}
                          {exam.time_limit
                            ? `${exam.time_limit} MINS`
                            : "NO LIMIT"}
                        </span>
                        <span>•</span>
                        <span>CODE: {exam.code}</span>
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="grid grid-cols-2 gap-2 shrink-0">
                      <button
                        onClick={() => openEditModal(exam)}
                        className="bg-white text-black border-[3px] border-black p-2 shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                        title="Edit Settings"
                      >
                        <Edit3 className="w-6 h-6 stroke-[3]" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(exam)}
                        className="bg-white text-black border-[3px] border-black p-2 shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                        title="Duplicate Exam"
                      >
                        <Copy className="w-6 h-6 stroke-[3]" />
                      </button>
                      <button
                        onClick={() =>
                          handleDownloadResults(exam.code, exam.title)
                        }
                        className="bg-white text-black border-[3px] border-black p-2 shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none hover:bg-[#a855f7] hover:text-white transition-all"
                        title="Download Results"
                      >
                        <Download className="w-6 h-6 stroke-[3]" />
                      </button>
                      <button
                        onClick={() => handleDelete(exam.id)}
                        className="bg-white text-black border-[3px] border-black p-2 shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none hover:bg-black hover:text-[#FF6B9E] transition-all"
                        title="Delete Exam"
                      >
                        <Trash2 className="w-6 h-6 stroke-[3]" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t-[4px] border-black/20 pt-4 mt-auto">
                    <span className="font-black uppercase tracking-widest text-sm">
                      {formatDate(exam.created_at)}
                    </span>
                    <Link
                      href={`/teacher/monitor/${exam.code}`}
                      className="bg-black text-white px-6 py-2 font-black uppercase tracking-widest hover:bg-[#00E57A] hover:text-black border-[3px] border-black transition-colors"
                    >
                      Open Monitor
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* 🟢 EDIT MODAL OVERLAY */}
      {editingExam && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="bg-white border-[6px] border-black shadow-[16px_16px_0px_0px_#25c0f4] max-w-lg w-full p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black uppercase text-black">
                Edit Exam
              </h2>
              <button
                onClick={() => setEditingExam(null)}
                className="hover:text-[#FF6B9E] transition-colors"
              >
                <X className="w-8 h-8 stroke-[3] text-black" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-black uppercase tracking-widest">
                  Exam Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full border-[4px] border-black p-4 text-xl font-bold uppercase focus:outline-none focus:shadow-[6px_6px_0px_0px_#000] transition-shadow"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Time Limit (Minutes)
                </label>
                <input
                  type="number"
                  value={editTime}
                  onChange={(e) =>
                    setEditTime(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="w-full border-[4px] border-black p-4 text-xl font-bold uppercase focus:outline-none focus:shadow-[6px_6px_0px_0px_#000] transition-shadow"
                  placeholder="Leave empty for no limit"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t-[4px] border-black">
                <button
                  onClick={() => setEditingExam(null)}
                  className="flex-1 bg-gray-200 border-[4px] border-black py-4 font-black uppercase text-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="flex-1 bg-[#00E57A] border-[4px] border-black py-4 font-black uppercase text-lg flex items-center justify-center gap-2 hover:bg-black hover:text-[#00E57A] transition-colors"
                >
                  <Save className="w-5 h-5 stroke-[3]" /> Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
