"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../utils/Supabase/client";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { 
  ArrowLeft, 
  BookOpen, 
  Download, 
  Users, 
  CheckCircle2, 
  Clock,
  Eye,
  Check,
  X
} from "lucide-react";
import * as XLSX from "xlsx";

interface Exam {
  id: string;
  title: string;
  code: string;
  created_at: string;
}

interface Student {
  id: string;
  name: string;
  status: string;
  score: number | null;
  detention_end_time: string | null;
  correct_count?: number;
  wrong_count?: number;
  total_graded?: number;
}

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [examQuestionCount, setExamQuestionCount] = useState(0);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoadingExams(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/teacher/login");

      const { data: examsData } = await supabase
        .from("exams")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });
      
      setExams(examsData || []);

      const codeParam = searchParams?.get("code");
      if (codeParam && examsData) {
        const targetExam = examsData.find(e => e.code === codeParam);
        if (targetExam) handleSelectExam(targetExam);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingExams(false);
    }
  };

  const handleSelectExam = async (exam: Exam) => {
    setSelectedExam(exam);
    setLoadingStudents(true);
    try {
      const { count } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("exam_id", exam.id);
      
      setExamQuestionCount(count || 0);

      const { data: studentData } = await supabase
        .from("students")
        .select("*")
        .eq("exam_code", exam.code)
        .order("score", { ascending: false });

      if (!studentData) return setStudents([]);

      const studentsWithStats = await Promise.all(studentData.map(async (student) => {
        const { data: answers } = await supabase
          .from("student_answers")
          .select("is_correct, manual_score")
          .eq("student_id", student.id);

        const correct = answers?.filter(a => a.is_correct === true).length || 0;
        const wrong = answers?.filter(a => a.is_correct === false).length || 0;

        return {
          ...student,
          correct_count: correct,
          wrong_count: wrong,
          total_graded: answers?.length || 0
        };
      }));
        
      setStudents(studentsWithStats);
    } catch (err) {
      console.error("Data error:", err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const exportToExcel = () => {
    if (students.length === 0) return alert("No results to export!");
    const data = students.map((s) => ({
      "Student Name": s.name,
      "Status": s.status === "finished" ? "Completed" : "In Progress",
      "Correct": s.correct_count,
      "Wrong": s.wrong_count,
      "Score (%)": `${s.score || 0}%`,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
    XLSX.writeFile(workbook, `${selectedExam?.title}_Results.xlsx`);
  };

  if (loadingExams) return <div className="min-h-screen bg-[#FFE600] flex items-center justify-center font-black text-4xl uppercase text-black">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FFE600] selection:bg-black selection:text-white"
         style={{ backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)", backgroundSize: "30px 30px", backgroundAttachment: "fixed" }}>
      <Navbar />
      
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
        
        {/* 🟢 SOL LİSTE: YÜKSEK KONTRASTLI SINAVLAR */}
        <div className="w-full md:w-[350px] bg-white border-r-[6px] border-black overflow-y-auto p-6 space-y-5 shadow-[8px_0_0_0_rgba(0,0,0,1)] shrink-0 z-20">
          <button onClick={() => router.push("/teacher")} className="flex items-center gap-2 font-black uppercase text-sm mb-6 bg-black text-white px-4 py-2 border-2 border-black shadow-[4px_4px_0px_0px_#25c0f4] hover:translate-x-1 transition-transform">
            <ArrowLeft className="w-5 h-5 stroke-[3]" /> Dashboard
          </button>
          
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-6 pb-2 border-b-4 border-black text-black">Results</h2>
          
          <div className="space-y-4">
            {exams.map(exam => {
              const isSelected = selectedExam?.id === exam.id;
              return (
                <button 
                  key={exam.id} 
                  onClick={() => handleSelectExam(exam)}
                  className={`w-full p-5 border-[4px] border-black text-left flex flex-col transition-all shadow-[6px_6px_0px_0px_#000] active:shadow-none active:translate-x-1 active:translate-y-1 ${
                    isSelected 
                      ? 'bg-black text-white translate-x-1 translate-y-1 !shadow-none border-l-[12px] border-l-[#a855f7]' 
                      : 'bg-white text-black hover:bg-[#FFE600]'
                  }`}
                >
                  <p className={`font-black uppercase text-xl truncate w-full mb-3 ${isSelected ? 'text-white' : 'text-black'}`}>
                    {exam.title || "Untitled Exam"}
                  </p>
                  <div className="flex justify-between items-center w-full">
                    <span className={`px-3 py-1 text-xs font-black uppercase tracking-widest border-2 border-black ${isSelected ? 'bg-[#a855f7] text-white' : 'bg-[#f5f8f8] text-black shadow-[2px_2px_0px_0px_#000]'}`}>
                      CODE: {exam.code}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 🟢 SAĞ PANEL: DETAYLI SONUÇLAR */}
        <div className="flex-1 p-4 md:p-10 overflow-y-auto">
          {!selectedExam ? (
            <div className="h-full flex flex-col items-center justify-center text-center bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] m-4 p-10 uppercase">
              <BookOpen className="w-24 h-24 mb-6 stroke-[2] text-black" />
              <h2 className="text-4xl font-black text-black">Select an exam</h2>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-10 pb-20">
              
              <div className="bg-black text-white p-8 border-[6px] border-black shadow-[12px_12px_0px_0px_#a855f7] rotate-1">
                <span className="bg-[#FFE600] text-black px-3 py-1 font-black text-sm uppercase border-2 border-black mb-3 inline-block shadow-[2px_2px_0px_0px_#fff]">
                  CODE: {selectedExam.code}
                </span>
                <h1 className="text-5xl font-black uppercase tracking-tighter mb-2">{selectedExam.title}</h1>
                <p className="font-bold text-[#a855f7] uppercase tracking-widest text-sm">{examQuestionCount} Questions Total</p>
              </div>

              <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] overflow-hidden">
                <div className="bg-[#a855f7] border-b-[6px] border-black p-6 flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-3xl font-black text-white uppercase flex items-center gap-3"><Users className="w-10 h-10" /> Stats</h2>
                  <button onClick={exportToExcel} className="bg-[#FFE600] text-black px-6 py-3 border-4 border-black font-black uppercase shadow-[4px_4px_0px_0px_#000] active:shadow-none active:translate-x-1 active:translate-y-1 hover:bg-[#00E57A] transition-colors">
                    <Download className="w-5 h-5 inline mr-2" /> Export
                  </button>
                </div>

                <div className="p-6 md:p-8">
                  <div className="overflow-x-auto border-4 border-black shadow-[6px_6px_0px_0px_#000]">
                    <table className="w-full text-left border-collapse bg-white">
                      <thead>
                        <tr className="bg-black text-white uppercase text-sm font-black">
                          <th className="p-4 border-r-4 border-black">Student Name</th>
                          <th className="p-4 border-r-4 border-black text-center">Correct</th>
                          <th className="p-4 border-r-4 border-black text-center">Wrong</th>
                          <th className="p-4 border-r-4 border-black text-center">Final Score</th>
                          <th className="p-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-black font-bold uppercase text-sm">
                        {students.map((s) => (
                          <tr key={s.id} className="border-b-4 border-black hover:bg-[#FFE600]/20 transition-colors">
                            <td className="p-4 border-r-4 border-black font-black text-lg">
                              {s.name}
                              {s.detention_end_time && <span className="block text-[10px] bg-red-500 text-white px-2 py-0.5 mt-1 border-2 border-black w-fit animate-pulse">FLAGGED</span>}
                            </td>
                            <td className="p-4 border-r-4 border-black text-center">
                              <span className="bg-[#00E57A] px-3 py-1 border-2 border-black font-black text-black inline-flex items-center gap-1 shadow-[2px_2px_0px_0px_#000]">
                                <Check className="w-4 h-4" /> {s.correct_count}
                              </span>
                            </td>
                            <td className="p-4 border-r-4 border-black text-center">
                              <span className="bg-[#FF6B9E] px-3 py-1 border-2 border-black font-black text-black inline-flex items-center gap-1 shadow-[2px_2px_0px_0px_#000]">
                                <X className="w-4 h-4" /> {s.wrong_count}
                              </span>
                            </td>
                            <td className="p-4 border-r-4 border-black text-center">
                              <span className="bg-black text-white px-3 py-1 text-xl font-black border-2 border-black shadow-[2px_2px_0px_0px_#a855f7]">
                                {s.score || 0}%
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              {/* 🟢 VIEW ANSWERS BUTONU (ARTIK DİREKT DETAYA GİDER) */}
                              <button 
                                onClick={() => router.push(`/teacher/results/${selectedExam.code}?studentId=${s.id}`)}
                                className="bg-[#25c0f4] text-black px-4 py-2 border-2 border-black font-black uppercase text-xs shadow-[4px_4px_0px_0px_#000] active:translate-x-1 active:translate-y-1 hover:bg-black hover:text-white transition-all mx-auto flex items-center justify-center gap-2"
                              >
                                <Eye className="w-4 h-4 inline" /> View Answers
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ResultsHubPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFE600] flex items-center justify-center font-black text-4xl text-black uppercase">Loading Stats...</div>}>
      <ResultsContent />
    </Suspense>
  );
}