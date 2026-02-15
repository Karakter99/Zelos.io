"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, SquareTerminal } from "lucide-react";
import Navbar from "../../components/Navbar";
import SuccessOverlay from "../../components/SuccessOverlay";
import { supabase } from "../../utils/Supabase/client";

export default function TeacherSignUp() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // State for the success overlay
  const [showSuccess, setShowSuccess] = useState(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Send the data to Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            // This safely stores their extra info in their user profile
            full_name: fullName,
            school_name: schoolName,
          },
        },
      });

      if (error) throw error;

      // 2. Success! Trigger the overlay instead of routing instantly
      setShowSuccess(true);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error);
        alert("Error: " + error.message);
      } else {
        console.error(error);
        alert("An unknown error occurred");
      }
      setLoading(false); // Only stop loading if it fails!
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col font-sans overflow-x-hidden bg-[#facc15] selection:bg-black selection:text-[#facc15]"
      style={{
        backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        backgroundAttachment: "fixed",
      }}
    >
      <Navbar />

      {/* --- Floating Background Letters (Hollow Stroke Effect) --- */}
      <div
        className="absolute z-0 font-black text-transparent opacity-20 pointer-events-none select-none text-9xl top-20 left-10 -rotate-12"
        style={{ WebkitTextStroke: "2px black" }}
      >
        A
      </div>
      <div
        className="absolute z-0 font-black text-transparent opacity-20 pointer-events-none select-none text-[12rem] bottom-20 right-10 rotate-12 hidden md:block"
        style={{ WebkitTextStroke: "2px black" }}
      >
        B
      </div>
      <div
        className="absolute z-0 font-black text-transparent opacity-20 pointer-events-none select-none text-8xl top-1/4 right-1/4 -rotate-45"
        style={{ WebkitTextStroke: "2px black" }}
      >
        C
      </div>
      <div
        className="absolute z-0 font-black text-transparent opacity-20 pointer-events-none select-none text-[15rem] -bottom-10 left-20 rotate-6 hidden md:block"
        style={{ WebkitTextStroke: "2px black" }}
      >
        X
      </div>
      <div
        className="absolute z-0 font-black text-transparent opacity-20 pointer-events-none select-none text-9xl top-1/2 left-10 rotate-12"
        style={{ WebkitTextStroke: "2px black" }}
      >
        Y
      </div>
      <div
        className="absolute z-0 font-black text-transparent opacity-20 pointer-events-none select-none text-8xl bottom-1/3 right-1/3 -rotate-12 hidden lg:block"
        style={{ WebkitTextStroke: "2px black" }}
      >
        Z
      </div>

      {/* --- Main Content Area --- */}
      <main className="flex-grow flex items-center justify-center p-6 relative z-10 w-full mb-20">
        <div className="relative w-full max-w-[500px]">
          {/* Decorative "Sticker" badge */}
          <div className="absolute -top-6 -right-6 bg-[#ff00ff] border-4 border-black p-3 rotate-12 shadow-[4px_4px_0px_0px_#000] hidden md:block z-20">
            <span className="text-white font-black uppercase text-xs tracking-tighter">
              Approved!
            </span>
          </div>

          {/* Main Sign Up Card */}
          <div className="bg-white border-[4px] border-black p-8 shadow-[8px_8px_0px_0px_#000] flex flex-col gap-6 relative z-10">
            {/* Header Section */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-[#25c0f4] border-2 border-black p-1 flex items-center justify-center">
                  <GraduationCap className="text-black w-6 h-6 stroke-[3]" />
                </div>
                <span className="text-black font-bold tracking-tighter uppercase">
                  Join the Faculty
                </span>
              </div>
              <h1 className="text-5xl font-black text-black leading-none uppercase tracking-tighter">
                Teacher <br />
                Sign Up
              </h1>
              <p className="text-black/70 font-medium">
                Create your educator account to start managing your classes.
              </p>
            </div>

            {/* Form */}
            <form className="flex flex-col gap-5" onSubmit={handleSignUp}>
              {/* Full Name */}
              <div className="flex flex-col gap-2">
                <label className="text-black font-black uppercase text-sm tracking-widest">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border-[3px] border-black p-4 text-black font-bold placeholder:text-black/40 rounded-none bg-white focus:outline-none focus:shadow-[4px_4px_0px_0px_#25c0f4] focus:border-black transition-shadow"
                  placeholder="e.g. Jane Doe"
                  required
                />
              </div>

              {/* Email Address */}
              <div className="flex flex-col gap-2">
                <label className="text-black font-black uppercase text-sm tracking-widest">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-[3px] border-black p-4 text-black font-bold placeholder:text-black/40 rounded-none bg-white focus:outline-none focus:shadow-[4px_4px_0px_0px_#25c0f4] focus:border-black transition-shadow"
                  placeholder="name@school.edu"
                  required
                />
              </div>

              {/* School Name */}
              <div className="flex flex-col gap-2">
                <label className="text-black font-black uppercase text-sm tracking-widest">
                  School Name
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full border-[3px] border-black p-4 text-black font-bold placeholder:text-black/40 rounded-none bg-white focus:outline-none focus:shadow-[4px_4px_0px_0px_#25c0f4] focus:border-black transition-shadow"
                  placeholder="Springfield Elementary"
                  required
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <label className="text-black font-black uppercase text-sm tracking-widest">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border-[3px] border-black p-4 text-black font-bold placeholder:text-black/40 rounded-none bg-white focus:outline-none focus:shadow-[4px_4px_0px_0px_#25c0f4] focus:border-black transition-shadow"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-4 bg-[#25c0f4] text-black font-black text-xl uppercase py-5 border-[4px] border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-75 disabled:opacity-70 disabled:pointer-events-none"
              >
                {loading ? "CREATING ACCOUNT..." : "Sign Up Now"}
              </button>
            </form>

            {/* Footer Link */}
            <div className="pt-4 border-t-4 border-black flex justify-center mt-2">
              <p className="text-black font-bold mt-4">
                Already have an account?
                <Link
                  href="/teacher/login"
                  className="text-[#25c0f4] bg-black px-2 py-1 ml-2 hover:text-white transition-colors"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* --- Fixed Branding element at bottom left --- */}
      <div className="fixed bottom-6 left-6 flex items-center gap-3 z-20">
        <div className="w-12 h-12 bg-white border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_#000]">
          <SquareTerminal className="text-black w-7 h-7 stroke-[3]" />
        </div>
        <div className="bg-black text-white px-3 py-1 font-black uppercase tracking-tighter italic">
          ExamFlow
        </div>
      </div>

      {/* --- THE SUCCESS OVERLAY COMPONENT --- */}
      <SuccessOverlay
        isVisible={showSuccess}
        title="ACCOUNT CREATED!"
        subtitle="Welcome to the faculty. Preparing your new dashboard..."
        onComplete={() => router.push("/teacher")}
      />
    </div>
  );
}
