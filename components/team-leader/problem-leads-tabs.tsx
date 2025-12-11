"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadListCard } from "@/components/leads/lead-list-card";
import type { ProblemLeadItem } from "./team-leader-dashboard-content";

interface ProblemLeadsTabsProps {
  overdue: ProblemLeadItem[];
  hotNotClosed: ProblemLeadItem[];
  untouched: ProblemLeadItem[];
}

function mapStatusCode(
  code: string | null
): "hot" | "warm" | "cold" | "new" | "close_won" | "close_lost" {
  if (!code) return "new";
  const c = code.toUpperCase();
  if (c === "HOT") return "hot";
  if (c === "WARM") return "warm";
  if (c === "COLD") return "cold";
  if (c === "CLOSE_WON") return "close_won";
  if (c === "CLOSE_LOST") return "close_lost";
  return "new";
}

function formatRelative(dateString?: string | null) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Besok";
  if (diffDays === -1) return "Kemarin";
  if (diffDays > 1) return `Dalam ${diffDays} hari`;
  return `${Math.abs(diffDays)} hari lalu`;
}

// helper umur lead
function computeLeadAgeLabel(iso: string): string {
  const created = new Date(iso);
  const now = new Date();

  const diffMs = now.getTime() - created.getTime();
  if (diffMs <= 0) return "< 1 hari";

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "< 1 hari";
  if (diffDays < 30) return `${diffDays} hari`;

  const months = Math.floor(diffDays / 30);
  const daysRemainder = diffDays % 30;

  if (daysRemainder === 0) {
    return `${months} bln`;
  }

  return `${months} bln ${daysRemainder} hari`;
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-xs text-gray-500 p-4 bg-muted/40 rounded-xl">
      Tidak ada lead {label.toLowerCase()}.
    </div>
  );
}

export function ProblemLeadsTabs({
  overdue,
  hotNotClosed,
  untouched,
}: ProblemLeadsTabsProps) {
  const totalOverdue = overdue.length;
  const totalHot = hotNotClosed.length;
  const totalUntouched = untouched.length;

  return (
    <Tabs defaultValue="overdue" className="w-full">
      <TabsList className="w-full grid grid-cols-3">
        <TabsTrigger value="overdue">
          Overdue
          {totalOverdue > 0 && (
            <span className="ml-1 inline-flex items-center justify-center rounded-full bg-red-100 text-red-700 text-[10px] px-1.5">
              {totalOverdue}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="hot">
          Hot Belum Closing
          {totalHot > 0 && (
            <span className="ml-1 inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-700 text-[10px] px-1.5">
              {totalHot}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="untouched">
          Belum Di-FU
          {totalUntouched > 0 && (
            <span className="ml-1 inline-flex items-center justify-center rounded-full bg-gray-100 text-gray-700 text-[10px] px-1.5">
              {totalUntouched}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <div className="mt-4 space-y-4">
        {/* Overdue */}
        <TabsContent value="overdue" className="space-y-3">
          {overdue.length === 0 && <EmptyState label="overdue" />}
          {overdue.map((lead) => {
            const ageLabel = computeLeadAgeLabel(lead.createdAt);

            return (
              <LeadListCard
                key={lead.id}
                leadId={lead.id}
                leadName={lead.name}
                status={mapStatusCode(lead.statusCode)}
                product={lead.productName || "-"}
                channel={lead.sourceName || "-"}
                createdDate={formatRelative(lead.createdAt)}
                leadAge={ageLabel}
                nextFollowUp={formatRelative(lead.nextActionAt ?? undefined)}
                followUpType={lead.followUpTypeName || undefined}
                indicator="overdue"
              />
            );
          })}
        </TabsContent>

        {/* Hot not closed */}
        <TabsContent value="hot" className="space-y-3">
          {hotNotClosed.length === 0 && (
            <EmptyState label="hot belum closing" />
          )}
          {hotNotClosed.map((lead) => {
            const ageLabel = computeLeadAgeLabel(lead.createdAt);

            return (
              <LeadListCard
                key={lead.id}
                leadId={lead.id}
                leadName={lead.name}
                status={mapStatusCode(lead.statusCode)}
                product={lead.productName || "-"}
                channel={lead.sourceName || "-"}
                createdDate={formatRelative(lead.createdAt)}
                leadAge={ageLabel}
                nextFollowUp={formatRelative(lead.nextActionAt ?? undefined)}
                followUpType={lead.followUpTypeName || undefined}
                indicator={lead.nextActionAt ? "due-today" : "updated"}
              />
            );
          })}
        </TabsContent>

        {/* Untouched */}
        <TabsContent value="untouched" className="space-y-3">
          {untouched.length === 0 && <EmptyState label="belum di-follow up" />}
          {untouched.map((lead) => {
            const ageLabel = computeLeadAgeLabel(lead.createdAt);

            return (
              <LeadListCard
                key={lead.id}
                leadId={lead.id}
                leadName={lead.name}
                status={mapStatusCode(lead.statusCode)}
                product={lead.productName || "-"}
                channel={lead.sourceName || "-"}
                createdDate={formatRelative(lead.createdAt)}
                leadAge={ageLabel}
                indicator="normal"
              />
            );
          })}
        </TabsContent>
      </div>
    </Tabs>
  );
}
