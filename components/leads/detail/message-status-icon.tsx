"use client";

import { Check, CheckCheck, Clock3, AlertCircle } from "lucide-react";

type WaStatus = "PENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED";

interface Props {
  status?: WaStatus | null;
  className?: string;
}

export function MessageStatusIcon({ status, className = "" }: Props) {
  const s: WaStatus = status || "PENDING";

  const base = "h-3.5 w-3.5 shrink-0 transition-colors duration-150";

  switch (s) {
    case "FAILED":
      return <AlertCircle className={`${base} text-rose-500 ${className}`} />;

    case "PENDING":
      return <Clock3 className={`${base} text-slate-400 ${className}`} />;

    case "SENT":
      return <Check className={`${base} text-slate-400 ${className}`} />;

    case "DELIVERED":
      return <CheckCheck className={`${base} text-slate-400 ${className}`} />;

    case "READ":
      return <CheckCheck className={`${base} text-[#53BDEB] ${className}`} />;

    default:
      return null;
  }
}
