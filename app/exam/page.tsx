"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase } from "../utils/Supabase/client";

export default function ExamEntryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [examCode, setExamCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [grade, setGrade] = useState("");

  const handleJoin = async () => {
    if (!firstName || !surname || !grade || !examCode) {
      return alert("Please fill out all fields!");
    }
    setLoading(true);

    try {
      // 1. Clean the code: Remove spaces and make it UPPERCASE
      const cleanCode = examCode.trim().toUpperCase();

      // 2. Check if the exam exists (Case-Insensitive)
      const { data: exam, error: examError } = await supabase
        .from("exams")
        .select("id")
        .ilike("code", cleanCode)
        .single();

      if (examError || !exam) {
        alert(`❌ Exam Code "${cleanCode}" not found!`);
        setLoading(false);
        return;
      }

      const fullStudentName = `${firstName.trim()} ${surname.trim()} (Grade ${grade.trim()})`;

      // 3. Create student record using the cleaned UPPERCASE code
      const { data: student, error: studentError } = await supabase
        .from("students")
        .insert([
          {
            name: fullStudentName,
            exam_code: cleanCode,
            status: "active",
            current_question_index: 0,
          },
        ])
        .select()
        .single();

      if (studentError) throw studentError;

      // 4. Save to Session Storage
      sessionStorage.setItem("activeStudentId", student.id);
      sessionStorage.setItem("activeExamCode", cleanCode);
      sessionStorage.setItem("activeStudentName", fullStudentName);

      // 🔧 FIX: Route to /exam/live which has the anti-cheat detection!
      router.push("/exam/live");
    } catch (error: unknown) {
      console.error("Join Error:", error);

      // We "check" if the error is an instance of the Error class
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";

      alert(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#8B5CF6] relative flex flex-col font-sans"
      style={{
        backgroundImage: "radial-gradient(#000 2px, transparent 2px)",
        backgroundSize: "32px 32px",
      }}
    >
      <Navbar />
      <main className=" text-black flex-grow flex flex-col items-center justify-center p-4 z-10 w-full mb-12">
        <div className="bg-white border-8 border-black shadow-[20px_20px_0px_0px_#000] p-8 md:p-16 w-full max-w-4xl flex flex-col gap-8">
          <input
            className="w-full text-2xl md:text-5xl font-black p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] outline-none uppercase placeholder:text-black/20"
            placeholder="ENTER EXAM CODE"
            value={examCode}
            onChange={(e) => setExamCode(e.target.value)}
          />
          <input
            className="w-full text-2xl md:text-5xl font-black p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] outline-none uppercase placeholder:text-black/20"
            placeholder="NAME"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            className="w-full text-2xl md:text-5xl font-black p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] outline-none uppercase placeholder:text-black/20"
            placeholder="SURNAME"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
          />
          <input
            className="w-full text-2xl md:text-5xl font-black p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] outline-none uppercase placeholder:text-black/20"
            placeholder="GRADE"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          />
          <button
            onClick={handleJoin}
            disabled={loading}
            className="w-full mt-4 bg-[#00E57A] border-4 border-black shadow-[8px_8px_0px_0px_#000] text-black text-3xl md:text-6xl font-black py-8 hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all flex justify-center items-center gap-4 uppercase"
          >
            {loading ? "LOADING..." : "START TEST"}
            {!loading && <ArrowRight className="w-14 h-14" strokeWidth={4} />}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
