"use client";

import { useEffect } from "react";
import { io as ioClient } from "socket.io-client";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-current-user";

export function RealtimeListener() {
  const { toast } = useToast();
  const { user, loading } = useCurrentUser();

  const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3016";

  useEffect(() => {
    if (loading) return;
    if (!user?.id) return;

    const s = ioClient(SOCKET_URL, { transports: ["websocket"] });

    s.on("connect", () => {
      s.emit("join", { userId: user.id });
    });

    s.on("wa_notify", (payload) => {
      toast({
        title: payload?.leadName
          ? `Pesan masuk: ${payload.leadName}`
          : "Pesan WhatsApp masuk",
        description: payload?.message || "Ada pesan baru",
      });
    });

    return () => {
      s.emit("leave", { userId: user.id });
      s.disconnect();
    };
  }, [SOCKET_URL, user?.id, loading, toast]);

  return null;
}
