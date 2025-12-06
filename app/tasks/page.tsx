"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TaskCard } from "@/components/tasks/task-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

type TaskStatus = "overdue" | "today" | "upcoming";

type TaskItem = {
  id: number; // followup id
  followUpId: number;
  leadId: number;
  leadName: string;
  productName: string | null;
  followUpTypeCode: string | null;
  followUpTypeName: string | null;
  nextActionAt: string;
  status: TaskStatus;
  stageName?: string | null;
  statusName?: string | null;
};

type UntouchedLeadItem = {
  leadId: number;
  leadName: string;
  productName: string | null;
  createdAt: string;
  stageName?: string | null;
  statusName?: string | null;
};

type ApiData = {
  tasks: TaskItem[];
  untouchedLeads: UntouchedLeadItem[];
};

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .then((json) =>
      json.ok ? (json.data as ApiData) : { tasks: [], untouchedLeads: [] }
    );

type FilterTab = "all" | "today" | "overdue" | "upcoming";

export default function TasksPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const { data, isLoading } = useSWR<ApiData>("/api/tasks", fetcher);

  const tasks = data?.tasks ?? [];
  const untouchedLeads = data?.untouchedLeads ?? [];

  const { todayCount, overdueCount, upcomingCount } = useMemo(() => {
    let today = 0;
    let overdue = 0;
    let upcoming = 0;

    for (const t of tasks) {
      if (t.status === "today") today++;
      else if (t.status === "overdue") overdue++;
      else if (t.status === "upcoming") upcoming++;
    }

    return {
      todayCount: today,
      overdueCount: overdue,
      upcomingCount: upcoming,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (activeFilter === "all") return tasks;
    if (activeFilter === "today") {
      return tasks.filter((t) => t.status === "today");
    }
    if (activeFilter === "overdue") {
      return tasks.filter((t) => t.status === "overdue");
    }
    if (activeFilter === "upcoming") {
      return tasks.filter((t) => t.status === "upcoming");
    }
    return tasks;
  }, [tasks, activeFilter]);

  return (
    <DashboardLayout title="Tugas" role="sales">
      <div className="space-y-4">
        {/* Section lead baru hari ini tanpa follow up tetap seperti sebelumnya */}
        {untouchedLeads.length > 0 && (
          <UntouchedLeadsSection leads={untouchedLeads} />
        )}

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <FilterChip
            label="Semua"
            active={activeFilter === "all"}
            onClick={() => setActiveFilter("all")}
            count={tasks.length}
          />
          <FilterChip
            label="Hari Ini"
            active={activeFilter === "today"}
            onClick={() => setActiveFilter("today")}
            count={todayCount}
          />
          <FilterChip
            label="Terlambat"
            active={activeFilter === "overdue"}
            onClick={() => setActiveFilter("overdue")}
            count={overdueCount}
          />
          <FilterChip
            label="Mendatang"
            active={activeFilter === "upcoming"}
            onClick={() => setActiveFilter("upcoming")}
            count={upcomingCount}
          />
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {isLoading && (
            <p className="text-sm text-muted-foreground">Memuat tugas...</p>
          )}

          {!isLoading && filteredTasks.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Belum ada tugas untuk filter ini.
            </p>
          )}

          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              followUpId={task.followUpId}
              leadId={task.leadId}
              leadName={task.leadName}
              product={task.productName || "-"}
              followUpType={
                task.followUpTypeName || task.followUpTypeCode || "Follow up"
              }
              nextActionAt={task.nextActionAt}
              status={task.status}
              stageName={task.stageName || undefined}
              statusName={task.statusName || undefined}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  const shownCount = count ?? 0;

  return (
    <button
      onClick={onClick}
      className={
        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border inline-flex items-center gap-2 " +
        (active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-muted text-foreground border-transparent")
      }
    >
      <span>{label}</span>
      <span
        className={
          "min-w-[1.5rem] h-6 rounded-full text-xs flex items-center justify-center " +
          (active
            ? "bg-primary-foreground/20 text-primary-foreground"
            : "bg-background text-muted-foreground")
        }
      >
        {shownCount}
      </span>
    </button>
  );
}

function UntouchedLeadsSection({ leads }: { leads: UntouchedLeadItem[] }) {
  const router = useRouter();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Lead baru hari ini</p>
          <p className="text-xs text-muted-foreground">
            Belum pernah ada follow up, cocok buat kontak awal.
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {leads.length} lead
        </Badge>
      </div>

      <div className="space-y-2">
        {leads.map((lead) => {
          const created = new Date(lead.createdAt);
          const timeStr = created.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={lead.leadId}
              className="rounded-xl border bg-card px-3 py-2.5 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">
                    {lead.leadName}
                  </p>
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase tracking-wide"
                  >
                    Belum ada follow up
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {(lead.productName || "-") +
                    (lead.stageName ? ` • Tahap: ${lead.stageName}` : "") +
                    (lead.statusName ? ` • Status: ${lead.statusName}` : "")}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Dibuat {timeStr}
                </p>
              </div>

              <Button
                size="icon"
                variant="ghost"
                className="shrink-0"
                onClick={() => router.push(`/leads/${lead.leadId}`)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
