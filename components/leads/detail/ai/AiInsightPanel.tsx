"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

type AiPriority = "HIGH" | "MEDIUM" | "LOW";
type AiTone = "FRIENDLY" | "PROFESSIONAL" | "CLOSING";
type AiStatusHint = "COLD" | "WARM" | "HOT" | "UNKNOWN";

type WhatsAppAiAnalysis = {
  summary: string;
  leadIntent: string;
  objections?: string[];
  missingInfo?: string[];
  nextActions: { title: string; detail: string; priority: AiPriority }[];
  suggestedReplies: { tone: AiTone; text: string }[];
  statusHint: AiStatusHint;
};

interface Props {
  aiData: WhatsAppAiAnalysis | null;
  aiLoading: boolean;
  aiCached: boolean;
  aiError: string | null;

  onAnalyze: (limit: number) => void;
  onCopy: (text: string) => void;

  priorityBadgeClass: (p: AiPriority) => string;
}

export function AiInsightPanel({
  aiData,
  aiCached,
  aiError,
  onCopy,
  priorityBadgeClass,
}: Props) {
  return (
    <div className="mt-3 rounded-md border bg-muted/30 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm md:text-base font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-500" />
          Insight & Balasan AI
        </p>
      </div>

      {aiCached && (
        <p className="text-[11px] text-muted-foreground">
          * Hasil dari cache (chat belum berubah).
        </p>
      )}

      {aiError ? (
        <div className="rounded-md border bg-rose-50 p-2 text-[11px] text-rose-700">
          {aiError}
        </div>
      ) : null}

      {!aiData ? (
        <div className="rounded-md border bg-muted/40 p-2 text-[11px] text-muted-foreground">
          Klik <b>Analisis</b> untuk mendapatkan ringkasan percakapan + tindakan
          yang disarankan.
        </div>
      ) : (
        <div className="space-y-3">
          {/* Ringkasan */}
          <div className="rounded-md border bg-background/70 p-2">
            <p className="text-[11px] text-muted-foreground font-semibold mb-1">
              Ringkasan
            </p>
            <p className="text-[12px] leading-relaxed whitespace-pre-line">
              {aiData.summary}
            </p>
          </div>

          {/* Intent */}
          <div className="rounded-md border bg-background/70 p-2">
            <p className="text-[11px] text-muted-foreground font-semibold mb-1">
              Intent Lead
            </p>
            <p className="text-[12px]">{aiData.leadIntent}</p>
          </div>

          {/* Tindakan */}
          <div className="rounded-md border bg-background/70 p-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] text-muted-foreground font-semibold">
                Tindakan Disarankan
              </p>
              <Badge variant="outline" className="text-[10px]">
                {aiData.nextActions?.length ?? 0} items
              </Badge>
            </div>

            <div className="space-y-2">
              {aiData.nextActions?.slice(0, 5).map((a, idx) => (
                <div key={idx} className="rounded-md border bg-muted/30 p-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[12px] font-semibold">{a.title}</p>
                    <Badge
                      className={`text-[10px] ${priorityBadgeClass(
                        a.priority
                      )}`}
                    >
                      {a.priority}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground whitespace-pre-line">
                    {a.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Draft Balasan */}
          <div className="rounded-md border bg-background/70 p-2">
            <p className="text-[11px] text-muted-foreground font-semibold mb-2">
              Draft Balasan WA
            </p>

            <div className="space-y-2">
              {aiData.suggestedReplies?.slice(0, 3).map((r, idx) => (
                <div key={idx} className="rounded-md border bg-muted/30 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {r.tone}
                    </Badge>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => onCopy(r.text)}
                    >
                      Copy
                    </Button>
                  </div>

                  <p className="mt-2 text-[12px] whitespace-pre-line leading-relaxed">
                    {r.text}
                  </p>
                </div>
              ))}

              {/* Optional: Objections & Missing Info */}
              {aiData.objections?.length || aiData.missingInfo?.length ? (
                <div className="rounded-md border bg-background/70 p-2 space-y-2">
                  {aiData.objections?.length ? (
                    <div>
                      <p className="text-[11px] text-muted-foreground font-semibold">
                        Keberatan
                      </p>
                      <ul className="mt-1 list-disc pl-4 text-[11px] text-muted-foreground">
                        {aiData.objections.slice(0, 4).map((x, i) => (
                          <li key={i}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {aiData.missingInfo?.length ? (
                    <div>
                      <p className="text-[11px] text-muted-foreground font-semibold">
                        Info yang Perlu Digali
                      </p>
                      <ul className="mt-1 list-disc pl-4 text-[11px] text-muted-foreground">
                        {aiData.missingInfo.slice(0, 4).map((x, i) => (
                          <li key={i}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
