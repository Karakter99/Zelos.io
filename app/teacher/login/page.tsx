"use client";

import { useState } from "react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import SuccessOverlay from "../../components/SuccessOverlay";
import { supabase } from "../../utils/Supabase/client";

export default function TeacherLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResendConfirmation = async () => {
    if (!email.trim()) {
      setErrorMessage("Please enter your email address first");
      return;
    }

    setResendLoading(true);
    setResendSuccess(false);
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setResendSuccess(true);
        setErrorMessage(null);
      }
    } catch (err) {
      console.error("Resend error:", err);
      setErrorMessage("Could not send email. Try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setResendSuccess(false);

    try {
      // 1. Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      // 2. Check if user has a teacher profile
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from("teacher_profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (profileError || !profile) {
          // Profile doesn't exist - this shouldn't happen with our trigger
          // but handle it gracefully
          console.error("Profile not found:", profileError);
          setErrorMessage(
            "Account setup incomplete. Please contact support or sign up again.",
          );
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        // 3. Record login session
        try {
          await supabase.from("teacher_sessions").insert({
            teacher_id: data.user.id,
            login_at: new Date().toISOString(),
            ip_address: null, // Browser doesn't expose IP
            user_agent: navigator.userAgent,
          });
        } catch (sessionError) {
          // Non-critical error, don't block login
          console.warn("Session tracking failed:", sessionError);
        }

        // 4. Success!
        setShowSuccess(true);
      }
    } catch (err: unknown) {
      console.error("Login Error:", err);
      setErrorMessage("Could not reach the server. Check your connection.");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col font-sans overflow-x-hidden bg-[#FFE600] selection:bg-black selection:text-[#FFE600]"
      style={{
        backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
        backgroundSize: "30px 30px",
        backgroundAttachment: "fixed",
      }}
    >
      <Navbar />

      {/* --- Floating Background Letters --- */}
      <div
        className="absolute z-0 font-black text-transparent opacity-15 pointer-events-none select-none text-[12rem] top-10 left-10 rotate-12"
        style={{ WebkitTextStroke: "2px #000" }}
      >
        A
      </div>
      <div
        className="absolute z-0 font-black text-transparent opacity-15 pointer-events-none select-none text-[15rem] bottom-10 right-20 -rotate-12"
        style={{ WebkitTextStroke: "2px #000" }}
      >
        B
      </div>
      <div
        className="absolute z-0 font-black text-transparent opacity-15 pointer-events-none select-none text-[10rem] top-1/2 left-20 -rotate-45"
        style={{ WebkitTextStroke: "2px #000" }}
      >
        X
      </div>

      {/* --- Main Content --- */}
      <main className="flex-grow flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-lg bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] p-8 md:p-12">
          {/* Header Section */}
          <div className="mb-10">
            <h2 className="text-black text-5xl font-black leading-none mb-4 uppercase tracking-tighter">
              TEACHER <br /> LOGIN
            </h2>
            <p className="text-black/70 text-lg font-medium">
              Enter your credentials to manage your exams and students.
            </p>
          </div>

          {/* Login Form */}
          <form className="space-y-8" onSubmit={handleLogin}>
            {errorMessage && (
              <div className="p-4 bg-red-100 border-2 border-red-500 text-red-800 text-sm font-bold rounded-lg space-y-2">
                <p>{errorMessage}</p>
                {errorMessage.includes("Email not confirmed") && (
                  <div className="pt-2 space-y-2">
                    <p className="text-red-700 font-normal text-xs">
                      Check your inbox (and spam) for the confirmation link, or
                      resend it below.
                    </p>
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={resendLoading}
                      className="text-sm font-black uppercase bg-red-600 text-white px-4 py-2 rounded-full border-2 border-red-800 hover:bg-red-700 disabled:opacity-60"
                    >
                      {resendLoading ? "Sending…" : "Resend confirmation email"}
                    </button>
                  </div>
                )}
                {resendSuccess && (
                  <p className="text-green-700 font-bold text-xs pt-1">
                    ✓ Confirmation email sent. Check your inbox and spam folder.
                  </p>
                )}
              </div>
            )}

            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label className="text-black text-sm font-black uppercase tracking-widest ml-1">
                EMAIL ADDRESS
              </label>
              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-16 bg-white border-4 border-black px-6 text-lg font-bold text-black placeholder:text-black/30 focus:ring-0 focus:outline-none focus:bg-[#25c0f4]/10 transition-colors rounded-full shadow-[4px_4px_0px_0px_#000] focus:shadow-[2px_2px_0px_0px_#000] focus:translate-x-[2px] focus:translate-y-[2px]"
                  placeholder="name@school.edu"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end px-1">
                <label className="text-black text-sm font-black uppercase tracking-widest">
                  PASSWORD
                </label>
                <Link
                  href="/teacher/forgot-password"
                  className="text-[#25c0f4] font-bold text-sm hover:underline decoration-2"
                >
                  FORGOT?
                </Link>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-16 bg-white border-4 border-black px-6 pr-14 text-lg font-bold text-black placeholder:text-black/30 focus:ring-0 focus:outline-none focus:bg-[#25c0f4]/10 transition-colors rounded-full shadow-[4px_4px_0px_0px_#000] focus:shadow-[2px_2px_0px_0px_#000] focus:translate-x-[2px] focus:translate-y-[2px]"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 text-black/40 hover:text-black transition-colors"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="w-6 h-6" />
                  ) : (
                    <Eye className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-16 bg-[#25c0f4] text-black border-4 border-black shadow-[8px_8px_0px_0px_#000] hover:shadow-[10px_10px_0px_0px_#000] hover:-translate-y-1 hover:-translate-x-1 active:shadow-none active:translate-y-2 active:translate-x-2 text-xl font-black uppercase tracking-widest transition-all rounded-full flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
              >
                {loading ? "AUTHENTICATING..." : "LOG IN"}
                {!loading && <ArrowRight className="w-6 h-6 stroke-[3]" />}
              </button>
            </div>

            {/* Sign Up Footer */}
            <div className="text-center pt-4">
              <p className="text-black/60 font-bold">
                DON&apos;T HAVE AN ACCOUNT?
                <Link
                  className="text-[#25c0f4] hover:underline decoration-4 underline-offset-4 ml-2"
                  href="/teacher/signup"
                >
                  SIGN UP
                </Link>
              </p>
            </div>
          </form>
        </div>
      </main>

      {/* --- Footer Decoration --- */}
      <footer className="p-8 text-center relative z-10 flex justify-center pb-12">
        <div className="inline-flex gap-8">
          <div className="flex items-center gap-2 text-black font-black uppercase text-xs tracking-widest">
            <span className="w-3 h-3 bg-black rounded-full"></span>
            SECURE ACCESS
          </div>
          <div className="flex items-center gap-2 text-black font-black uppercase text-xs tracking-widest">
            <span className="w-3 h-3 bg-[#25c0f4] rounded-full"></span>
            24/7 SUPPORT
          </div>
        </div>
      </footer>

      {/* --- THE SUCCESS OVERLAY COMPONENT --- */}
      <SuccessOverlay
        isVisible={showSuccess}
        title="SUCCESSFULLY LOGGED IN!"
        subtitle="Welcome back, Professor. Redirecting to your dashboard..."
        onComplete={() => router.push("/teacher")}
      />
    </div>
  );
}
