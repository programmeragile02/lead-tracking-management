"use client";

import {
  CheckCircle,
  Lightbulb,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StageInsightProps = {
  loading?: boolean;
  currentStage: string;
  suggestedStage?: string | null;
  confidence?: number; // 0 - 1
  reasons?: string[];
  onApply?: () => void;
  onDismiss?: () => void;
};

export function StageInsightCard({
  loading = false,
  currentStage,
  suggestedStage,
  confidence = 0,
  reasons = [],
  onApply,
  onDismiss,
}: StageInsightProps) {
  if (!suggestedStage || suggestedStage === currentStage) return null;

  const confidencePercent = Math.round(confidence * 100);

  const tone =
    confidence >= 0.75 ? "success" : confidence >= 0.5 ? "warning" : "neutral";

  const toneColor =
    tone === "success"
      ? "border-green-500 bg-green-50"
      : tone === "warning"
      ? "border-yellow-400 bg-yellow-50"
      : "border-slate-300 bg-slate-50";

  const toneText =
    tone === "success"
      ? "text-green-700"
      : tone === "warning"
      ? "text-yellow-700"
      : "text-slate-600";

  return (
    <div className={cn("rounded-xl border p-4 transition-all", toneColor)}>
      <div className="flex items-start gap-3">
        <div className="mt-1">
          {tone === "success" ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <Lightbulb className="h-5 w-5 text-yellow-600" />
          )}
        </div>

        <div className="flex-1 space-y-1">
          <p className="text-sm font-semibold text-slate-800">
            Rekomendasi Tahapan
          </p>

          <p className="text-sm text-slate-600">
            Sistem menyarankan untuk menaikkan tahap ke{" "}
            <span className="font-semibold">{suggestedStage}</span>
          </p>

          {reasons?.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
              {reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex items-center gap-3">
            <span className={cn("text-xs font-medium", toneText)}>
              Confidence: {confidencePercent}%
            </span>

            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="secondary" onClick={onDismiss}>
                Abaikan
              </Button>

              <Button
                size="sm"
                onClick={onApply}
                className="flex items-center gap-1"
              >
                Terapkan
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}