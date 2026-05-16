"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../utils/Supabase/client";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import { 
  Check, X, ChevronRight, User, Clock, ArrowLeft, BookOpen, Save, Sparkles, Wand2, Users
} from "lucide-react";

type QuestionType = "mc" | "tf" | "fib" | "ms" | "short" | "long";

interface Student { id: string; name: string; score: number | null; }
interface Answer { 
  id: string; 
  student_id: string;
  question_text: string; 
  question_type: QuestionType; 
  selected_answer: string; 
  correct_answer: string; 
  is_correct: boolean | null; 
  manual_score: number | null; 
  max_points: number; 
  needs_grading: boolean; 
}

const NEEDS_MANUAL: QuestionType[] = ["fib", "short", "long"];

export default function GradePage() {
  const params = useParams();
  const code = params?.code as string;
  const router = useRouter();
  
  const [exam, setExam] = useState<{ id: string; title: string } | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPossiblePoints, setTotalPossiblePoints] = useState(1);

  const [customScores, setCustomScores] = useState<Record<string, number>>({});
  
  // Tekil AI
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiResults, setAiResults] = useState<Record<string, {score: number, reason: string}>>({});
  
  // Toplu AI
  const [isGlobalGrading, setIsGlobalGrading] = useState(false);
  const [globalProgress, setGlobalProgress] = useState({ current: 0, total: 0 });

  useEffect(() => { 
    if (code) fetchInitialData(); 
  }, [code]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: examData } = await supabase.from("exams").select("*").eq("code", code).single();
      setExam(examData);

      const { data: qData } = await supabase.from("questions").select("points").eq("exam_id", examData.id);
      const maxPts = qData?.reduce((acc, q) => acc + (q.points || 10), 0) || 1;
      setTotalPossiblePoints(maxPts);

      const { data: studentData } = await supabase.from("students").select("id, name, score").eq("exam_code", code).order("name", { ascending: true });
      setStudents(studentData || []);
    } catch (err: unknown) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  const loadStudentAnswers = async (student: Student) => {
    setSelectedStudent(student);
    setAiResults({}); // Öğrenci değişince AI sonuçlarını sıfırla
    const { data } = await supabase
      .from("student_answers")
      .select("*")
      .eq("student_id", student.id)
      .order("created_at", { ascending: true });
    
    if (!data) { setAnswers([]); setCustomScores({}); return; }

    setAnswers(data as Answer[]);
    
    const initialScores: Record<string, number> = {};
    data.forEach(a => { 
      if (a.manual_score !== null) initialScores[a.id] = a.manual_score; 
    });
    setCustomScores(initialScores);
  };

  // ── GRADE FONKSİYONU (FIX: needs_grading her zaman false yapılıyor) ──
  const handleGrade = async (
    answerId: string, 
    isCorrect: boolean, 
    isCustom: boolean = false, 
    overrideScore?: number
  ) => {
    const answer = answers.find(a => a.id === answerId);
    if (!answer) return;

    let pointsAwarded = 0;
    
    if (overrideScore !== undefined) {
      pointsAwarded = Math.min(overrideScore, answer.max_points);
      isCorrect = pointsAwarded >= answer.max_points;
      setCustomScores(prev => ({...prev, [answerId]: pointsAwarded}));
    } else if (isCustom) {
      pointsAwarded = Math.min(customScores[answerId] || 0, answer.max_points);
      isCorrect = pointsAwarded >= answer.max_points;
    } else {
      pointsAwarded = isCorrect ? answer.max_points : 0;
      setCustomScores(prev => ({...prev, [answerId]: pointsAwarded}));
    }
    
    // ✅ FIX: needs_grading her zaman false yapılıyor
    const { error } = await supabase
      .from("student_answers")
      .update({ 
        is_correct: isCorrect, 
        manual_score: pointsAwarded, 
        needs_grading: false,   // ← kritik düzeltme
      })
      .eq("id", answerId);

    if (error) { console.error("Grade save error:", error); return; }

    // Local state güncelle
    const updatedAnswers = answers.map(a => 
      a.id === answerId 
        ? { ...a, is_correct: isCorrect, manual_score: pointsAwarded, needs_grading: false } 
        : a
    );
    setAnswers(updatedAnswers);

    // Toplam skoru yeniden hesapla ve kaydet
    const totalPointsEarned = updatedAnswers.reduce((sum, a) => {
      if (a.needs_grading && a.is_correct === null) return sum; // henüz değerlendirilmemişleri atla
      return sum + (a.manual_score || 0);
    }, 0);
    const newScore = Math.round((totalPointsEarned / totalPossiblePoints) * 100);

    await supabase.from("students").update({ score: newScore }).eq("id", selectedStudent!.id);
    setStudents(prev => prev.map(s => 
      s.id === selectedStudent!.id ? { ...s, score: newScore } : s
    ));
    setSelectedStudent(prev => prev ? { ...prev, score: newScore } : null);
  };

  // ── TEKİL AI PUANLAMA (FIX: sonuç artık Supabase'e kaydediliyor) ──
  const handleSingleAIGrade = async (answer: Answer) => {
    setAiLoading(answer.id);
    try {
      const res = await fetch('/api/ai/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_text: answer.question_text,
          correct_answer: answer.correct_answer || "",
          student_answer: answer.selected_answer,
          max_points: answer.max_points,
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "AI hatasi");
      }

      const data = await res.json();
      const aiScore: number = data.suggested_score;
      const aiReason: string = data.reasoning;

      // ✅ FIX: AI sonucunu local state'e yaz
      setAiResults(prev => ({ ...prev, [answer.id]: { score: aiScore, reason: aiReason } }));
      
      // ✅ FIX: Score input'unu güncelle
      setCustomScores(prev => ({ ...prev, [answer.id]: aiScore }));

      // ✅ FIX: Supabase'e kaydet (needs_grading false yap)
      const isCorrect = aiScore >= answer.max_points;
      await supabase.from("student_answers").update({
        is_correct: isCorrect,
        manual_score: aiScore,
        needs_grading: false,  // ← kritik düzeltme
      }).eq("id", answer.id);

      // ✅ FIX: Local answers state'ini güncelle
      const updatedAnswers = answers.map(a =>
        a.id === answer.id
          ? { ...a, is_correct: isCorrect, manual_score: aiScore, needs_grading: false }
          : a
      );
      setAnswers(updatedAnswers);

      // ✅ FIX: Toplam skoru yeniden hesapla
      const totalPointsEarned = updatedAnswers.reduce((sum, a) => {
        if (a.needs_grading && a.is_correct === null) return sum;
        return sum + (a.manual_score || 0);
      }, 0);
      const newScore = Math.round((totalPointsEarned / totalPossiblePoints) * 100);
      await supabase.from("students").update({ score: newScore }).eq("id", selectedStudent!.id);
      setStudents(prev => prev.map(s => s.id === selectedStudent!.id ? { ...s, score: newScore } : s));
      setSelectedStudent(prev => prev ? { ...prev, score: newScore } : null);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bilinmeyen hata";
      alert("AI Hatasi: " + msg);
    } finally {
      setAiLoading(null);
    }
  };

  // ── TOPLU AI PUANLAMA ──
  const handleGlobalBulkAIGrade = async () => {
    if (!students || students.length === 0) return;
    if (!confirm("Tüm öğrencilerin açık uçlu soruları AI tarafından puanlanacak. Onaylıyor musunuz?")) return;

    setIsGlobalGrading(true);
    
    try {
      const studentIds = students.map(s => s.id);
      const { data: pendingAnswers } = await supabase
        .from("student_answers")
        .select("*")
        .in("student_id", studentIds)
        .eq("needs_grading", true)
        .in("question_type", NEEDS_MANUAL);

      if (!pendingAnswers || pendingAnswers.length === 0) {
        alert("Puanlanacak soru bulunamadı!");
        setIsGlobalGrading(false);
        return;
      }

      setGlobalProgress({ current: 0, total: pendingAnswers.length });

      for (let i = 0; i < pendingAnswers.length; i++) {
        const ans = pendingAnswers[i];

        const res = await fetch('/api/ai/grade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question_text: ans.question_text,
            correct_answer: ans.correct_answer || "",
            student_answer: ans.selected_answer,
            max_points: ans.max_points
          })
        });

        if (res.ok) {
          const data = await res.json();
          const aiScore = data.suggested_score;

          // ✅ needs_grading: false ile kaydet
          await supabase.from("student_answers").update({
            is_correct: aiScore >= ans.max_points,
            manual_score: aiScore,
            needs_grading: false,
          }).eq("id", ans.id);
          
          setAiResults(prev => ({ 
            ...prev, 
            [ans.id]: { score: aiScore, reason: data.reasoning } 
          }));
        }
        setGlobalProgress(prev => ({ ...prev, current: i + 1 }));
      }

      // Tüm öğrencilerin toplam puanını yeniden hesapla
      for (const student of students) {
        const { data: allStudentAnswers } = await supabase
          .from("student_answers")
          .select("manual_score, needs_grading, is_correct")
          .eq("student_id", student.id);
          
        if (allStudentAnswers) {
          const totalEarned = allStudentAnswers.reduce((sum, a) => sum + (a.manual_score || 0), 0);
          const newScore = Math.round((totalEarned / totalPossiblePoints) * 100);
          await supabase.from("students").update({ score: newScore }).eq("id", student.id);
        }
      }

      alert("✅ Tüm sınıfın puanlaması başarıyla tamamlandı!");
      await fetchInitialData();
      if (selectedStudent) await loadStudentAnswers(selectedStudent);

    } catch (err: unknown) {
      console.error(err);
      alert("Toplu puanlama sırasında bir hata oluştu.");
    } finally {
      setIsGlobalGrading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FFE600] flex items-center justify-center font-black text-4xl uppercase">Loading...</div>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-black selection:text-white bg-[#FFE600]"
      style={{ backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)", backgroundSize: "30px 30px", backgroundAttachment: "fixed" }}>
      <Navbar />
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
        
        {/* SOL PANEL: ÖĞRENCİ LİSTESİ */}
        <div className="w-full md:w-[350px] bg-white border-r-[6px] border-black overflow-y-auto p-6 space-y-5 shadow-[8px_0_0_0_rgba(0,0,0,1)] z-20 shrink-0">
          <button onClick={() => router.push("/teacher")}
            className="flex items-center gap-2 font-black uppercase text-sm mb-6 bg-black text-white px-4 py-2 border-2 border-black hover:translate-x-1 transition-transform">
            <ArrowLeft className="w-5 h-5 stroke-[3]" /> Dashboard
          </button>
          
          <h2 className="text-4xl font-black text-black uppercase tracking-tighter pb-2 border-b-4 border-black">Students</h2>
          
          {/* TOPLU AI BUTONU */}
          <div className="pt-2 pb-4">
            <button 
              onClick={handleGlobalBulkAIGrade}
              disabled={isGlobalGrading || students.length === 0}
              className="w-full bg-[#a855f7] text-white p-4 border-[4px] border-black font-black uppercase flex flex-col items-center justify-center gap-2 shadow-[6px_6px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50">
              {isGlobalGrading ? (
                <>
                  <Wand2 className="w-8 h-8 animate-spin" /> 
                  <span className="text-sm">Reading Papers... ({globalProgress.current}/{globalProgress.total})</span>
                </>
              ) : (
                <>
                  <Users className="w-8 h-8" />
                  <span className="text-sm text-center tracking-widest">Grade All Class With AI</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-4">
            {students.map(s => (
              <button key={s.id} onClick={() => loadStudentAnswers(s)}
                className={`w-full p-5 border-[4px] border-black text-left flex items-center justify-between transition-all shadow-[6px_6px_0px_0px_#000] ${
                  selectedStudent?.id === s.id 
                    ? 'bg-black text-white translate-x-1 translate-y-1 !shadow-none' 
                    : 'bg-white text-black hover:bg-[#FFE600]'
                }`}>
                <div className="flex-1 min-w-0 pr-3">
                  <p className="font-black uppercase text-xl truncate">{s.name}</p>
                  <p className={`text-xs font-black uppercase tracking-widest mt-1 ${selectedStudent?.id === s.id ? 'text-[#00E57A]' : 'text-black/50'}`}>
                    Score: {s.score ?? 0}%
                  </p>
                </div>
                <ChevronRight className={`w-7 h-7 stroke-[3] flex-shrink-0 ${selectedStudent?.id === s.id ? 'text-white' : 'text-black'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* SAĞ PANEL: CEVAPLAR */}
        <div className="flex-1 p-4 md:p-10 overflow-y-auto">
          {!selectedStudent ? (
            <div className="h-full flex flex-col items-center justify-center text-center bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] m-4 md:m-10 p-10">
              <User className="w-24 h-24 mb-6 stroke-[2]" />
              <h2 className="text-4xl md:text-5xl font-black text-black uppercase tracking-tighter">
                Select a student<br/>or grade all
              </h2>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-10 pb-20">
              <div className="bg-black text-white p-8 border-[6px] border-black shadow-[12px_12px_0px_0px_#25c0f4] rotate-1">
                <h1 className="text-5xl font-black uppercase tracking-tighter mb-2">{selectedStudent.name}</h1>
                <p className="font-black uppercase text-base text-[#25c0f4] flex items-center gap-2">
                  <BookOpen className="w-5 h-5" /> Total Score: {selectedStudent.score ?? 0}% (out of {totalPossiblePoints} pts)
                </p>
              </div>

              {answers.map((ans, idx) => {
                const isManual = NEEDS_MANUAL.includes(ans.question_type);

                // ✅ FIX: Badge mantığı — needs_grading VE is_correct null ise bekliyor
                const isPending = ans.needs_grading === true && ans.is_correct === null;
                const isPartial = !isPending && ans.is_correct === false && ans.manual_score !== null && ans.manual_score > 0;

                let badgeText = "";
                let badgeColor = "";
                
                if (isPending) {
                  badgeText = `Awaiting Grade (${ans.max_points} PTS)`;
                  badgeColor = "bg-[#FF6B9E]";
                } else if (ans.is_correct) {
                  badgeText = `✓ Correct (${ans.manual_score ?? ans.max_points}/${ans.max_points} PTS)`;
                  badgeColor = "bg-[#00E57A] text-black";
                } else if (isPartial) {
                  badgeText = `~ Partial (${ans.manual_score}/${ans.max_points} PTS)`;
                  badgeColor = "bg-[#FFE600] text-black";
                } else {
                  badgeText = `✗ Incorrect (0/${ans.max_points} PTS)`;
                  badgeColor = "bg-red-500 text-white";
                }

                return (
                  <div key={ans.id} className="bg-white border-[6px] border-black p-6 md:p-8 shadow-[12px_12px_0px_0px_#000] relative">
                    <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
                      <span className="bg-black text-white px-5 py-2 font-black text-base uppercase border-2 border-black">Q #{idx + 1}</span>
                      <span className={`${badgeColor} border-4 border-black px-4 py-2 font-black text-sm uppercase shadow-[4px_4px_0px_0px_#000] flex items-center gap-2`}>
                        {isPending && <Clock className="w-5 h-5 stroke-[3]" />}
                        {badgeText}
                      </span>
                    </div>

                    <h3 className="text-2xl md:text-3xl font-black text-black leading-tight mb-8 border-l-8 border-[#25c0f4] pl-5 uppercase">
                      {ans.question_text}
                    </h3>
                    
                    <div className="space-y-6 mb-8">
                      <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0px_0px_#000] border-l-[12px] border-l-[#FFE600]">
                        <p className="text-[11px] font-black uppercase mb-3 text-black/40">Student&apos;s Answer</p>
                        <p className="text-xl md:text-2xl font-black text-black leading-relaxed whitespace-pre-wrap">
                          {ans.selected_answer || <span className="opacity-20 italic">No answer provided</span>}
                        </p>
                      </div>
                      <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0px_0px_#000] border-l-[12px] border-l-[#00E57A]">
                        <p className="text-[11px] font-black uppercase mb-3 text-black/40">Correct Reference</p>
                        <p className="text-xl md:text-2xl font-black text-black leading-relaxed italic">
                          {ans.correct_answer || <span className="opacity-20">No reference in system</span>}
                        </p>
                      </div>
                    </div>

                    {isManual && (
                      <div className="bg-gray-50 p-6 border-t-4 border-black border-dashed mt-6">
                        
                        {/* AI SONUCU */}
                        {aiResults[ans.id] && (
                          <div className="mb-6 bg-white border-4 border-black p-5 shadow-[6px_6px_0px_0px_#a855f7] relative">
                            <div className="absolute -top-3 -left-2 bg-[#a855f7] text-white px-2 py-1 font-black text-[10px] uppercase border-2 border-black rotate-[-2deg]">
                              AI Suggestion (Saved ✓)
                            </div>
                            <div className="flex items-center gap-4 mt-2 mb-3">
                              <span className="text-3xl font-black text-[#a855f7]">
                                {aiResults[ans.id].score} <span className="text-lg text-black">/ {ans.max_points} pts</span>
                              </span>
                            </div>
                            <p className="text-sm font-bold text-black leading-relaxed italic border-l-4 border-[#a855f7] pl-3">
                              &quot;{aiResults[ans.id].reason}&quot;
                            </p>
                          </div>
                        )}

                        <p className="font-black text-sm uppercase tracking-widest text-black/60 mb-4">
                          Teacher Grade Override (Max: {ans.max_points} pts)
                        </p>

                        <div className="flex flex-col md:flex-row gap-4 items-center">
                          {/* FULL PUAN */}
                          <button
                            onClick={() => handleGrade(ans.id, true)}
                            className="w-full md:w-1/4 bg-[#00E57A] border-[4px] border-black p-4 font-black uppercase flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none">
                            <Check className="w-6 h-6 stroke-[4]" /> Full
                          </button>

                          {/* SIFIR PUAN */}
                          <button
                            onClick={() => handleGrade(ans.id, false)}
                            className="w-full md:w-1/4 bg-[#FF6B9E] border-[4px] border-black p-4 font-black uppercase flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none">
                            <X className="w-6 h-6 stroke-[4]" /> Zero
                          </button>

                          {/* ÖZEL PUAN */}
                          <div className="w-full md:flex-1 flex items-center gap-2">
                            <input
                              type="number" min={0} max={ans.max_points}
                              value={customScores[ans.id] ?? (ans.manual_score || 0)}
                              onChange={(e) => setCustomScores({...customScores, [ans.id]: Number(e.target.value)})}
                              className="w-20 border-4 border-black p-3 font-black text-xl text-center shadow-[4px_4px_0px_0px_#000] outline-none" />
                            <button
                              onClick={() => handleGrade(ans.id, false, true)}
                              className="flex-1 bg-black text-white border-[4px] border-black p-4 font-black uppercase text-sm shadow-[4px_4px_0px_0px_#a855f7] active:translate-x-1 active:translate-y-1 active:shadow-none whitespace-nowrap">
                              <Save className="w-5 h-5 inline mr-1" /> Override
                            </button>
                          </div>

                          {/* TEKİL AI BUTONU */}
                          <button
                            onClick={() => handleSingleAIGrade(ans)}
                            disabled={aiLoading === ans.id}
                            className="w-full md:w-auto bg-[#a855f7] text-white border-[4px] border-black p-4 font-black uppercase text-sm shadow-[4px_4px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center gap-2 disabled:opacity-50 whitespace-nowrap">
                            {aiLoading === ans.id 
                              ? <><Wand2 className="w-5 h-5 animate-spin" /> AI...</>
                              : <><Sparkles className="w-5 h-5" /> AI Grade</>}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}