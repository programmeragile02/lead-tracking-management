"use client";

import { Check, CheckCheck, Clock3, AlertCircle } from "lucide-react";

type WaStatus = "PENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED";

export function MessageStatusIcon({
  status,
  className = "",
}: {
  status?: WaStatus | null;
  className?: string;
}) {
  const s = status || "PENDING";

  if (s === "FAILED") {
    return <AlertCircle className={`h-3.5 w-3.5 ${className}`} />;
  }

  if (s === "PENDING") {
    return <Clock3 className={`h-3.5 w-3.5 ${className}`} />;
  }

  if (s === "SENT") {
    return <Check className={`h-3.5 w-3.5 ${className}`} />;
  }

  // DELIVERED / READ = ✓✓
  if (s === "READ") {
    // "biru" ala WhatsApp
    return <CheckCheck className={`h-3.5 w-3.5 ${className}`} />;
  }

  return <CheckCheck className={`h-3.5 w-3.5 ${className}`} />;
}
