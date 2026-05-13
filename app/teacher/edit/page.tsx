"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../utils/Supabase/client";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { 
  Save, 
  Trash2, 
  PenLine, 
  ArrowLeft, 
  Settings, 
  ListOrdered,
  Clock,
  BookOpen,
  Plus,
  Copy // 🟢 Kopyalama ikonu eklendi
} from "lucide-react";

type QuestionType = "mc" | "tf" | "fib" | "ms" | "short" | "long";

interface Exam {
  id: string;
  title: string;
  code: string;
  time_limit: number;
  penalty_seconds: number;
  created_at: string;
}

interface Question {
  id: string;
  exam_id: string;
  type: QuestionType;
  text: string;
  options: string[];
  answer: string;
  points?: number;
}

const TYPE_LABELS: Record<QuestionType, string> = {
  mc: "Multiple Choice", tf: "True/False", fib: "Fill in Blank", 
  ms: "Multi Select", short: "Short Answer", long: "Long Answer"
};

const TYPE_COLORS: Record<QuestionType, string> = {
  mc: "bg-[#25c0f4] text-black", 
  tf: "bg-[#00E57A] text-black", 
  fib: "bg-[#FFE600] text-black", 
  ms: "bg-[#a855f7] text-white", 
  short: "bg-[#FF6B9E] text-black", 
  long: "bg-[#5A87FF] text-white"
};

const TYPE_BORDERS: Record<QuestionType, string> = {
  mc: "border-l-[#25c0f4]", 
  tf: "border-l-[#00E57A]", 
  fib: "border-l-[#FFE600]", 
  ms: "border-l-[#a855f7]", 
  short: "border-l-[#FF6B9E]", 
  long: "border-l-[#5A87FF]"
};

function EditContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  const [editQ, setEditQ] = useState<Question | null>(null);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoadingExams(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/teacher/login");
        return;
      }

      const { data: examsData, error } = await supabase
        .from("exams")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
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
    setLoadingQuestions(true);
    try {
      const { data: qData } = await supabase
        .from("questions")
        .select("*")
        .eq("exam_id", exam.id)
        .order("created_at", { ascending: true });
        
      setQuestions(qData || []);
    } catch (err) {
      console.error("Sorular yüklenirken hata:", err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSaveExamSettings = async () => {
    if (!selectedExam) return;
    setSaving(true);
    try {
      await supabase
        .from("exams")
        .update({ 
          title: selectedExam.title, 
          time_limit: selectedExam.time_limit, 
          penalty_seconds: selectedExam.penalty_seconds 
        })
        .eq("id", selectedExam.id);
        
      setExams(prev => prev.map(e => e.id === selectedExam.id ? selectedExam : e));
      alert("✅ Exam settings saved!");
    } catch (err) {
      console.error(err);
      alert("Failed to save exam settings.");
    } finally {
      setSaving(false);
    }
  };

  // 🟢 YENİ EKLENDİ: Sınavı Tamamen Silme Fonksiyonu
  const handleDeleteExam = async () => {
    if (!selectedExam) return;
    if (!confirm(`Are you sure you want to PERMANENTLY delete "${selectedExam.title}"?\n\nAll questions and student results will be erased!`)) return;
    
    setSaving(true);
    try {
      const { error } = await supabase.from("exams").delete().eq("id", selectedExam.id);
      if (error) throw error;

      setExams(prev => prev.filter(e => e.id !== selectedExam.id));
      setSelectedExam(null);
      setQuestions([]);
      router.replace("/teacher/edit"); // URL'yi temizle
      alert("🗑️ Exam deleted successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to delete exam.");
    } finally {
      setSaving(false);
    }
  };

  // 🟢 YENİ EKLENDİ: Sınavı Kopyalama (Duplicate) Fonksiyonu
  const handleDuplicateExam = async () => {
    if (!selectedExam) return;
    if (!confirm("Are you sure you want to DUPLICATE this exam? It will cost 1 credit.")) return;
    
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // 1. Krediyi kontrol et
      const { data: profile } = await supabase.from("teacher_profiles").select("credits").eq("id", user.id).single();
      if (!profile || profile.credits < 1) {
        alert("❌ Not enough credits to duplicate this exam.");
        setSaving(false);
        return;
      }

      // 2. Krediyi düş
      await supabase.from("teacher_profiles").update({ credits: profile.credits - 1 }).eq("id", user.id);

      // 3. Yeni sınav kodu oluştur ve Sınavı kaydet
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: newExam, error: examErr } = await supabase
        .from("exams")
        .insert([{
          title: `${selectedExam.title} (Copy)`,
          code: newCode,
          time_limit: selectedExam.time_limit,
          penalty_seconds: selectedExam.penalty_seconds,
          teacher_id: user.id,
          is_active: true
        }])
        .select()
        .single();

      if (examErr) throw examErr;

      // 4. Soruları da yeni sınava bağlayarak kaydet
      if (questions.length > 0) {
        const newQuestions = questions.map(q => ({
          exam_id: newExam.id,
          text: q.text,
          type: q.type,
          options: q.options,
          answer: q.answer,
          points: q.points || 10
        }));
        const { error: qErr } = await supabase.from("questions").insert(newQuestions);
        if (qErr) throw qErr;
      }

      // 5. Ekranı yeni sınavla güncelle
      setExams(prev => [newExam, ...prev]);
      handleSelectExam(newExam); 
      alert(`✅ Exam duplicated successfully!\nNew Code: ${newCode}`);
    } catch (err) {
      console.error(err);
      alert("Failed to duplicate exam.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      await supabase.from("questions").delete().eq("id", id);
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete question.");
    }
  };

  const handleSaveQuestion = async () => {
    if (!editQ || !selectedExam) return;
    try {
      if (editQ.id === "") {
        const { data, error } = await supabase.from("questions").insert([{
            exam_id: selectedExam.id, text: editQ.text, type: editQ.type, options: editQ.options, answer: editQ.answer, points: editQ.points || 10
          }]).select().single();
        if (error) throw error;
        setQuestions(prev => [...prev, data]);
      } else {
        const { data, error } = await supabase.from("questions").update({
            text: editQ.text, type: editQ.type, options: editQ.options, answer: editQ.answer, points: editQ.points || 10
          }).eq("id", editQ.id).select().single();
        if (error) throw error;
        setQuestions(prev => prev.map(q => q.id === editQ.id ? data : q));
      }
      setEditQ(null); 
    } catch (err) {
      console.error(err);
      alert("Failed to save question.");
    }
  };

  if (loadingExams) return <div className="min-h-screen bg-[#FFE600] flex items-center justify-center font-black text-4xl uppercase">Loading Editor...</div>;

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-black selection:text-white bg-[#FFE600]" style={{ backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)", backgroundSize: "30px 30px", backgroundAttachment: "fixed" }}>
      <Navbar />
      
      {/* SORU DÜZENLEME MODALI */}
      {editQ && (
        <div className="fixed inset-0 bg-black/80 z-[500] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#FFE600] border-[6px] border-black shadow-[12px_12px_0px_0px_#25c0f4] p-0 max-w-3xl w-full my-auto overflow-hidden">
            <div className="bg-black text-white flex justify-between items-center p-6 border-b-[6px] border-black">
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">
                {editQ.id === "" ? "Add New Question" : "Edit Question"}
              </h2>
              <button onClick={() => setEditQ(null)} className="bg-white text-black px-4 py-2 font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_#FF6B9E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">Close</button>
            </div>
            <div className="p-6 md:p-8 space-y-6">
              <div>
                <label className="block text-sm font-black uppercase mb-2 text-black">Question Text</label>
                <textarea value={editQ.text} onChange={e => setEditQ({...editQ, text: e.target.value})} className="w-full border-4 border-black p-4 text-xl font-black text-black shadow-[6px_6px_0px_0px_#000] outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all resize-none bg-white" rows={3} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-black uppercase mb-2 text-black">Type</label>
                  <select value={editQ.type} onChange={e => setEditQ({...editQ, type: e.target.value as QuestionType})} className="w-full border-4 border-black p-4 font-black text-black uppercase shadow-[6px_6px_0px_0px_#000] outline-none bg-white cursor-pointer focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all">
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-black uppercase mb-2 text-black">Correct Answer</label>
                  <input type="text" value={editQ.answer} onChange={e => setEditQ({...editQ, answer: e.target.value})} placeholder={editQ.type === 'tf' ? 'TRUE / FALSE' : 'e.g. Paris'} className="w-full border-4 border-black p-4 font-black text-black shadow-[6px_6px_0px_0px_#000] outline-none bg-[#00E57A]/20 focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-black uppercase mb-2 text-black text-right">Points</label>
                  <input type="number" value={editQ.points || 10} onChange={e => setEditQ({...editQ, points: Number(e.target.value)})} className="w-full border-4 border-black p-4 font-black text-black text-right text-2xl shadow-[6px_6px_0px_0px_#000] outline-none bg-[#FF6B9E]/20 focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all" />
                </div>
              </div>
              {(editQ.type === 'mc' || editQ.type === 'ms') && (
                <div className="bg-white p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000]">
                  <label className="block text-sm font-black text-black uppercase mb-4">Options (A, B, C, D)</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[0, 1, 2, 3].map(i => (
                      <input key={i} type="text" value={editQ.options[i] || ""} onChange={e => { const newOpts = [...(editQ.options || [])]; newOpts[i] = e.target.value; setEditQ({...editQ, options: newOpts}); }} placeholder={`Option ${i+1}`} className="w-full border-[3px] border-black p-3 font-bold text-black outline-none focus:bg-[#25c0f4]/10 transition-all" />
                    ))}
                  </div>
                </div>
              )}
              <button onClick={handleSaveQuestion} className="w-full bg-[#00E57A] text-black border-4 border-black p-5 font-black uppercase text-2xl shadow-[8px_8px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-2 active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-3 mt-4">
                <Save className="w-8 h-8 stroke-[3]" /> {editQ.id === "" ? "Add Question" : "Save Updates"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
        
        {/* SOL LİSTE: SINAVLAR */}
        <div className="w-full md:w-[350px] bg-white border-r-[6px] border-black overflow-y-auto p-6 space-y-5 shadow-[8px_0_0_0_rgba(0,0,0,1)] z-20 shrink-0">
          <button onClick={() => router.push("/teacher")} className="flex items-center gap-2 font-black uppercase text-sm mb-6 hover:translate-x-1 transition-transform bg-black text-white px-4 py-2 border-2 border-black shadow-[4px_4px_0px_0px_#25c0f4]">
            <ArrowLeft className="w-5 h-5 stroke-[3]" /> Dashboard
          </button>
          <h2 className="text-4xl font-black text-black uppercase tracking-tighter mb-6 pb-2 border-b-4 border-black">Edit Center</h2>
          
          {exams.length === 0 ? (
            <div className="p-4 border-4 border-black bg-[#FFE600] font-black uppercase text-black text-center">No exams found.</div>
          ) : (
            <div className="space-y-4">
              {exams.map(exam => (
                <button key={exam.id} onClick={() => handleSelectExam(exam)} className={`w-full p-5 border-[4px] border-black text-left flex flex-col transition-all shadow-[6px_6px_0px_0px_#000] active:shadow-none active:translate-x-1 active:translate-y-1 ${selectedExam?.id === exam.id ? 'bg-black text-white translate-x-1 translate-y-1 !shadow-none border-l-[12px] border-l-[#00E57A]' : 'bg-white text-black hover:bg-[#FFE600]'}`}>
                  <p className="font-black uppercase text-xl truncate w-full mb-2">{exam.title || "Untitled Exam"}</p>
                  <div className={`flex justify-between w-full text-xs font-black uppercase tracking-widest ${selectedExam?.id === exam.id ? 'text-[#00E57A]' : 'text-black/60'}`}>
                    <span>CODE: {exam.code}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {exam.time_limit || "∞"}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SAĞ PANEL: DETAYLAR */}
        <div className="flex-1 p-4 md:p-10 overflow-y-auto">
          {!selectedExam ? (
            <div className="h-full flex flex-col items-center justify-center text-center bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] m-4 md:m-10 p-10">
              <BookOpen className="w-24 h-24 mb-6 stroke-[2]" />
              <h2 className="text-4xl md:text-5xl font-black text-black uppercase tracking-tighter leading-tight">Select an exam<br/>to start editing</h2>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-10 pb-20">
              
              <div className="bg-black text-white p-8 border-[6px] border-black shadow-[12px_12px_0px_0px_#25c0f4] rotate-1">
                <div className="flex items-center gap-4 mb-2">
                  <span className="bg-[#FFE600] text-black px-3 py-1 font-black text-sm uppercase border-2 border-black">CODE: {selectedExam.code}</span>
                </div>
                <h1 className="text-5xl font-black uppercase tracking-tighter mb-2">{selectedExam.title}</h1>
              </div>

              {/* 🟢 SINAV AYARLARI KARTI & AKSİYON BUTONLARI (Silme / Kopyalama) */}
              <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] overflow-hidden">
                <div className="bg-[#25c0f4] border-b-[6px] border-black p-6 flex items-center gap-4">
                  <Settings className="w-10 h-10 stroke-[3] text-black" />
                  <h2 className="text-3xl md:text-4xl font-black text-black uppercase tracking-tighter">Exam Settings</h2>
                </div>
                
                <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-3">
                    <label className="block text-sm font-black text-black uppercase mb-2">Exam Title</label>
                    <input type="text" value={selectedExam.title || ""} onChange={e => setSelectedExam({...selectedExam, title: e.target.value})} className="w-full border-4 border-black p-4 text-2xl font-black text-black uppercase shadow-[6px_6px_0px_0px_#000] outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-black uppercase mb-2">Time Limit (Mins)</label>
                    <input type="number" value={selectedExam.time_limit || ""} onChange={e => setSelectedExam({...selectedExam, time_limit: Number(e.target.value)})} className="w-full border-4 border-black p-4 text-xl font-black text-black shadow-[6px_6px_0px_0px_#000] outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-black uppercase mb-2 text-red-600">Penalty (Secs)</label>
                    <input type="number" value={selectedExam.penalty_seconds || ""} onChange={e => setSelectedExam({...selectedExam, penalty_seconds: Number(e.target.value)})} className="w-full border-4 border-black p-4 text-xl font-black text-black shadow-[6px_6px_0px_0px_#000] outline-none focus:border-red-600 focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all" />
                  </div>
                  
                  {/* 🟢 AKSİYON BUTONLARI */}
                  <div className="md:col-span-3 flex flex-col md:flex-row items-end gap-4 mt-2">
                    <button onClick={handleSaveExamSettings} disabled={saving} className="flex-1 w-full bg-[#00E57A] text-black border-4 border-black p-4 font-black uppercase text-xl flex items-center justify-center gap-2 shadow-[6px_6px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50">
                      <Save className="w-6 h-6 stroke-[3]" /> {saving ? "Working..." : "Update"}
                    </button>

                    <button onClick={handleDuplicateExam} disabled={saving} className="flex-1 w-full bg-[#a855f7] text-white border-4 border-black p-4 font-black uppercase text-xl flex items-center justify-center gap-2 shadow-[6px_6px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50">
                      <Copy className="w-6 h-6 stroke-[3]" /> Copy (1 CR)
                    </button>

                    <button onClick={handleDeleteExam} disabled={saving} className="flex-1 w-full bg-[#FF6B9E] text-black border-4 border-black p-4 font-black uppercase text-xl flex items-center justify-center gap-2 shadow-[6px_6px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50">
                      <Trash2 className="w-6 h-6 stroke-[3]" /> Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* SORULAR KARTI */}
              <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] overflow-hidden">
                <div className="bg-[#FF6B9E] border-b-[6px] border-black p-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <ListOrdered className="w-10 h-10 stroke-[3] text-black" />
                    <h2 className="text-3xl md:text-4xl font-black text-black uppercase tracking-tighter">Questions ({questions.length})</h2>
                  </div>
                  <button onClick={() => setEditQ({ id: "", exam_id: selectedExam.id, type: "mc", text: "", options: ["", "", "", ""], answer: "", points: 10 })} className="bg-black text-[#00E57A] px-6 py-3 border-4 border-black font-black uppercase flex items-center gap-2 hover:bg-[#00E57A] hover:text-black transition-colors shadow-[4px_4px_0px_0px_#00E57A] active:translate-x-1 active:translate-y-1 active:shadow-none">
                    <Plus className="w-6 h-6 stroke-[3]" /> Add New
                  </button>
                </div>

                <div className="p-6 md:p-10">
                  {loadingQuestions ? (
                    <p className="font-black text-xl text-black uppercase p-4">Loading questions...</p>
                  ) : questions.length === 0 ? (
                    <p className="font-black text-xl text-black uppercase p-8 border-4 border-black border-dashed bg-gray-50 text-center">No questions in this exam.</p>
                  ) : (
                    <div className="space-y-6">
                      {questions.map((q, idx) => (
                        <div key={q.id} className={`border-[4px] border-black border-l-[16px] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:translate-x-1 hover:translate-y-1 transition-transform shadow-[6px_6px_0px_0px_#000] bg-white ${TYPE_BORDERS[q.type]}`}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-4">
                              <span className="bg-black text-white px-3 py-1 font-black text-sm border-2 border-black">Q {idx + 1}</span>
                              <span className={`${TYPE_COLORS[q.type]} px-3 py-1 text-xs border-2 border-black font-black uppercase`}>{TYPE_LABELS[q.type]}</span>
                              <span className="bg-[#FFE600] px-3 py-1 text-xs border-2 border-black font-black uppercase text-black">{q.points || 10} PTS</span>
                            </div>
                            <h3 className="font-black text-black text-2xl leading-tight mb-3 pr-4">{q.text}</h3>
                            <div className="bg-[#f5f8f8] p-3 border-4 border-black inline-block mt-2">
                              <p className="text-[10px] font-black uppercase text-black/50 tracking-widest mb-1">Correct Answer</p>
                              <p className="font-bold text-[#00E57A] text-lg">{q.answer || "N/A"}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 w-full md:w-auto shrink-0 mt-4 md:mt-0">
                            <button onClick={() => setEditQ(q)} className="flex-1 md:flex-none bg-black text-white border-[4px] border-black p-4 font-black uppercase text-sm flex items-center justify-center gap-2 hover:bg-[#FFE600] hover:text-black transition-colors">
                              <PenLine className="w-5 h-5 stroke-[3]" /> Edit
                            </button>
                            <button onClick={() => handleDeleteQuestion(q.id)} className="flex-1 md:flex-none bg-white text-black border-[4px] border-black p-4 font-black uppercase text-sm flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors">
                              <Trash2 className="w-5 h-5 stroke-[3]" />
                            </button>
                          </div>
                        </div>
                      ))}
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

export default function EditPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black text-4xl bg-[#FFE600] uppercase">Loading...</div>}>
      <EditContent />
    </Suspense>
  );
}