"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../utils/Supabase/client";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { 
  ArrowLeft, 
  BookOpen, 
  Users, 
  Clock,
  PenLine,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

interface Exam {
  id: string;
  title: string;
  code: string;
}

function GradeHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  
  const [totalStudents, setTotalStudents] = useState(0);
  const [pendingGrades, setPendingGrades] = useState(0);

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
    setLoadingDetails(true);
    try {
      // Sınava katılan toplam öğrenci sayısını bul
      const { count: studentCount } = await supabase
        .from("students")
        .select("*", { count: 'exact', head: true })
        .eq("exam_code", exam.code);
        
      setTotalStudents(studentCount || 0);

      // Okunmayı bekleyen (needs_grading = true) toplam soru sayısını bul
      const { count: pendingCount } = await supabase
        .from("student_answers")
        .select("*", { count: 'exact', head: true })
        .eq("exam_id", exam.id)
        .eq("needs_grading", true);

      setPendingGrades(pendingCount || 0);
    } catch (err) {
      console.error("Detaylar yüklenirken hata:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  if (loadingExams) return <div className="min-h-screen bg-[#FFE600] flex items-center justify-center font-black text-4xl uppercase text-black">Loading Grading Center...</div>;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FFE600] selection:bg-black selection:text-white"
         style={{ backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)", backgroundSize: "30px 30px", backgroundAttachment: "fixed" }}>
      <Navbar />
      
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
        
        {/* SOL LİSTE: SINAVLAR */}
        <div className="w-full md:w-[350px] bg-white border-r-[6px] border-black overflow-y-auto p-6 space-y-5 shadow-[8px_0_0_0_rgba(0,0,0,1)] shrink-0 z-20">
          <button onClick={() => router.push("/teacher")} className="flex items-center gap-2 font-black uppercase text-sm mb-6 bg-black text-white px-4 py-2 border-2 border-black shadow-[4px_4px_0px_0px_#25c0f4] hover:translate-x-1 transition-transform">
            <ArrowLeft className="w-5 h-5 stroke-[3]" /> Dashboard
          </button>
          
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-6 pb-2 border-b-4 border-black text-black">Grade</h2>
          
          <div className="space-y-4">
            {exams.map(exam => {
              const isSelected = selectedExam?.id === exam.id;
              return (
                <button 
                  key={exam.id} 
                  onClick={() => handleSelectExam(exam)}
                  className={`w-full p-5 border-[4px] border-black text-left flex flex-col transition-all shadow-[6px_6px_0px_0px_#000] active:shadow-none active:translate-x-1 active:translate-y-1 ${
                    isSelected 
                      ? 'bg-black text-white translate-x-1 translate-y-1 !shadow-none border-l-[12px] border-l-[#5A87FF]' 
                      : 'bg-white text-black hover:bg-[#FFE600]'
                  }`}
                >
                  <p className={`font-black uppercase text-xl truncate w-full mb-3 ${isSelected ? 'text-white' : 'text-black'}`}>
                    {exam.title || "Untitled Exam"}
                  </p>
                  <div className="flex justify-between items-center w-full">
                    <span className={`px-3 py-1 text-xs font-black uppercase tracking-widest border-2 border-black ${isSelected ? 'bg-[#5A87FF] text-white' : 'bg-[#f5f8f8] text-black shadow-[2px_2px_0px_0px_#000]'}`}>
                      CODE: {exam.code}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* SAĞ PANEL: SINAV DETAYLARI VE BAŞLAMA BUTONU */}
        <div className="flex-1 p-4 md:p-10 overflow-y-auto">
          {!selectedExam ? (
            <div className="h-full flex flex-col items-center justify-center text-center bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] m-4 p-10 uppercase">
              <PenLine className="w-24 h-24 mb-6 stroke-[2] text-black" />
              <h2 className="text-4xl font-black text-black">Select an exam to grade</h2>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-10 pb-20">
              
              <div className="bg-black text-white p-8 border-[6px] border-black shadow-[12px_12px_0px_0px_#5A87FF] rotate-1">
                <span className="bg-[#FFE600] text-black px-3 py-1 font-black text-sm uppercase border-2 border-black mb-3 inline-block shadow-[2px_2px_0px_0px_#fff]">
                  CODE: {selectedExam.code}
                </span>
                <h1 className="text-5xl font-black uppercase tracking-tighter mb-2">{selectedExam.title}</h1>
              </div>

              <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] overflow-hidden">
                <div className="bg-[#5A87FF] border-b-[6px] border-black p-6 flex items-center gap-4">
                  <PenLine className="w-10 h-10 stroke-[3] text-white" />
                  <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">Grading Overview</h2>
                </div>
                
                <div className="p-6 md:p-10">
                  {loadingDetails ? (
                    <p className="font-black text-xl text-black uppercase p-4">Analyzing Submissions...</p>
                  ) : (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border-[4px] border-black p-6 flex items-center gap-4 bg-[#f5f8f8] shadow-[6px_6px_0px_0px_#000]">
                          <Users className="w-12 h-12 stroke-[2] text-black" />
                          <div>
                            <p className="font-black uppercase text-black/50 tracking-widest text-sm">Total Students</p>
                            <p className="text-4xl font-black text-black">{totalStudents}</p>
                          </div>
                        </div>

                        <div className={`border-[4px] border-black p-6 flex items-center gap-4 shadow-[6px_6px_0px_0px_#000] ${pendingGrades > 0 ? 'bg-[#FF6B9E]' : 'bg-[#00E57A]'}`}>
                          {pendingGrades > 0 ? <Clock className="w-12 h-12 stroke-[2] text-black" /> : <CheckCircle2 className="w-12 h-12 stroke-[2] text-black" />}
                          <div>
                            <p className="font-black uppercase text-black/60 tracking-widest text-sm">Needs Grading</p>
                            <p className="text-4xl font-black text-black">{pendingGrades} <span className="text-xl">Answers</span></p>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => router.push(`/teacher/grade/${selectedExam.code}`)}
                        className="w-full bg-[#00E57A] text-black px-6 py-6 border-[6px] border-black font-black uppercase text-3xl flex items-center justify-between hover:bg-black hover:text-[#00E57A] transition-colors shadow-[8px_8px_0px_0px_#000] active:translate-x-2 active:translate-y-2 active:shadow-none group"
                      >
                        Start Grading
                        <ArrowRight className="w-10 h-10 stroke-[3] group-hover:translate-x-2 transition-transform" />
                      </button>
                    </div>
                  )}
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

export default function GradeHubPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFE600] flex items-center justify-center font-black text-4xl text-black uppercase">Loading...</div>}>
      <GradeHubContent />
    </Suspense>
  );
}