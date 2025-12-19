"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-current-user";

const WA_TOAST_KEY = "wa-toast-shown";
const RETRY_DELAY = 2000; // 2 detik

export function useAutoCheckWhatsApp() {
  const { user, loading } = useCurrentUser();
  const { toast } = useToast();

  const ranRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (ranRef.current) return;
    if (loading) return;
    if (!user || user.roleSlug !== "sales") return;

    ranRef.current = true;

    async function check() {
      try {
        const res = await fetch("/api/whatsapp/qr", {
          method: "GET",
          cache: "no-store",
        });

        const data = await res.json();
        if (!res.ok || !data.ok) return;

        const status = data.status;
        const lastShown = sessionStorage.getItem(WA_TOAST_KEY);

        // ===== INIT (sementara) =====
        if (status === "INIT") {
          if (lastShown !== "INIT") {
            toast({
              title: "Menyiapkan WhatsApp",
              description: "Mohon tunggu sebentar…",
            });
            sessionStorage.setItem(WA_TOAST_KEY, "INIT");
          }

          // SELALU retry sampai keluar dari INIT
          timerRef.current = setTimeout(check, RETRY_DELAY);
          return;
        }

        // ===== PENDING QR =====
        if (status === "PENDING_QR") {
          if (lastShown !== "PENDING_QR") {
            toast({
              title: "WhatsApp belum terhubung",
              description: "Silahkan sinkronisasi WhatsApp",
            });
            sessionStorage.setItem(WA_TOAST_KEY, "PENDING_QR");
          }
          return;
        }

        // ===== CONNECTED =====
        if (status === "CONNECTED") {
          if (lastShown !== "CONNECTED") {
            toast({
              title: "WhatsApp terhubung",
              description: "Siap chat dengan lead 🚀",
            });
            sessionStorage.setItem(WA_TOAST_KEY, "CONNECTED");
          }
          return;
        }

        // ===== ERROR / DISCONNECTED =====
        if (status === "DISCONNECTED" || status === "ERROR") {
          if (lastShown !== status) {
            toast({
              title: "WhatsApp terputus",
              description: "Silahkan hubungkan ulang",
              variant: "destructive",
            });
            sessionStorage.setItem(WA_TOAST_KEY, status);
          }
        }
      } catch (err) {
        console.error("auto WA check error:", err);
      }
    }

    check();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [user, loading, toast]);
}
