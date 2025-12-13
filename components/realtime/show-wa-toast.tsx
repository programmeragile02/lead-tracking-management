import { MessageCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type WaToastPayload = {
  leadId?: number;
  leadName?: string | null;
  message?: string | null;
  from?: string | null;
};

export function showWaToast(payload: WaToastPayload) {
  const leadName = payload.leadName || "Lead";
  const message = payload.message?.trim() || "Ada pesan WhatsApp baru";

  toast({
    duration: 6000,
    className: cn(
      "border-l-4 border-l-green-500 bg-white shadow-xl",
      "hover:scale-[1.01] transition-transform cursor-pointer"
    ),
    title: (
      <div className="flex items-center gap-2">
        <span className="flex   h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-600">
          <MessageCircle className="h-4 w-4" />
        </span>
        <span className="font-semibold text-slate-900">Pesan WhatsApp</span>
      </div>
    ),
    description: (
      <div className="mt-1 space-y-1">
        <div className="text-sm font-medium text-slate-800">{leadName}</div>
        <div className="text-sm text-slate-600 line-clamp-2">{message}</div>
        <div className="inline-flex items-center gap-1 rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
          WhatsApp
        </div>
      </div>
    ),
    onClick: () => {
      if (payload.leadId) {
        window.location.href = `/leads/${payload.leadId}`;
      }
    },
  });
}
