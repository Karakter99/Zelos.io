"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  SquareTerminal,
  Eye,
  EyeOff,
  Mail,
  AlertTriangle,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import SuccessOverlay from "../../components/SuccessOverlay";
import { supabase } from "../../utils/Supabase/client";

export default function TeacherSignUp() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // State for the success overlay (Instant Login)
  const [showSuccess, setShowSuccess] = useState(false);

  // 🟢 NEW: State for "Check Email" overlay (Verification Required)
  const [showCheckEmail, setShowCheckEmail] = useState(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [password, setPassword] = useState("");

  // Error states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validateForm = () => {
    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name");
      return false;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address");
      return false;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long");
      return false;
    }
    return true;
  };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      // 🟢 ADD THIS LINE: Clear any "ghost" sessions before creating a new one
      await supabase.auth.signOut();

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            school_name: schoolName.trim() || null,
            role: "teacher",
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // 🟢 CHECK: Did Supabase create a user BUT NOT a session?
      // This means "Confirm Email" is ON in your Supabase settings.
      if (data.user && !data.session) {
        setLoading(false);
        setShowCheckEmail(true); // <--- SHOW THE EMAIL SCREEN
        return;
      }

      // If we got a session immediately, it means "Confirm Email" is OFF.
      // Proceed as normal.
      setShowSuccess(true);
    } catch (error: unknown) {
      console.error("Signup error:", error);
      if (error instanceof Error) {
        if (error.message.includes("User already registered")) {
          setErrorMessage(
            "This email is already registered. Please log in instead.",
          );
        } else if (error.message.includes("Email rate limit exceeded")) {
          setErrorMessage("Too many signup attempts. Please try again later.");
        } else {
          setErrorMessage(error.message);
        }
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
      setLoading(false);
    }
  };

  // 🟢 1. "CHECK YOUR INBOX" SCREEN
  if (showCheckEmail) {
    return (
      <div
        className="min-h-screen bg-[#FFE600] flex flex-col items-center justify-center p-6 text-black"
        style={{
          backgroundImage: "radial-gradient(#000 2px, transparent 2px)",
          backgroundSize: "32px 32px",
        }}
      >
        <Navbar />
        <div className="bg-white border-[6px] border-black shadow-[12px_12px_0px_0px_#000] p-10 max-w-md w-full text-center animate-in zoom-in duration-300 relative z-10">
          <div className="size-24 bg-[#25c0f4] border-4 border-black flex items-center justify-center mx-auto mb-8 shadow-[4px_4px_0px_0px_#000] rotate-3">
            <Mail className="w-12 h-12 stroke-[3] text-black" />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-4 leading-none">
            Check Your Inbox!
          </h1>
          <p className="font-bold text-lg mb-8">
            We sent a secure verification link to: <br />
            <span className="bg-[#FFE600] px-2 border-2 border-black mt-2 inline-block">
              {email}
            </span>
          </p>

          <div className="bg-gray-100 border-l-8 border-black p-4 mb-8 text-sm font-bold text-left flex gap-3">
            <AlertTriangle className="w-8 h-8 shrink-0 text-[#FF6B9E]" />
            <span>
              You cannot log in until you click the link in that email. Check
              your spam folder!
            </span>
          </div>

          <Link
            href="/teacher/login"
            className="block w-full bg-black text-white font-black uppercase py-4 border-4 border-black hover:bg-[#FF6B9E] hover:text-black transition-all shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
          >
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  // 🟢 2. REGULAR SIGN UP FORM
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

      {/* --- Floating Background Letters --- */}
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

      {/* --- Main Content Area --- */}
      <main className="flex-grow flex items-center justify-center p-6 relative z-10 w-full mb-20">
        <div className="relative w-full max-w-[500px]">
          <div className="absolute -top-6 -right-6 bg-[#ff00ff] border-4 border-black p-3 rotate-12 shadow-[4px_4px_0px_0px_#000] hidden md:block z-20">
            <span className="text-white font-black uppercase text-xs tracking-tighter">
              Approved!
            </span>
          </div>

          {/* Main Sign Up Card */}
          <div className="bg-white border-[4px] border-black p-8 shadow-[8px_8px_0px_0px_#000] flex flex-col gap-6 relative z-10">
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
                Teacher <br /> Sign Up
              </h1>
              <p className="text-black/70 font-medium">
                Create your educator account to start managing your classes.
              </p>
            </div>

            {errorMessage && (
              <div
                className={`p-4 border-4 font-bold text-sm ${errorMessage.startsWith("✅") ? "bg-[#00E57A] border-black" : "bg-[#FF6B9E] border-black"}`}
              >
                {errorMessage}
              </div>
            )}

            <form className="flex flex-col gap-5" onSubmit={handleSignUp}>
              <div className="flex flex-col gap-2">
                <label className="text-black font-black uppercase text-sm tracking-widest">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border-[3px] border-black p-4 text-black font-bold placeholder:text-black/40 rounded-none bg-white focus:outline-none focus:shadow-[4px_4px_0px_0px_#25c0f4] focus:border-black transition-shadow"
                  placeholder="e.g. Jane Doe"
                  required
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-black font-black uppercase text-sm tracking-widest">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-[3px] border-black p-4 text-black font-bold placeholder:text-black/40 rounded-none bg-white focus:outline-none focus:shadow-[4px_4px_0px_0px_#25c0f4] focus:border-black transition-shadow"
                  placeholder="name@school.edu"
                  required
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-black font-black uppercase text-sm tracking-widest">
                  School Name (Optional)
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full border-[3px] border-black p-4 text-black font-bold placeholder:text-black/40 rounded-none bg-white focus:outline-none focus:shadow-[4px_4px_0px_0px_#25c0f4] focus:border-black transition-shadow"
                  placeholder="Springfield Elementary"
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-black font-black uppercase text-sm tracking-widest">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border-[3px] border-black p-4 pr-12 text-black font-bold placeholder:text-black/40 rounded-none bg-white focus:outline-none focus:shadow-[4px_4px_0px_0px_#25c0f4] focus:border-black transition-shadow"
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-black transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-6 h-6" />
                    ) : (
                      <Eye className="w-6 h-6" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-black/60 font-medium">
                  Must be at least 6 characters
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-4 bg-[#25c0f4] text-black font-black text-xl uppercase py-5 border-[4px] border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-75 disabled:opacity-70 disabled:pointer-events-none"
              >
                {loading ? "CREATING ACCOUNT..." : "Sign Up Now"}
              </button>
            </form>

            <div className="pt-4 border-t-4 border-black flex justify-center mt-2">
              <p className="text-black font-bold mt-4">
                Already have an account?{" "}
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

      <div className="fixed bottom-6 left-6 flex items-center gap-3 z-20">
        <div className="w-12 h-12 bg-white border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_#000]">
          <SquareTerminal className="text-black w-7 h-7 stroke-[3]" />
        </div>
        <div className="bg-black text-white px-3 py-1 font-black uppercase tracking-tighter italic">
          ExamFlow
        </div>
      </div>

      <SuccessOverlay
        isVisible={showSuccess}
        title="ACCOUNT CREATED!"
        subtitle="Welcome to the faculty. Preparing your new dashboard..."
        onComplete={() => router.push("/teacher")}
      />
    </div>
  );
}
