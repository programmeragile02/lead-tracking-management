"use client";

import { useEffect } from "react";
import { io as ioClient } from "socket.io-client";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RealtimeListener() {
  const { toast } = useToast();
  const { user, loading } = useCurrentUser();
  const router = useRouter();

  const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3016";

  useEffect(() => {
    if (loading || !user?.id) return;

    const s = ioClient(SOCKET_URL, { transports: ["websocket"] });

    s.on("connect", () => {
      s.emit("join", { userId: user.id });
    });

    s.on("wa_notify", (payload) => {
      const {
        leadId,
        leadName = "Lead",
        message = "Pesan baru masuk",
        from,
        at,
      } = payload || {};

      toast({
        duration: 5000,
        className: "toast-wa",
        description: (
          <div className="w-full min-w-0 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2 font-semibold">
              <MessageCircle className="h-4 w-4 text-emerald-500" />
              <span>Pesan Baru</span>
            </div>

            {/* Lead info */}
            <div className="flex items-start gap-3 w-full min-w-0">
              {/* Avatar */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-semibold text-emerald-600">
                {leadName.charAt(0).toUpperCase()}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className=" font-medium truncate">{leadName}</p>

                  {at && (
                    <span className=" text-muted-foreground whitespace-nowrap">
                      • {formatTime(at)}
                    </span>
                  )}
                </div>

                <p className="mt-0.5 text-muted-foreground line-clamp-2">
                  {message}
                </p>
              </div>
            </div>

            {/* CTA */}
            {leadId && (
              <Button
                size="sm"
                className="w-full bg-primary"
                onClick={() => router.push(`/leads/${leadId}?tab=whatsapp`)}
              >
                Buka Lead
              </Button>
            )}
          </div>
        ),
      });
    });

    return () => {
      s.emit("leave", { userId: user.id });
      s.disconnect();
    };
  }, [SOCKET_URL, user?.id, loading, toast, router]);

  return null;
}
