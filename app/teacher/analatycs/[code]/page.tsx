"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/utils/Supabase/client"; // Yolunu kendi projene göre ayarla
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { 
  ArrowLeft, BarChart, Users, Target, TrendingUp, AlertOctagon 
} from "lucide-react";

export default function AnalyticsPage() {
  const params = useParams();
  const code = params?.code as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [examName, setExamName] = useState("");
  
  // Analitik Stateleri
  const [totalStudents, setTotalStudents] = useState(0);
  const [classAverage, setClassAverage] = useState(0);
  const [passRate, setPassRate] = useState(0);
  const [distribution, setDistribution] = useState([
    { label: "0-20", count: 0, color: "bg-[#FF6B9E]" },
    { label: "21-40", count: 0, color: "bg-[#FF9B71]" },
    { label: "41-60", count: 0, color: "bg-[#FFE600]" },
    { label: "61-80", count: 0, color: "bg-[#25c0f4]" },
    { label: "81-100", count: 0, color: "bg-[#00E57A]" },
  ]);
  const [hardestQuestion, setHardestQuestion] = useState<{text: string, successRate: number} | null>(null);

  useEffect(() => {
    if (code) fetchAnalytics();
  }, [code]);

  const fetchAnalytics = async () => {
    try {
      // 1. Sınav Bilgisini Al
      const { data: exam } = await supabase.from("exams").select("id, name").eq("code", code).single();
      if (!exam) return;
      setExamName(exam.name);

      // 2. Öğrenci Skorlarını Al
      const { data: students } = await supabase.from("students").select("score").eq("exam_code", code);
      
      if (students && students.length > 0) {
        setTotalStudents(students.length);
        
        // Ortalama
        const totalScore = students.reduce((acc, s) => acc + (s.score || 0), 0);
        setClassAverage(Math.round(totalScore / students.length));

        // Başarı Oranı (Geçme notu 50 kabul edildi)
        const passed = students.filter(s => (s.score || 0) >= 50).length;
        setPassRate(Math.round((passed / students.length) * 100));

        // Dağılım Hesaplama
        const dist = [0, 0, 0, 0, 0];
        students.forEach(s => {
          const score = s.score || 0;
          if (score <= 20) dist[0]++;
          else if (score <= 40) dist[1]++;
          else if (score <= 60) dist[2]++;
          else if (score <= 80) dist[3]++;
          else dist[4]++;
        });

        setDistribution(prev => prev.map((item, i) => ({ ...item, count: dist[i] })));
      }

      // 3. En Zor Soruyu Bul (Zeka Kısmı)
      const { data: answers } = await supabase.from("student_answers").select("question_text, is_correct, needs_grading").eq("exam_id", exam.id);
      
      if (answers && answers.length > 0) {
        // Sadece okunmuş (needs_grading: false) soruları hesaba kat
        const gradedAnswers = answers.filter(a => !a.needs_grading);
        
        const questionStats: Record<string, { total: number, correct: number }> = {};
        
        gradedAnswers.forEach(ans => {
          if (!questionStats[ans.question_text]) {
            questionStats[ans.question_text] = { total: 0, correct: 0 };
          }
          questionStats[ans.question_text].total++;
          if (ans.is_correct) questionStats[ans.question_text].correct++;
        });

        let lowestRate = 100;
        let hardestQText = "";

        Object.entries(questionStats).forEach(([text, stats]) => {
          if (stats.total > 0) {
            const rate = (stats.correct / stats.total) * 100;
            if (rate < lowestRate) {
              lowestRate = rate;
              hardestQText = text;
            }
          }
        });

        if (hardestQText) {
          setHardestQuestion({ text: hardestQText, successRate: Math.round(lowestRate) });
        }
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#FFE600] flex items-center justify-center font-black text-4xl uppercase">Loading Stats...</div>;

  const maxDistCount = Math.max(...distribution.map(d => d.count), 1); // Sıfıra bölünmeyi önlemek için min 1

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-black selection:text-white bg-[#f5f8f8]" style={{ backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)", backgroundSize: "30px 30px", backgroundAttachment: "fixed" }}>
      <Navbar />
      
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 relative z-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <button onClick={() => router.push("/teacher")} className="flex items-center gap-2 font-black uppercase text-sm mb-4 bg-white text-black px-4 py-2 border-[3px] border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
              <ArrowLeft className="w-5 h-5 stroke-[3]" /> Back to Dashboard
            </button>
            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-black bg-white inline-block px-4 py-2 border-[4px] border-black shadow-[8px_8px_0px_0px_#00E57A] -rotate-1">
              Class Analytics
            </h1>
          </div>
          <div className="bg-black text-white px-6 py-3 border-[4px] border-black shadow-[6px_6px_0px_0px_#FFE600] rotate-1">
            <p className="font-black uppercase tracking-widest text-sm text-[#FFE600]">Exam</p>
            <p className="text-2xl font-black uppercase truncate max-w-[200px] md:max-w-[300px]">{examName || "Unknown"}</p>
          </div>
        </div>

        {totalStudents === 0 ? (
          <div className="bg-white border-[6px] border-black p-10 text-center shadow-[12px_12px_0px_0px_#000]">
            <BarChart className="w-20 h-20 mx-auto mb-4 text-black/20" />
            <h2 className="text-3xl font-black uppercase text-black">No Data Yet</h2>
            <p className="text-xl font-bold text-black/60 mt-2">Students need to finish the exam to generate analytics.</p>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* 🟢 TOP İSTATİSTİKLER */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border-[4px] border-black p-6 shadow-[8px_8px_0px_0px_#25c0f4] flex items-center gap-6 transition-transform hover:-translate-y-2">
                <div className="bg-[#25c0f4] p-4 border-2 border-black"><Users className="w-10 h-10 text-white" /></div>
                <div>
                  <p className="text-sm font-black uppercase tracking-widest text-black/50">Total Students</p>
                  <p className="text-5xl font-black">{totalStudents}</p>
                </div>
              </div>

              <div className="bg-white border-[4px] border-black p-6 shadow-[8px_8px_0px_0px_#FFE600] flex items-center gap-6 transition-transform hover:-translate-y-2">
                <div className="bg-[#FFE600] p-4 border-2 border-black"><Target className="w-10 h-10 text-black" /></div>
                <div>
                  <p className="text-sm font-black uppercase tracking-widest text-black/50">Class Average</p>
                  <p className="text-5xl font-black">{classAverage}%</p>
                </div>
              </div>

              <div className="bg-white border-[4px] border-black p-6 shadow-[8px_8px_0px_0px_#00E57A] flex items-center gap-6 transition-transform hover:-translate-y-2">
                <div className="bg-[#00E57A] p-4 border-2 border-black"><TrendingUp className="w-10 h-10 text-black" /></div>
                <div>
                  <p className="text-sm font-black uppercase tracking-widest text-black/50">Pass Rate (&gt;50%)</p>
                  <p className="text-5xl font-black">{passRate}%</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 🟢 DAĞILIM GRAFİĞİ (TAILWIND İLE ÇİZİLDİ) */}
              <div className="lg:col-span-2 bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-6 md:p-10 flex flex-col">
                <h3 className="text-3xl font-black uppercase tracking-tight mb-8 border-b-4 border-black pb-4">Score Distribution</h3>
                
                <div className="flex-1 flex items-end justify-between gap-2 md:gap-6 pt-10 min-h-[250px]">
                  {distribution.map((item, idx) => {
                    const heightPercent = (item.count / maxDistCount) * 100;
                    return (
                      <div key={idx} className="flex flex-col items-center flex-1 group">
                        <span className="font-black text-2xl mb-2 opacity-0 group-hover:opacity-100 transition-opacity">{item.count}</span>
                        <div className="w-full relative flex items-end justify-center">
                          <div 
                            className={`w-full ${item.color} border-[3px] border-black shadow-[4px_4px_0px_0px_#000] transition-all duration-1000 ease-out flex items-start justify-center pt-2`}
                            style={{ height: `${heightPercent === 0 ? 5 : heightPercent}%`, minHeight: '30px' }}
                          >
                             {item.count > 0 && <span className="font-black text-black bg-white/50 px-2 rounded text-sm hidden md:block">{item.count}</span>}
                          </div>
                        </div>
                        <span className="mt-4 font-black uppercase text-xs md:text-sm tracking-tighter bg-black text-white px-2 py-1 w-full text-center border-2 border-black">
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 🟢 EN ZOR SORU ANALİZİ */}
              <div className="bg-black text-white border-[6px] border-black shadow-[12px_12px_0px_0px_#FF6B9E] p-8 flex flex-col relative overflow-hidden">
                <div className="absolute top-[-20px] right-[-20px] opacity-10">
                  <AlertOctagon className="w-48 h-48" />
                </div>
                
                <h3 className="text-2xl font-black uppercase tracking-tight mb-6 text-[#FF6B9E] flex items-center gap-3 relative z-10">
                  <AlertOctagon className="w-8 h-8" /> Hardest Question
                </h3>
                
                <div className="flex-1 relative z-10 flex flex-col justify-center">
                  {hardestQuestion ? (
                    <>
                      <p className="text-xl md:text-2xl font-black leading-snug mb-6 border-l-4 border-[#FF6B9E] pl-4">
                        &quot;{hardestQuestion.text}&quot;
                      </p>
                      <div className="mt-auto bg-white text-black p-4 border-[4px] border-[#FF6B9E] inline-block w-fit">
                        <p className="text-xs font-black uppercase text-black/50 tracking-widest mb-1">Success Rate</p>
                        <p className="text-4xl font-black text-[#FF6B9E]">{hardestQuestion.successRate}%</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-xl font-bold text-white/50 italic">Not enough data to determine the hardest question yet.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}