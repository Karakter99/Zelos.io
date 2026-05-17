"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Send, LifeBuoy, CheckCircle2, AlertTriangle, UserCheck, Mail } from "lucide-react"; // 🟢 Mail ikonu eklendi
import { supabase } from "../utils/Supabase/client"; 

export default function SupportPage() {
  const [user, setUser] = useState<any>(null); 
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setFormData(prev => ({
          ...prev,
          name: user.user_metadata?.full_name || "Teacher",
          email: user.email || ""
        }));
      }
    };
    checkUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setStatus("error");
      setErrorMessage("Please fill out all fields.");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus("success");
        setFormData(prev => ({
          ...prev,
          subject: "",
          message: ""
        }));
      } else {
        throw new Error("Failed to send message.");
      }
    } catch (err: unknown) {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again later.");
    }
  };

  return (
    <div className="min-h-screen bg-[#25c0f4] flex flex-col font-sans selection:bg-black selection:text-white"
         style={{ backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)", backgroundSize: "30px 30px", backgroundAttachment: "fixed" }}>
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative z-10 w-full max-w-7xl mx-auto my-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 w-full">
          
          {/* SOL TARAF - BAŞLIK VE BİLGİ */}
          <div className="flex flex-col justify-center">
            <div className="bg-black text-white p-4 border-4 border-black w-fit mb-6 shadow-[6px_6px_0px_0px_#FFE600] rotate-2">
              <LifeBuoy className="w-12 h-12 stroke-[3]" />
            </div>
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-black leading-none mb-6 drop-shadow-[4px_4px_0px_#fff]">
              Need<br />Some Help?
            </h1>
            <p className="text-2xl font-black uppercase tracking-widest text-black/80 bg-white inline-block px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] mb-8 w-fit">
              Drop us a line below.
            </p>

            {/* 🟢 YENİ EKLENEN: DİREKT MAİL KUTUSU */}
            <div className="mt-4 bg-[#FF6B9E] border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000] rotate-[-1deg] w-fit">
              <h3 className="text-lg md:text-xl font-black uppercase mb-3 text-black">Prefer your own email app?</h3>
              <a 
                href="mailto:roedubridge@gmail.com" 
                className="flex items-center gap-3 bg-white border-4 border-black p-3 md:p-4 hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_#000] transition-all group"
              >
                <div className="bg-[#FFE600] p-2 border-2 border-black">
                  <Mail className="w-6 h-6 text-black stroke-[3] group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-base md:text-xl font-black uppercase tracking-widest text-black decoration-4 underline-offset-4 group-hover:underline decoration-[#25c0f4]">
                  roedubridge@gmail.com
                </span>
              </a>
            </div>

          </div>

          {/* SAĞ TARAF - İLETİŞİM FORMU */}
          <div className="bg-white border-[6px] border-black shadow-[16px_16px_0px_0px_#000] p-8 md:p-12 relative">
            
            {status === "success" ? (
              <div className="absolute inset-0 bg-[#00E57A] flex flex-col items-center justify-center p-8 text-center border-[6px] border-black z-20 animate-in fade-in duration-300">
                <CheckCircle2 className="w-24 h-24 text-black stroke-[3] mb-6" />
                <h2 className="text-5xl font-black uppercase tracking-tighter text-black mb-4">Message Sent!</h2>
                <p className="text-xl font-bold uppercase text-black/80 mb-8">We received your request and will get back to you shortly.</p>
                <button 
                  onClick={() => setStatus("idle")}
                  className="bg-black text-white border-4 border-black px-8 py-4 font-black uppercase text-xl shadow-[6px_6px_0px_0px_#fff] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                >
                  Send Another
                </button>
              </div>
            ) : null}

            {status === "error" && (
              <div className="bg-[#FF6B9E] border-4 border-black p-4 mb-8 flex items-center gap-4 shadow-[4px_4px_0px_0px_#000]">
                <AlertTriangle className="w-8 h-8 text-black stroke-[3] shrink-0" />
                <p className="font-black uppercase text-black text-sm md:text-base">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              
              {user ? (
                <div className="bg-[#FFE600] border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] flex items-center gap-3">
                  <UserCheck className="w-6 h-6 text-black stroke-[3]" />
                  <div className="text-sm font-black uppercase text-black">
                    Sending as: <span className="underline">{user.email}</span>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-black uppercase tracking-widest mb-2 text-black">Your Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="JOHN DOE"
                      className="w-full bg-white text-black placeholder:text-black/40 border-4 border-black p-4 text-xl font-black uppercase shadow-[4px_4px_0px_0px_#000] outline-none focus:bg-[#FFE600]/20 focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-black uppercase tracking-widest mb-2 text-black">Email Address</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="HELLO@DOMAIN.COM"
                      className="w-full bg-white text-black placeholder:text-black/40 border-4 border-black p-4 text-xl font-black uppercase shadow-[4px_4px_0px_0px_#000] outline-none focus:bg-[#FFE600]/20 focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-black uppercase tracking-widest mb-2 text-black">Subject</label>
                <input 
                  type="text" 
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="WHAT'S THIS ABOUT?"
                  className="w-full bg-white text-black placeholder:text-black/40 border-4 border-black p-4 text-xl font-black uppercase shadow-[4px_4px_0px_0px_#000] outline-none focus:bg-[#FFE600]/20 focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-black uppercase tracking-widest mb-2 text-black">Message</label>
                <textarea 
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="EXPLAIN YOUR ISSUE HERE..."
                  className="w-full bg-white text-black placeholder:text-black/40 border-4 border-black p-4 text-xl font-black shadow-[4px_4px_0px_0px_#000] outline-none focus:bg-[#FFE600]/20 focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all resize-none"
                ></textarea>
              </div>

              <button 
                type="submit"
                disabled={status === "loading"}
                className="w-full mt-4 bg-black text-[#FFE600] border-4 border-black p-6 font-black uppercase text-2xl flex items-center justify-center gap-4 shadow-[8px_8px_0px_0px_#FFE600] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50 group"
              >
                {status === "loading" ? "SENDING..." : "SEND MESSAGE"}
                {status !== "loading" && <Send className="w-8 h-8 stroke-[3] group-hover:translate-x-2 transition-transform" />}
              </button>
            </form>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}