"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../utils/Supabase/client";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { LogOut, User } from "lucide-react";

// Array of colors to cycle through for the cards
const cardColors = ["bg-[#FF6B9E]", "bg-[#5A87FF]", "bg-[#FFE600]", "bg-white"];

type Exam = {
  id: string;
  code: string;
  title: string | null;
  is_active: boolean;
  created_at: string;
  teacher_id: string | null;
};

type TeacherProfile = {
  id: string;
  full_name: string;
  email: string;
  school_name: string | null;
};

export default function TeacherDashboard() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(
    null,
  );

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      // 1. Check if user is authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Not logged in - redirect to login
        router.push("/teacher/login");
        return;
      }

      // 2. Fetch teacher profile
      const { data: profile, error: profileError } = await supabase
        .from("teacher_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        console.error("Profile fetch error:", profileError);
        // Profile doesn't exist - sign them out and redirect
        await supabase.auth.signOut();
        router.push("/teacher/login");
        return;
      }

      setTeacherProfile(profile);

      // 3. Fetch only THIS teacher's exams
      const { data: examData, error: examError } = await supabase
        .from("exams")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });

      if (examError) {
        console.error("Exam fetch error:", examError);
      }

      if (examData) {
        setExams(examData);
      }
    } catch (error) {
      console.error("Dashboard error:", error);
      router.push("/teacher/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Helper to format dates like "OCT 26, 2024"
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date
      .toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFE600] flex items-center justify-center font-black text-6xl">
        Loading...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col font-sans selection:bg-black selection:text-[#facc15] bg-[#FFE600]"
      style={{
        backgroundImage: "radial-gradient(circle, #000 2px, transparent 2px)",
        backgroundSize: "32px 32px",
        backgroundAttachment: "fixed",
      }}
    >
      <Navbar />

      {/* --- Main Dashboard Content --- */}
      <main className="flex-grow flex flex-col md:flex-row p-6 md:p-12 gap-8 md:gap-12 relative z-10 max-w-[1600px] mx-auto w-full">
        {/* 1. LEFT SIDEBAR */}
        <nav className="w-full md:w-72 bg-[#00E57A] border-[6px] border-black shadow-[16px_16px_0px_0px_#000] p-8 md:p-10 flex flex-col gap-8 h-fit z-10 shrink-0">
          {/* Teacher Info */}
          <div className="pb-6 border-b-4 border-black">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-black text-[#00E57A] border-2 border-black flex items-center justify-center">
                <User className="w-6 h-6" strokeWidth={3} />
              </div>
              <div>
                <div className="font-black text-black text-lg uppercase">
                  {teacherProfile?.full_name}
                </div>
                <div className="text-xs font-bold text-black/70">
                  {teacherProfile?.school_name || "Teacher"}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <Link
            href="/teacher"
            className="text-3xl font-black text-black uppercase hover:translate-x-2 transition-transform"
          >
            Dashboard
          </Link>
          <Link
            href="/teacher/create"
            className="text-3xl font-black text-black uppercase hover:translate-x-2 transition-transform"
          >
            Create Exam
          </Link>
          <Link
            href="#"
            className="text-3xl font-black text-black/50 uppercase hover:translate-x-2 transition-transform"
          >
            Settings
          </Link>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="mt-8 bg-black text-[#00E57A] font-black text-xl uppercase px-6 py-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" strokeWidth={3} />
            Logout
          </button>
        </nav>

        {/* 2. RIGHT CONTENT AREA */}
        <div className="flex-1 flex flex-col gap-12 z-10 w-full">
          {/* Top Banner Button */}
          <Link
            href="/teacher/create"
            className="bg-white border-[6px] border-black shadow-[16px_16px_0px_0px_#000] p-6 md:p-10 text-center hover:translate-x-2 hover:translate-y-2 hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-4 active:translate-y-4 active:shadow-none transition-all group"
          >
            <h1 className="text-4xl md:text-6xl font-black text-black uppercase tracking-tighter group-hover:scale-[1.02] transition-transform">
              + Create New Exam
            </h1>
          </Link>

          {/* Exam Cards Grid */}
          <div>
            <h2 className="text-4xl font-black uppercase mb-6 text-black">
              Your Exams ({exams.length})
            </h2>

            {exams.length === 0 ? (
              <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-10">
                <h3 className="text-4xl font-black uppercase mb-4">
                  No Exams Yet
                </h3>
                <p className="text-xl font-bold">
                  Click the button above to create your first exam.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-8">
                {exams.map((exam, index) => {
                  const colorClass = cardColors[index % cardColors.length];
                  const isDraft = !exam.is_active;

                  return (
                    <Link
                      href={`/teacher/exam/${exam.code}`}
                      key={exam.id}
                      className={`${colorClass} border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-8 md:p-10 flex flex-col justify-between aspect-video md:aspect-auto md:min-h-[280px] hover:translate-x-2 hover:translate-y-2 hover:shadow-[4px_4px_0px_0px_#000] transition-all cursor-pointer`}
                    >
                      <div>
                        <h3 className="text-4xl md:text-5xl font-black text-black uppercase leading-[1.1] tracking-tighter break-words mb-4">
                          {exam.title || "Untitled Exam"}
                        </h3>
                        <div className="bg-black text-white px-3 py-1 inline-block font-black text-sm uppercase">
                          CODE: {exam.code}
                        </div>
                      </div>

                      <div className="flex justify-between items-end mt-12 font-black text-black uppercase tracking-widest text-sm md:text-base">
                        <span>{formatDate(exam.created_at)}</span>
                        <span className="bg-black/10 px-3 py-1 border-2 border-black/20">
                          {isDraft ? "DRAFT" : "ACTIVE"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
