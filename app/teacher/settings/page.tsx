"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // 🟢 Added Link import for the sidebar
import { supabase } from "../../utils/Supabase/client";
import Navbar from "../../components/Navbar";
import {
  Save,
  Trash2,
  AlertTriangle,
  User,
  Building,
  Mail,
  Loader2,
} from "lucide-react";

export default function TeacherSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Profile Data
  const [teacherId, setTeacherId] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [schoolName, setSchoolName] = useState("");

  // 1. Fetch current profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Not logged in");

        setTeacherId(user.id);
        setEmail(user.email || "");
        setFullName(user.user_metadata?.full_name || "");
        setSchoolName(user.user_metadata?.school_name || "");

        const { data: teacherData } = await supabase
          .from("teachers")
          .select("full_name, school_name")
          .eq("id", user.id)
          .single();

        if (teacherData) {
          if (teacherData.full_name) setFullName(teacherData.full_name);
          if (teacherData.school_name) setSchoolName(teacherData.school_name);
        }
      } catch (err) {
        console.error(err);
        router.push("/teacher/login");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  // 2. Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          school_name: schoolName,
        },
      });

      if (authError) throw authError;

      const { error: dbError } = await supabase
        .from("teachers")
        .update({
          full_name: fullName,
          school_name: schoolName,
        })
        .eq("id", teacherId);

      if (dbError && dbError.code !== "PGRST116") {
        console.warn("Could not update public table, might not exist yet.");
      }

      setMessage({ type: "success", text: "PROFILE UPDATED SUCCESSFULLY!" });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to update profile";
      setMessage({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  };

  // 3. Handle Account Deletion
  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "🛑 WARNING: This will permanently delete your account, all your exams, and student data. This cannot be undone. Type 'DELETE' to confirm?",
    );

    if (!confirmDelete) return;
    const finalCheck = window.prompt("Type DELETE to confirm account removal:");
    if (finalCheck !== "DELETE") {
      alert("Account deletion cancelled.");
      return;
    }

    setDeleting(true);

    try {
      const { error } = await supabase.rpc("delete_current_user");
      if (error) throw error;

      await supabase.auth.signOut();
      router.push("/");
    } catch (err: unknown) {
      console.error(err);
      alert(
        "❌ Failed to delete account. Please try again or contact support.",
      );
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFE600] flex items-center justify-center font-black text-6xl uppercase border-16px border-black">
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

      <main className="flex-grow flex flex-col md:flex-row p-6 md:p-12 gap-8 md:gap-12 relative z-10 max-w-[1600px] mx-auto w-full">
        {/* Decorative Lines */}
        <div className="absolute top-0 bottom-0 left-[340px] w-2 bg-black hidden md:block z-0 -ml-4" />
        <div className="absolute top-[200px] left-[340px] right-0 h-2 bg-black hidden md:block z-0" />

        {/* 1. LEFT SIDEBAR */}
        <nav className="w-full md:w-72 bg-[#00E57A] border-[6px] border-black shadow-[16px_16px_0px_0px_#000] p-8 md:p-10 flex flex-col gap-8 h-fit z-10 shrink-0">
          <Link
            href="/teacher"
            className="text-3xl font-black text-black uppercase hover:translate-x-2 transition-transform opacity-50 hover:opacity-100"
          >
            Dashboard
          </Link>
          <Link
            href="/teacher/new"
            className="text-3xl font-black text-black uppercase hover:translate-x-2 transition-transform opacity-50 hover:opacity-100"
          >
            Exam
          </Link>
          <Link
            href="#"
            className="text-3xl font-black text-black uppercase hover:translate-x-2 transition-transform opacity-50 pointer-events-none"
          >
            Students
          </Link>
          <Link
            href="/teacher/settings"
            className="text-3xl font-black text-black uppercase hover:translate-x-2 transition-transform opacity-50 hover:opacity-100"
          >
            Settings
          </Link>
        </nav>
        {/* 2. RIGHT CONTENT AREA (Settings Forms) */}
        <div className="flex-1 flex flex-col gap-8 z-10 w-full animate-in slide-in-from-bottom-8 duration-500 max-w-4xl">
          {/* Header */}
          <div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none text-black bg-white inline-block border-[6px] border-black p-4 md:p-6 shadow-[12px_12px_0px_0px_#000]">
              Account <br /> Settings
            </h1>
          </div>

          {/* Success / Error Message */}
          {message && (
            <div
              className={`p-4 border-[6px] border-black shadow-[8px_8px_0px_0px_#000] font-black uppercase text-xl flex items-center gap-3 ${message.type === "success" ? "bg-[#00E57A] text-black" : "bg-[#FF6B9E] text-black"}`}
            >
              {message.type === "success" ? (
                <Save className="w-8 h-8" />
              ) : (
                <AlertTriangle className="w-8 h-8" />
              )}
              {message.text}
            </div>
          )}

          {/* Profile Update Form */}
          <div className="bg-white border-[6px] border-black p-8 md:p-10 shadow-[12px_12px_0px_0px_#000]">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3 border-b-4 border-black pb-4">
              <User className="w-8 h-8 stroke-[3]" /> Edit Profile
            </h2>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Email (Read Only) */}
              <div className="flex flex-col gap-2 opacity-60">
                <label className="text-sm font-black uppercase tracking-widest text-black flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email Address (Read-Only)
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full text-black bg-gray-100 border-[3px] border-black p-4 text-xl font-bold cursor-not-allowed"
                />
              </div>

              {/* Full Name */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-black uppercase tracking-widest text-black flex items-center gap-2">
                  <User className="w-4 h-4" /> Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-black bg-white border-[3px] border-black p-4 text-xl font-bold shadow-[4px_4px_0px_0px_#000] focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all outline-none focus:bg-[#25c0f4]/10"
                  required
                />
              </div>

              {/* School Name */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-black uppercase tracking-widest text-black flex items-center gap-2">
                  <Building className="w-4 h-4" /> School Name
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="E.g. Springfield High"
                  className="w-full text-black bg-white border-[3px] border-black p-4 text-xl font-bold shadow-[4px_4px_0px_0px_#000] focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all outline-none focus:bg-[#25c0f4]/10"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="mt-4 w-full bg-[#25c0f4] text-black font-black text-2xl uppercase py-5 border-[4px] border-black shadow-[8px_8px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-2 active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:pointer-events-none"
              >
                {saving ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <Save className="w-8 h-8 stroke-[3]" />
                )}
                {saving ? "SAVING..." : "Save Changes"}
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="bg-[#FF6B9E] border-[6px] border-black p-8 md:p-10 shadow-[12px_12px_0px_0px_#000] mt-4">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 flex items-center gap-3 text-black">
              <AlertTriangle className="w-8 h-8 stroke-[3]" /> Danger Zone
            </h2>
            <p className="font-bold text-black mb-6 text-lg">
              Once you delete your account, there is no going back. All of your
              exams, questions, and student records will be permanently erased.
            </p>

            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-black text-[#FF6B9E] w-full font-black text-xl uppercase py-5 border-[4px] border-black shadow-[8px_8px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-2 active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {deleting ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <Trash2 className="w-8 h-8 stroke-[3]" />
              )}
              {deleting ? "DELETING..." : "Delete Account"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
