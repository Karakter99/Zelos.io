"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../utils/Supabase/client";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import { ArrowLeft, User, Check, X, Clock, Award, BookOpen, ChevronRight } from "lucide-react";

type QuestionType = "mc" | "tf" | "fib" | "ms" | "short" | "long";

interface Student { id: string; name: string; score: number | null; }
interface Answer { 
  id: string; 
  question_text: string; 
  selected_answer: string; 
  correct_answer: string; 
  is_correct: boolean | null; 
  manual_score: number | null; 
  max_points: number; 
  question_type: QuestionType; 
}

// 🟢 SORU TİPİ ETİKETLERİ VE RENKLERİ EKLENDİ
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

export default function StudentDetailResults() {
  const { code } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStudentId = searchParams?.get("studentId");

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStudents(); }, [code]);

  const fetchStudents = async () => {
    setLoading(true);
    const { data: studentData } = await supabase.from("students").select("*").eq("exam_code", code).order("name", { ascending: true });
    if (studentData) {
      setStudents(studentData);
      const target = studentData.find(s => s.id === initialStudentId) || studentData[0];
      if (target) loadStudentAnswers(target);
    }
    setLoading(false);
  };

  const loadStudentAnswers = async (student: Student) => {
    setSelectedStudent(student);
    const { data } = await supabase.from("student_answers").select("*").eq("student_id", student.id).order("created_at", { ascending: true });
    setAnswers(data || []);
  };

  if (loading) return <div className="min-h-screen bg-[#FFE600] flex items-center justify-center font-black text-4xl text-black uppercase">Loading Details...</div>;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FFE600] selection:bg-black selection:text-[#00E57A]" style={{ backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)", backgroundSize: "30px 30px", backgroundAttachment: "fixed" }}>
      <Navbar />
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
        
        {/* SOL LİSTE (Hızlı Geçiş İçin) */}
        <div className="w-full md:w-[320px] bg-white border-r-[6px] border-black overflow-y-auto p-6 space-y-4 shadow-[8px_0_0_0_rgba(0,0,0,1)] shrink-0">
          <button onClick={() => router.push(`/teacher/results?code=${code}`)} className="flex items-center gap-2 font-black uppercase text-sm mb-6 bg-black text-white px-4 py-2 border-2 border-black shadow-[4px_4px_0px_0px_#25c0f4] hover:translate-x-1 transition-transform">
            <ArrowLeft className="w-4 h-4" /> Hub
          </button>
          <h2 className="text-3xl font-black text-black uppercase border-b-4 border-black pb-2">Class</h2>
          {students.map(s => (
            <button key={s.id} onClick={() => loadStudentAnswers(s)} className={`w-full p-4 border-[4px] border-black text-left flex items-center justify-between transition-all shadow-[4px_4px_0px_0px_#000] ${selectedStudent?.id === s.id ? 'bg-black text-white translate-x-1 translate-y-1 !shadow-none' : 'bg-white text-black hover:bg-[#FFE600]'}`}>
              <span className="font-black uppercase truncate text-lg">{s.name}</span>
              <ChevronRight className="w-5 h-5 stroke-[3]" />
            </button>
          ))}
        </div>

        {/* CEVAPLAR ALANI */}
        <div className="flex-1 p-4 md:p-10 overflow-y-auto">
          {!selectedStudent ? (
            <div className="h-full flex flex-col items-center justify-center bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-10 m-4">
              <User className="w-20 h-20 mb-4 stroke-[2] text-black" />
              <h2 className="text-3xl font-black text-black uppercase">No Student Data</h2>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-10 pb-20">
              
              {/* ÖĞRENCİ KİMLİK KARTI */}
              <div className="bg-black text-white p-8 border-[6px] border-black shadow-[12px_12px_0px_0px_#00E57A] rotate-1">
                <h1 className="text-5xl font-black uppercase mb-2">{selectedStudent.name}</h1>
                <div className="flex items-center gap-3">
                  <p className="font-black text-2xl text-[#00E57A] uppercase tracking-widest bg-white/10 px-4 py-1 border-2 border-[#00E57A]">
                    Score: {selectedStudent.score}%
                  </p>
                </div>
              </div>

              {/* 🟢 YÜKSEK KONTRASTLI SORU KARTLARI */}
              {answers.map((ans, idx) => (
                <div key={ans.id} className={`bg-white border-[6px] border-black border-l-[16px] p-6 md:p-8 shadow-[12px_12px_0px_0px_#000] ${TYPE_BORDERS[ans.question_type] || 'border-l-black'}`}>
                  
                  {/* Soru Başlığı ve Puan */}
                  <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <span className="bg-black text-white px-4 py-1 font-black uppercase text-sm border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                        Q {idx + 1}
                      </span>
                      <span className={`${TYPE_COLORS[ans.question_type]} px-3 py-1 font-black uppercase text-xs border-2 border-black shadow-[2px_2px_0px_0px_#000]`}>
                        {TYPE_LABELS[ans.question_type] || ans.question_type}
                      </span>
                    </div>

                    {/* Doğru/Yanlış Etiketi */}
                    <span className={`${ans.is_correct ? 'bg-[#00E57A] text-black' : 'bg-[#FF6B9E] text-black'} border-4 border-black px-4 py-2 font-black uppercase shadow-[4px_4px_0px_0px_#000]`}>
                      {ans.is_correct ? '✓ Correct' : '✗ Wrong'} ({ans.manual_score}/{ans.max_points} PTS)
                    </span>
                  </div>

                  {/* Soru Metni */}
                  <h3 className="text-2xl md:text-3xl font-black text-black leading-tight mb-8 uppercase tracking-tighter pl-2">
                    {ans.question_text}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 🟢 ÖĞRENCİNİN CEVABI (Sarı Kenarlık) */}
                    <div className="bg-[#f5f8f8] border-4 border-black p-6 border-l-[12px] border-l-[#FFE600] shadow-[6px_6px_0px_0px_#000]">
                      <p className="text-[11px] font-black uppercase text-black/50 tracking-widest mb-3">
                        Student&apos;s Answer
                      </p>
                      <p className={`text-2xl font-black ${!ans.selected_answer ? 'italic opacity-30 text-black' : 'text-black'}`}>
                        {ans.selected_answer || "(Blank)"}
                      </p>
                    </div>
                    
                    {/* 🟢 DOĞRU CEVAP (Yeşil Kenarlık) */}
                    <div className="bg-[#f5f8f8] border-4 border-black p-6 border-l-[12px] border-l-[#00E57A] shadow-[6px_6px_0px_0px_#000]">
                      <p className="text-[11px] font-black uppercase text-black/50 tracking-widest mb-3">
                        Correct Answer
                      </p>
                      <p className="text-2xl font-black text-[#00E57A]">
                        {ans.correct_answer}
                      </p>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}