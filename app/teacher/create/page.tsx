"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { supabase } from "../../utils/Supabase/client";
import Navbar from "../../components/Navbar";
import {
  UploadCloud,
  X,
  Check,
  Save,
  Download,
  Eye,
  History,
  HelpCircle,
  Search,
  Send,
} from "lucide-react";

interface Question {
  text: string;
  options: (string | number | undefined)[];
  answer: string | number;
}

interface ExcelQuestionRow {
  text?: string;
  option1?: string | number;
  option2?: string | number;
  option3?: string | number;
  option4?: string | number;
  answer?: string | number;
}

export default function CreateExamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [examTitle, setExamTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // --- DOWNLOAD TEMPLATE FUNCTION ---
  const downloadTemplate = () => {
    const templateData: ExcelQuestionRow[] = [
      {
        text: "What is 2 + 2?",
        option1: "3",
        option2: "4",
        option3: "5",
        option4: "6",
        answer: "4", // Note: It's usually best to put the exact answer text to avoid confusion!
      },
      {
        text: "What is the capital of France?",
        option1: "Berlin",
        option2: "London",
        option3: "Paris",
        option4: "Rome",
        answer: "Paris",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");

    XLSX.writeFile(workbook, "exam_template.xlsx");
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement> | React.DragEvent,
  ) => {
    const file =
      "dataTransfer" in e
        ? e.dataTransfer?.files?.[0]
        : (e.target as HTMLInputElement)?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Ensure we handle missing fields safely so the preview doesn't crash
        const formattedQuestions = (data as ExcelQuestionRow[])
          .map((q) => ({
            text: q.text ?? "",
            options: [q.option1, q.option2, q.option3, q.option4].filter(
              Boolean,
            ), // Filter removes undefined options
            answer: q.answer ?? "",
          }))
          .filter((q) => q.text !== ""); // Ignore completely empty rows

        setQuestions(formattedQuestions);
      } catch (err: unknown) {
        console.error("Parse Error:", err);
        alert(
          "Failed to read the file. Please try downloading the template first.",
        );
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSaveExam = async () => {
    if (!examTitle || questions.length === 0) {
      alert("Please enter a title and upload some questions!");
      return;
    }
    setLoading(true);

    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      console.log("1. Starting Exam Upload...");

      // Step 1: Create the Exam and explicitly ask Supabase to return the new ID
      const { data: exam, error: examError } = await supabase
        .from("exams")
        .insert([{ title: examTitle, code: code, is_active: true }])
        .select("id") // Force Supabase to return the ID
        .single();

      if (examError) {
        throw new Error("Exam Upload Failed: " + examError.message);
      }

      if (!exam || !exam.id) {
        throw new Error("Exam created, but Supabase did not return the ID.");
      }

      console.log("2. Exam Created! ID:", exam.id);

      // Step 2: Prepare the Questions Payload using the new exam.id
      // Create the Questions Records Payload
      const questionPayload = questions.map((q) => ({
        exam_id: exam.id,
        text: q.text,
        options: q.options,
        answer: String(q.answer), // must match database column
        type: "multiple_choice",
      }));

      console.log(
        "3. Payload prepared. Uploading questions...",
        questionPayload,
      );

      // Step 3: Insert Questions
      const { error: qError } = await supabase
        .from("questions")
        .insert(questionPayload);

      if (qError) {
        throw new Error("Questions Upload Failed: " + qError.message);
      }

      alert(`✅ Exam Created! Code: ${code}`);
      router.push("/teacher");
    } catch (err: unknown) {
      console.error("Database Error:", err);
      // Safely extract the exact error message Supabase is throwing
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      alert("❌ " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f8f8] flex flex-col font-sans selection:bg-[#25c0f4] selection:text-black">
      <Navbar />

      {/* Main Workspace */}
      <main
        className="flex-1 p-6 md:p-10 bg-[#FFD700]"
        style={{
          backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      >
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none text-black">
                Upload
                <br />
                Questions
              </h1>
              <p className="mt-4 text-xl font-bold uppercase bg-black text-white inline-block px-4 py-1">
                Batch create via spreadsheet
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <label className="block text-sm font-black uppercase tracking-widest text-black">
                Exam Title
              </label>
              <input
                type="text"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                placeholder="E.G. PHYSICS MIDTERM"
                className="bg-white border-4 border-black p-4 text-xl font-black uppercase shadow-[6px_6px_0px_0px_#000] outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all"
              />
            </div>
          </div>

          {/* Drop Zone */}
          <div
            className="relative group"
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              handleFileUpload(e);
            }}
          >
            <div className="absolute inset-0 bg-black translate-x-3 translate-y-3"></div>
            <div
              className={`relative bg-white border-8 border-black p-12 md:p-20 flex flex-col items-center text-center cursor-pointer border-dashed transition-colors ${dragActive ? "bg-[#25c0f4]" : ""}`}
            >
              <input
                type="file"
                accept=".xlsx, .xls"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileUpload}
              />

              <div className="size-32 bg-[#25c0f4] border-4 border-black shadow-[4px_4px_0px_0px_#000] flex items-center justify-center mb-8 rotate-3 group-hover:rotate-0 transition-transform">
                {questions.length > 0 ? (
                  <Check className="w-16 h-16 text-black stroke-[3]" />
                ) : (
                  <UploadCloud className="w-16 h-16 text-black stroke-[3]" />
                )}
              </div>

              <h2 className="text-4xl font-black uppercase text-black mb-4">
                {questions.length > 0
                  ? `${questions.length} QUESTIONS LOADED`
                  : "Drag & Drop .XLSX"}
              </h2>
              <p className="text-xl font-bold text-black/60 uppercase max-w-md">
                Or click to browse your computer for a question spreadsheet
              </p>
            </div>
          </div>

          {/* Preview Section */}
          {questions.length > 0 && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h2 className="text-4xl font-black uppercase tracking-tighter text-black flex items-center gap-3">
                  <Eye className="w-10 h-10" /> Preview
                </h2>
                <button
                  onClick={() => setQuestions([])}
                  className="bg-black text-[#FFD700] px-4 py-1 font-black uppercase hover:bg-red-500 transition-colors"
                >
                  Clear All
                </button>
              </div>

              <div className="overflow-x-auto border-4 border-black shadow-[8px_8px_0px_0px_#000] bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black text-white uppercase text-sm font-black">
                      <th className="p-4 border-r-4 border-white/20">
                        Question Text
                      </th>
                      <th className="p-4 border-r-4 border-white/20">
                        Options
                      </th>
                      <th className="p-4 border-r-4 border-white/20">
                        Correct
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-black font-bold uppercase">
                    {questions.slice(0, 10).map((q, i) => (
                      <tr
                        key={i}
                        className="border-b-4 border-black last:border-0"
                      >
                        <td className="p-4 border-r-4 border-black lowercase first-letter:uppercase">
                          {q.text}
                        </td>
                        <td className="p-4 border-r-4 border-black text-xs text-black/60 italic">
                          {q.options.join(", ")}
                        </td>
                        <td className="p-4 border-r-4 border-black">
                          <span className="bg-[#FFD700] px-3 py-1 border-2 border-black inline-block font-black">
                            {q.answer}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Help & History Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-32">
            <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_#000]">
              <h3 className="text-2xl font-black uppercase mb-4 flex items-center gap-2 text-black">
                <History className="w-6 h-6" /> Recently Uploaded
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[#f5f8f8] border-2 border-black">
                  <span className="font-bold uppercase text-black">
                    Science_Quiz_V2.xlsx
                  </span>
                  <span className="text-xs font-black opacity-50 uppercase">
                    Today
                  </span>
                </div>
              </div>
            </div>

            <div className="border-4 border-black bg-[#25c0f4] p-6 shadow-[6px_6px_0px_0px_#000] flex flex-col justify-center items-center text-center">
              <HelpCircle className="text-black w-12 h-12 mb-2" />
              <h3 className="text-2xl font-black uppercase text-black mb-2">
                Need Help?
              </h3>
              <p className="font-bold uppercase text-black/80 text-sm">
                Spreadsheet must have headers: text, option1, option2, option3,
                option4, answer.
              </p>
              {/* ATTACHED THE FUNCTION HERE */}
              <button
                onClick={downloadTemplate}
                className="mt-4 underline decoration-4 font-black uppercase text-black text-lg hover:text-white transition-colors"
              >
                Download Template
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Bar */}
      <footer className="sticky bottom-0 bg-white border-t-8 border-black p-6 flex items-center justify-between z-50">
        <div className="hidden md:flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-black" />
          <span className="font-black uppercase text-xs">
            Review your questions before publishing to the class database.
          </span>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <button
            onClick={() => router.push("/teacher")}
            className="flex-1 md:flex-none px-10 py-4 bg-white border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all text-xl font-black uppercase"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveExam}
            disabled={loading}
            className="flex-1 md:flex-none px-10 py-4 bg-[#25c0f4] border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all text-xl font-black uppercase flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <Send className="w-6 h-6 stroke-[3]" />
            {loading ? "SAVING..." : "Save & Publish"}
          </button>
        </div>
      </footer>
    </div>
  );
}
