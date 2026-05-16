"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../utils/Supabase/client";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { 
  ArrowLeft, 
  BarChart, 
  Users, 
  Target,
  CheckCircle2,
  XCircle,
  Clock,
  Download
} from "lucide-react";

interface Exam {
  id: string;
  title: string;
  code: string;
}

interface StudentStat {
  id: string;
  name: string;
  score: number;
  correct: number;
  incorrect: number;
  pending: number;
}

function AnalyticsHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  
  const [totalStudents, setTotalStudents] = useState(0);
  const [classAverage, setClassAverage] = useState(0);
  const [studentStats, setStudentStats] = useState<StudentStat[]>([]);
  
  const [distribution, setDistribution] = useState([
    { label: "0-20", count: 0, color: "bg-[#FF6B9E]" },
    { label: "21-40", count: 0, color: "bg-[#FF9B71]" },
    { label: "41-60", count: 0, color: "bg-[#FFE600]" },
    { label: "61-80", count: 0, color: "bg-[#25c0f4]" },
    { label: "81-100", count: 0, color: "bg-[#00E57A]" },
  ]);

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
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoadingExams(false);
    }
  };

  const handleSelectExam = async (exam: Exam) => {
    setSelectedExam(exam);
    setLoadingDetails(true);
    try {
      const { data: students } = await supabase
        .from("students")
        .select("id, name, score")
        .eq("exam_code", exam.code)
        .order("score", { ascending: false });
        
      const { data: answers } = await supabase
        .from("student_answers")
        .select("student_id, is_correct, needs_grading")
        .eq("exam_id", exam.id);

      if (students && students.length > 0) {
        setTotalStudents(students.length);
        
        const totalScore = students.reduce((acc, s) => acc + (s.score || 0), 0);
        setClassAverage(Math.round(totalScore / students.length));

        const dist = [0, 0, 0, 0, 0];
        const stats: StudentStat[] = students.map(st => {
          const score = st.score || 0;
          if (score <= 20) dist[0]++;
          else if (score <= 40) dist[1]++;
          else if (score <= 60) dist[2]++;
          else if (score <= 80) dist[3]++;
          else dist[4]++;

          const stAnswers = answers?.filter(a => a.student_id === st.id) || [];
          const correct = stAnswers.filter(a => a.is_correct === true).length;
          const pending = stAnswers.filter(a => a.needs_grading === true).length;
          const incorrect = stAnswers.filter(a => a.needs_grading === false && a.is_correct === false).length;

          return {
            id: st.id,
            name: st.name,
            score,
            correct,
            incorrect,
            pending
          };
        });

        setDistribution(prev => prev.map((item, i) => ({ ...item, count: dist[i] })));
        setStudentStats(stats);
      } else {
        setTotalStudents(0);
        setClassAverage(0);
        setStudentStats([]);
        setDistribution(prev => prev.map(item => ({ ...item, count: 0 })));
      }

    } catch (err: unknown) {
      console.error("Detaylar yüklenirken hata:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const exportToCSV = () => {
    if (studentStats.length === 0) return;
    const headers = ["Student Name", "Score (%)", "Correct Answers", "Incorrect Answers", "Pending Grades"];
    const rows = studentStats.map(s => `"${s.name}",${s.score},${s.correct},${s.incorrect},${s.pending}`);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedExam?.title || 'Zelos_Results'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loadingExams) return <div className="min-h-screen bg-[#FFE600] flex items-center justify-center font-black text-4xl uppercase text-black">Loading Analytics Center...</div>;

  const maxDistCount = Math.max(...distribution.map(d => d.count), 1);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FFE600] selection:bg-black selection:text-white"
         style={{ backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)", backgroundSize: "30px 30px", backgroundAttachment: "fixed" }}>
      <Navbar />
      
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
        
        {/* SOL LİSTE */}
        <div className="w-full md:w-[350px] bg-white border-r-[6px] border-black overflow-y-auto p-6 space-y-5 shadow-[8px_0_0_0_rgba(0,0,0,1)] shrink-0 z-20">
          <button onClick={() => router.push("/teacher")} className="flex items-center gap-2 font-black uppercase text-sm mb-6 bg-black text-white px-4 py-2 border-2 border-black shadow-[4px_4px_0px_0px_#a855f7] hover:translate-x-1 transition-transform">
            <ArrowLeft className="w-5 h-5 stroke-[3]" /> Dashboard
          </button>
          
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-6 pb-2 border-b-4 border-black text-black">Analytics</h2>
          
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

        {/* SAĞ PANEL */}
        <div className="flex-1 p-4 md:p-10 overflow-y-auto">
          {!selectedExam ? (
            <div className="h-full flex flex-col items-center justify-center text-center bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] m-4 p-10 uppercase">
              <BarChart className="w-24 h-24 mb-6 stroke-[2] text-black" />
              <h2 className="text-4xl font-black text-black">Select an exam<br/>to view insights</h2>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-10 pb-20">
              
              <div className="bg-black text-white p-8 border-[6px] border-black shadow-[12px_12px_0px_0px_#a855f7] rotate-1">
                <span className="bg-[#FFE600] text-black px-3 py-1 font-black text-sm uppercase border-2 border-black mb-3 inline-block shadow-[2px_2px_0px_0px_#fff]">
                  CODE: {selectedExam.code}
                </span>
                <h1 className="text-5xl font-black uppercase tracking-tighter mb-2">{selectedExam.title}</h1>
              </div>

              <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] overflow-hidden">
                <div className="bg-[#a855f7] border-b-[6px] border-black p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <BarChart className="w-10 h-10 stroke-[3] text-white" />
                    <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">Analytics Overview</h2>
                  </div>
                  <button 
                    onClick={exportToCSV}
                    disabled={studentStats.length === 0}
                    className="flex items-center gap-2 bg-[#FFE600] text-black font-black uppercase border-4 border-black px-4 py-2 shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all active:bg-black active:text-white disabled:opacity-50"
                  >
                    <Download className="w-5 h-5 stroke-[3]" /> Export to Excel
                  </button>
                </div>
                
                <div className="p-6 md:p-10">
                  {loadingDetails ? (
                    <p className="font-black text-xl text-black uppercase p-4 animate-pulse">Calculating Stats...</p>
                  ) : (
                    <div className="space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border-[4px] border-black p-6 flex items-center gap-4 bg-[#f5f8f8] shadow-[6px_6px_0px_0px_#000]">
                          <Users className="w-12 h-12 stroke-[2] text-black" />
                          <div>
                            <p className="font-black uppercase text-black/50 tracking-widest text-sm">Total Students</p>
                            <p className="text-4xl font-black text-black">{totalStudents}</p>
                          </div>
                        </div>
                        <div className="border-[4px] border-black p-6 flex items-center gap-4 shadow-[6px_6px_0px_0px_#000] bg-[#FFE600]">
                          <Target className="w-12 h-12 stroke-[2] text-black" />
                          <div>
                            <p className="font-black uppercase text-black/60 tracking-widest text-sm">Class Average</p>
                            <p className="text-4xl font-black text-black">{classAverage}%</p>
                          </div>
                        </div>
                      </div>

                      {/* 🟢 YATAY BAR CHART (RETRO PROGRESS TRACK) */}
                      {totalStudents > 0 && (
                        <div className="border-[6px] border-black p-6 md:p-8 bg-white shadow-[8px_8px_0px_0px_#000]">
                            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-2 text-black flex items-center gap-3">
                            <BarChart className="w-8 h-8" /> Score Distribution
                            </h3>
                            <p className="text-sm font-bold text-black/50 uppercase tracking-widest mb-8 border-b-4 border-black pb-4">Number of students per grade range</p>

                            <div className="space-y-4">
                            {distribution.map((item, idx) => {
                                const widthPercent = maxDistCount > 0 ? (item.count / maxDistCount) * 100 : 0;
                                
                                return (
                                <div key={idx} className="flex items-center gap-4 group">
                                    {/* Kategori Kutusu */}
                                    <div className="w-24 md:w-32 bg-black text-white font-black text-sm md:text-lg uppercase py-3 text-center border-[4px] border-black shadow-[4px_4px_0px_0px_#000] shrink-0">
                                    {item.label}
                                    </div>
                                    
                                    {/* Bar Alanı */}
                                    <div className="flex-1 bg-[#f5f8f8] border-[4px] border-black h-14 md:h-16 relative flex items-center shadow-[4px_4px_0px_0px_#000] overflow-hidden">
                                    {/* Dolu Kısım */}
                                    <div 
                                        className={`h-full ${item.color} border-r-[4px] border-black transition-all duration-1000 ease-out`}
                                        style={{ width: `${widthPercent}%` }}
                                    ></div>
                                    
                                    {/* Sayı */}
                                    <span className={`absolute right-4 font-black text-2xl md:text-3xl ${widthPercent > 80 ? 'text-black' : 'text-black'}`}>
                                        {item.count} <span className="text-sm opacity-50">St.</span>
                                    </span>
                                    </div>
                                </div>
                                );
                            })}
                            </div>
                        </div>
                      )}

                      {/* ÖĞRENCİ TABLOSU */}
                      {studentStats.length > 0 ? (
                        <div className="border-[4px] border-black shadow-[8px_8px_0px_0px_#000] bg-white overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                              <tr className="bg-black text-white uppercase tracking-widest text-sm font-black">
                                <th className="p-4 border-r-[4px] border-black border-b-[4px]">Student Name</th>
                                <th className="p-4 border-r-[4px] border-black border-b-[4px]">Score</th>
                                <th className="p-4 border-r-[4px] border-black border-b-[4px] text-center"><CheckCircle2 className="inline w-5 h-5 mr-1" /> Correct</th>
                                <th className="p-4 border-r-[4px] border-black border-b-[4px] text-center"><XCircle className="inline w-5 h-5 mr-1" /> Incorrect</th>
                                <th className="p-4 border-b-[4px] border-black text-center"><Clock className="inline w-5 h-5 mr-1" /> Pending</th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentStats.map((stat) => (
                                <tr key={stat.id} className="border-b-[4px] border-black last:border-0 hover:bg-[#FFE600]/20 transition-colors">
                                  {/* 🟢 Belirgin Siyah İsim */}
                                  <td className="p-4 font-black uppercase text-lg border-r-[4px] border-black text-black">
                                    {stat.name}
                                  </td>
                                  <td className="p-4 font-black text-xl border-r-[4px] border-black">
                                    <span className={stat.score >= 50 ? "text-[#00E57A]" : "text-[#FF6B9E]"}>
                                      {stat.score}%
                                    </span>
                                  </td>
                                  <td className="p-4 border-r-[4px] border-black text-center">
                                    <span className="bg-[#00E57A] text-black px-3 py-1 border-2 border-black font-black shadow-[2px_2px_0px_0px_#000]">
                                      {stat.correct}
                                    </span>
                                  </td>
                                  <td className="p-4 border-r-[4px] border-black text-center">
                                    <span className="bg-[#FF6B9E] text-black px-3 py-1 border-2 border-black font-black shadow-[2px_2px_0px_0px_#000]">
                                      {stat.incorrect}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center">
                                    {stat.pending > 0 ? (
                                      <span className="bg-[#FFE600] text-black px-3 py-1 border-2 border-black font-black shadow-[2px_2px_0px_0px_#000]">
                                        {stat.pending}
                                      </span>
                                    ) : (
                                      <span className="text-black/30 font-black">-</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                         <div className="border-[4px] border-black p-10 text-center uppercase font-black text-black/50 border-dashed">
                           No students have submitted this exam yet.
                         </div>
                      )}
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

export default function AnalyticsHubPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFE600] flex items-center justify-center font-black text-4xl text-black uppercase">Loading...</div>}>
      <AnalyticsHubContent />
    </Suspense>
  );
}