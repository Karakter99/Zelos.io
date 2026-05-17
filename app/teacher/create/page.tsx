"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { supabase } from "../../utils/Supabase/client";
import Navbar from "../../components/Navbar";
import {
  UploadCloud,
  Check,
  Send,
  HelpCircle,
  Eye,
  History,
  Download,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy
} from "lucide-react";

type QuestionType = "mc" | "tf" | "fib" | "ms" | "short" | "long";

interface Question {
  type: QuestionType;
  text: string;
  options: (string | number | undefined)[];
  answer: string;
  points: number; 
}

interface ExcelQuestionRow {
  type?: string;
  text?: string;
  option1?: string | number;
  option2?: string | number;
  option3?: string | number;
  option4?: string | number;
  answer?: string | number;
  points?: string | number; 
}

const TYPE_LABELS: Record<QuestionType, string> = {
  mc: "Multiple Choice",
  tf: "True / False",
  fib: "Fill in the Blank",
  ms: "Multiple Select",
  short: "Short Answer",
  long: "Long Answer",
};

const TYPE_COLORS: Record<QuestionType, string> = {
  mc: "bg-[#25c0f4] text-black",
  tf: "bg-[#00E57A] text-black",
  fib: "bg-[#FFE600] text-black",
  ms: "bg-[#a855f7] text-white",
  short: "bg-[#FF6B9E] text-black",
  long: "bg-[#5A87FF] text-white",
};

const normalizeType = (raw: string | undefined): QuestionType => {
  const val = (raw || "mc").toString().trim().toLowerCase();
  const map: Record<string, QuestionType> = {
    mc: "mc",
    multiple_choice: "mc",
    "multiple choice": "mc",
    tf: "tf",
    true_false: "tf",
    "true/false": "tf",
    "true false": "tf",
    fib: "fib",
    fill_in_the_blank: "fib",
    "fill in the blank": "fib",
    ms: "ms",
    multiple_select: "ms",
    "multiple select": "ms",
    short: "short",
    short_answer: "short",
    "short answer": "short",
    long: "long",
    long_answer: "long",
    "long answer": "long",
  };
  return map[val] || "mc";
};

export default function CreateExamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [teacherEmail, setTeacherEmail] = useState<string | null>(null);

  const [examTitle, setExamTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState<number | "">(60);
  const [penaltySeconds, setPenaltySeconds] = useState<number | "">(120);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // 🟢 YENİ: ÖZEL BİLDİRİM STATE'LERİ
  const [showNoCreditModal, setShowNoCreditModal] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
    code?: string;
  } | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/teacher/login");
        return;
      }

      const { data: profile } = await supabase
        .from("teacher_profiles")
        .select("credits")
        .eq("id", user.id)
        .single();

      if (!profile || profile.credits <= 0) {
        setShowNoCreditModal(true);
        setCheckingAuth(false);
        return;
      }

      setTeacherId(user.id);
      setTeacherEmail(user.email || null);
    } catch (error: unknown) {
      console.error("Auth check error:", error);
      router.push("/teacher/login");
    } finally {
      setCheckingAuth(false);
    }
  };

  const downloadTemplate = () => {
    const templateData: ExcelQuestionRow[] = [
      {
        type: "mc",
        text: "What is the capital of France?",
        option1: "Berlin", option2: "London", option3: "Paris", option4: "Rome",
        answer: "Paris", points: 10,
      },
      {
        type: "tf", text: "The Earth orbits the Sun.",
        answer: "TRUE", points: 5,
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    worksheet["!cols"] = [{ wch: 10 }, { wch: 50 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 10 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");
    XLSX.writeFile(workbook, "exam_template.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    const file = "dataTransfer" in e ? e.dataTransfer?.files?.[0] : (e.target as HTMLInputElement)?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const formattedQuestions = (data as ExcelQuestionRow[])
          .map((q) => {
            const qType = normalizeType(q.type?.toString());
            const opts = [q.option1, q.option2, q.option3, q.option4].filter(o => o !== undefined && o !== null && o !== "");
            const finalOptions = qType === "tf" ? ["TRUE", "FALSE"] : opts;

            return {
              type: qType,
              text: q.text ?? "",
              options: finalOptions,
              answer: q.answer !== undefined ? String(q.answer).trim() : "",
              points: Number(q.points) || 10, 
            };
          })
          .filter((q) => q.text !== "");

        setQuestions(formattedQuestions);
      } catch (err: unknown) {
        setAlertModal({
          type: "error",
          title: "FILE ERROR",
          message: "Failed to read the file. Please make sure you are using our XLSX template."
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSaveExam = async () => {
    if (!examTitle || questions.length === 0) {
      return setAlertModal({
        type: "info",
        title: "INCOMPLETE",
        message: "Please enter a title and upload at least one question to proceed."
      });
    }

    if (timeLimit === "" || timeLimit < 1) {
      return setAlertModal({
        type: "error",
        title: "TIME LIMIT",
        message: "Exam duration must be at least 1 minute."
      });
    }

    setLoading(true);

    try {
      const { data: profile } = await supabase.from("teacher_profiles").select("credits").eq("id", teacherId).single();

      if (!profile || profile.credits <= 0) {
        setShowNoCreditModal(true);
        setLoading(false);
        return;
      }

      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: exam, error: examError } = await supabase
        .from("exams")
        .insert([{
            title: examTitle,
            code: code,
            is_active: true,
            teacher_id: teacherId,
            created_by_email: teacherEmail,
            time_limit: timeLimit,
            penalty_seconds: penaltySeconds === "" ? 120 : penaltySeconds,
            status: "waiting" // 🟢 Varsayılan olarak taslak/waiting
        }])
        .select("id")
        .single();

      if (examError) throw new Error(examError.message);

      const questionPayload = questions.map((q) => ({
        exam_id: exam.id,
        text: q.text,
        options: q.options,
        answer: q.answer,
        type: q.type,
        points: q.points,
      }));

      const { error: qError } = await supabase.from("questions").insert(questionPayload);
      if (qError) throw new Error(qError.message);

      await supabase.from("teacher_profiles").update({ credits: profile.credits - 1 }).eq("id", teacherId);

      // 🟢 BAŞARILI BİLDİRİMİ
      setAlertModal({
        type: "success",
        title: "EXAM CREATED!",
        message: `Your exam "${examTitle}" is ready to go. You can share the code with your students.`,
        code: code
      });
      
    } catch (err: unknown) {
      setAlertModal({
        type: "error",
        title: "DATABASE ERROR",
        message: err instanceof Error ? err.message : "Something went wrong while saving."
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return <div className="min-h-screen bg-[#FFD700] flex items-center justify-center font-black text-4xl md:text-5xl uppercase">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f5f8f8] flex flex-col font-sans selection:bg-[#25c0f4] selection:text-black">
      <Navbar />

      {/* 🟢 NEO-BRUTALIST BİLDİRİM MODALI */}
      {alertModal && (
        <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`border-[6px] border-black shadow-[16px_16px_0px_0px_#000] p-8 md:p-12 max-w-xl w-full flex flex-col items-center text-center animate-in zoom-in-95 duration-200 ${
            alertModal.type === 'success' ? 'bg-[#00E57A]' : 
            alertModal.type === 'error' ? 'bg-[#FF6B9E]' : 
            'bg-[#25c0f4]'
          }`}>
            
            <div className="p-5 bg-white border-4 border-black mb-8 shadow-[6px_6px_0px_0px_#000] rotate-3">
              {alertModal.type === 'success' && <CheckCircle2 className="w-16 h-16 text-[#00E57A] stroke-[3]" />}
              {alertModal.type === 'error' && <XCircle className="w-16 h-16 text-[#FF6B9E] stroke-[3]" />}
              {alertModal.type === 'info' && <HelpCircle className="w-16 h-16 text-[#25c0f4] stroke-[3]" />}
            </div>

            <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-4 leading-none">
              {alertModal.title}
            </h2>
            <p className="text-xl font-bold uppercase tracking-widest mb-8 text-black/80">
              {alertModal.message}
            </p>

            {alertModal.code && (
              <div className="bg-black text-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_#fff] mb-10 w-full group cursor-pointer active:scale-95 transition-transform"
                   onClick={() => {
                     navigator.clipboard.writeText(alertModal.code!);
                   }}>
                <p className="text-xs font-black uppercase text-[#00E57A] mb-2 tracking-widest flex items-center justify-center gap-2">
                  <Copy className="w-4 h-4" /> Click to Copy Code
                </p>
                <p className="text-6xl font-black tracking-[0.2em]">{alertModal.code}</p>
              </div>
            )}

            <button 
              onClick={() => {
                if(alertModal.type === 'success') router.push("/teacher");
                setAlertModal(null);
              }}
              className="w-full bg-black text-white py-5 text-2xl font-black uppercase border-4 border-black shadow-[6px_6px_0px_0px_#fff] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
              {alertModal.type === 'success' ? "DASHBOARD" : "GOT IT"}
            </button>
          </div>
        </div>
      )}

      {showNoCreditModal && (
        <div className="fixed inset-0 bg-black/70 z-[500] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-6 max-w-sm w-full text-center flex flex-col items-center">
            <p className="text-base font-black uppercase mb-4 text-black bg-[#FFE600] px-3 py-2 border-4 border-black w-full">
              ⚠️ NO CREDITS: You need at least 1 credit.
            </p>
            <p className="text-lg font-black uppercase mb-6 text-black/80">
              Wanna buy some credits?
            </p>
            <div className="flex gap-4 w-full">
              <button onClick={() => router.push("/teacher")} className="flex-1 bg-white text-black border-4 border-black py-3 font-black uppercase text-base shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">NO</button>
              <button onClick={() => router.push("/pricing")} className="flex-1 bg-[#00E57A] text-black border-4 border-black py-3 font-black uppercase text-base shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">YES</button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 p-4 md:p-8 bg-[#FFD700]" style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "30px 30px" }}>
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none text-black">Upload<br />Questions</h1>
              <p className="mt-2 text-sm md:text-base font-bold uppercase bg-black text-white inline-block px-3 py-1 shadow-[4px_4px_0px_0px_#25c0f4]">Batch create via spreadsheet</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="flex flex-col gap-1.5 grow">
                <label className="text-xs font-black uppercase tracking-widest text-black">Exam Title</label>
                <input type="text" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} placeholder="E.G. PHYSICS MIDTERM"
                  className="w-full text-black bg-white border-4 border-black p-3 text-lg font-black uppercase shadow-[4px_4px_0px_0px_#000] outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all" />
              </div>

              <div className="flex flex-col gap-1.5 sm:w-40 shrink-0">
                <label className="text-xs font-black uppercase tracking-widest text-black flex items-center gap-2"><Clock className="w-3 h-3" /> Time (Mins)</label>
                <input type="number" min="1" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full text-black bg-white border-4 border-black p-3 text-lg font-black text-center shadow-[4px_4px_0px_0px_#000] outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all" />
              </div>

              <div className="flex flex-col gap-1.5 sm:w-40 shrink-0">
                <label className="text-xs font-black uppercase tracking-widest text-black flex items-center gap-2"><Clock className="w-3 h-3 text-red-500" /> Penalty (Secs)</label>
                <input type="number" min="10" value={penaltySeconds} onChange={(e) => setPenaltySeconds(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full text-black bg-white border-4 border-black p-3 text-lg font-black text-center shadow-[4px_4px_0px_0px_#000] outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all focus:border-red-500" />
              </div>
            </div>
          </div>

          <div className="relative group" onDragOver={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFileUpload(e); }}>
            <div className="absolute inset-0 bg-black translate-x-2 translate-y-2"></div>
            <div className={`relative bg-white border-[6px] border-black p-8 md:p-12 flex flex-col items-center text-center cursor-pointer border-dashed transition-colors ${dragActive ? "bg-[#25c0f4]" : ""}`}>
              <input type="file" accept=".xlsx, .xls, .csv" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
              <div className="size-20 bg-[#25c0f4] border-4 border-black shadow-[4px_4px_0px_0px_#000] flex items-center justify-center mb-6 rotate-3 group-hover:rotate-0 transition-transform">
                {questions.length > 0 ? <Check className="w-10 h-10 text-black stroke-[3]" /> : <UploadCloud className="w-10 h-10 text-black stroke-[3]" />}
              </div>
              <h2 className="text-2xl md:text-3xl font-black uppercase text-black mb-2">{questions.length > 0 ? `${questions.length} QUESTIONS LOADED` : "Drag & Drop .XLSX / .CSV"}</h2>
              <p className="text-base md:text-lg font-bold text-black/60 uppercase max-w-sm">Or click to browse your computer</p>
            </div>
          </div>

          {questions.length > 0 && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-black flex items-center gap-2"><Eye className="w-8 h-8" /> Preview</h2>
                <div className="flex items-center gap-4">
                  <span className="bg-black text-white px-3 py-1 font-black text-sm uppercase shadow-[4px_4px_0px_0px_#00E57A]">Total: {questions.reduce((sum, q) => sum + (q.points || 10), 0)} PTS</span>
                  <button onClick={() => setQuestions([])} className="bg-white text-black px-4 py-1 text-sm font-black uppercase border-4 border-black hover:bg-[#FF6B9E] transition-colors">Clear All</button>
                </div>
              </div>

              <div className="overflow-x-auto border-4 border-black shadow-[6px_6px_0px_0px_#000] bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black text-white uppercase text-xs font-black">
                      <th className="p-3 border-r-4 border-white/20">Type</th>
                      <th className="p-3 border-r-4 border-white/20">Question Text</th>
                      <th className="p-3 border-r-4 border-white/20">PTS</th>
                      <th className="p-3 border-r-4 border-white/20">Options</th>
                      <th className="p-3">Answer / Note</th>
                    </tr>
                  </thead>
                  <tbody className="text-black font-bold uppercase text-sm">
                    {questions.slice(0, 10).map((q, i) => (
                      <tr key={i} className="border-b-4 border-black last:border-0">
                        <td className="p-3 border-r-4 border-black">
                          <span className={`${TYPE_COLORS[q.type]} px-2 py-1 text-xs border-2 border-black font-black whitespace-nowrap`}>{q.type.toUpperCase()}</span>
                        </td>
                        <td className="p-3 border-r-4 border-black lowercase first-letter:uppercase max-w-xs">{q.text}</td>
                        <td className="p-3 border-r-4 border-black font-black text-center bg-[#FFE600]">{q.points}</td>
                        <td className="p-3 border-r-4 border-black text-xs text-black/60 italic">{q.options.length > 0 ? q.options.join(", ") : <span className="text-black/30">—</span>}</td>
                        <td className="p-3">{q.type === "long" ? <span className="text-black/30 italic text-xs">Manual grading</span> : <span className={`px-2 py-1 border-2 border-black inline-block font-black text-xs ${q.type === 'short' ? 'bg-[#FF6B9E]' : 'bg-[#00E57A]'}`}>{q.answer || "—"}</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-24">
            <div className="border-4 border-black bg-white p-5 shadow-[4px_4px_0px_0px_#000]">
              <h3 className="text-xl font-black uppercase mb-3 flex items-center gap-2 text-black"><History className="w-5 h-5" /> Supported Types</h3>
              <div className="space-y-2">
                {(Object.entries(TYPE_LABELS) as [QuestionType, string][]).map(([t, label]) => (
                  <div key={t} className="flex items-center gap-2">
                    <span className={`${TYPE_COLORS[t]} px-2 py-0.5 text-xs border-2 border-black font-black`}>{t.toUpperCase()}</span>
                    <span className="text-xs font-bold text-black/70 uppercase">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-4 border-black bg-[#25c0f4] p-5 shadow-[4px_4px_0px_0px_#000] flex flex-col justify-center items-center text-center">
              <HelpCircle className="text-black w-10 h-10 mb-2" />
              <h3 className="text-xl font-black uppercase text-black mb-2">Need Help?</h3>
              <p className="font-bold uppercase text-black/80 text-xs mb-1">Required columns: <strong>type</strong>, text, answer, <strong>points</strong></p>
              <button onClick={downloadTemplate} className="flex items-center gap-2 underline decoration-2 font-black uppercase text-black text-sm hover:text-white transition-colors">
                <Download className="w-4 h-4" /> Download Template
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="sticky bottom-0 bg-white border-t-[6px] border-black p-4 md:px-8 flex items-center justify-between z-50">
        <div className="hidden md:flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-black" />
          <span className="font-black uppercase text-xs">Review before publishing.</span>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <button onClick={() => router.push("/teacher")} className="text-red-500 flex-1 md:flex-none px-6 py-3 bg-white border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all text-lg font-black uppercase">Cancel</button>
          <button onClick={handleSaveExam} disabled={loading} className="flex-1 md:flex-none px-8 py-3 bg-[#25c0f4] border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all text-lg font-black uppercase flex items-center justify-center gap-2 disabled:opacity-50">
            <Send className="w-5 h-5 stroke-[3]" /> {loading ? "SAVING..." : "Save"}
          </button>
        </div>
      </footer>
    </div>
  );
}