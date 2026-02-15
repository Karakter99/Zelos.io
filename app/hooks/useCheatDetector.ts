"use client";

import { useEffect, useState } from "react";
import { supabase } from "../utils/Supabase/client";

export function useCheatDetector(studentId: string | null) {
  const [isDetention, setIsDetention] = useState(false);
  const [detentionEndTime, setDetentionEndTime] = useState<Date | null>(null);

  useEffect(() => {
    if (!studentId) return;

    // 1. The Trap Logic
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        console.log("🚨 Cheating Detected: Tab Switched");
        triggerDetention("tab_switch");
      }
    };

    const handleBlur = async () => {
      console.log("🚨 Cheating Detected: Window Lost Focus");
      triggerDetention("window_blur");
    };

    // 2. The Punishment Function
    const triggerDetention = async (reason: string) => {
      // Calculate 5 minutes from now
      const newEndTime = new Date(Date.now() + 5 * 60 * 1000);

      setIsDetention(true);
      setDetentionEndTime(newEndTime);

      // Send to Database immediately
      await supabase
        .from("students")
        .update({
          status: "detention",
          detention_end_time: newEndTime.toISOString(),
        })
        .eq("id", studentId);

      // Log the crime
      await supabase.from("detention_logs").insert({
        student_id: studentId,
        violation_type: reason,
      });
    };

    // 3. Attach Listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    // 4. Real-time Subscription (Listen for "Redemption" updates)
    interface StudentPayload {
      new: {
        status: string;
        detention_end_time: string;
      };
    }

    const channel = supabase
      .channel(`student-${studentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "students",
          filter: `id=eq.${studentId}`,
        },
        (payload: StudentPayload) => {
          const newStatus = payload.new.status;
          const newEndTime = payload.new.detention_end_time;

          if (newStatus === "active") {
            setIsDetention(false); // Free to go!
          } else if (newStatus === "detention") {
            setIsDetention(true);
            setDetentionEndTime(new Date(newEndTime));
          }
        },
      )
      .subscribe();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  return { isDetention, detentionEndTime };
}
