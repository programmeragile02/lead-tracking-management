"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TaskCard } from "@/components/tasks/task-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronRightIcon,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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
type ViewMode = "list" | "calendar";

export default function TasksPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

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
        {/* Header: Switch Daftar / Kalender */}
        <div className="flex items-center justify-center md:justify-between">
          <div className="inline-flex rounded-full border bg-muted p-1.5 text-md">
            <button
              className={
                "px-3 py-1 rounded-full font-medium " +
                (viewMode === "list"
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground")
              }
              onClick={() => setViewMode("list")}
            >
              Daftar
            </button>
            <button
              className={
                "px-3 py-1 rounded-full font-medium " +
                (viewMode === "calendar"
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground")
              }
              onClick={() => setViewMode("calendar")}
            >
              Kalender
            </button>
          </div>
        </div>

        {/* View: LIST */}
        {viewMode === "list" && (
          <>
            {/* Section lead baru hari ini tanpa follow up */}
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
                    task.followUpTypeName ||
                    task.followUpTypeCode ||
                    "Follow up"
                  }
                  nextActionAt={task.nextActionAt}
                  status={task.status}
                  stageName={task.stageName || undefined}
                  statusName={task.statusName || undefined}
                />
              ))}
            </div>
          </>
        )}

        {/* View: KALENDER */}
        {viewMode === "calendar" && (
          <TaskCalendar tasks={tasks} isLoading={isLoading} />
        )}
      </div>
    </DashboardLayout>
  );
}

/* ---------------- Filter Chip ---------------- */

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

/* ------------- Untouched Leads Section ------------- */

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
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Task Calendar ---------------- */

function TaskCalendar({
  tasks,
  isLoading,
}: {
  tasks: TaskItem[];
  isLoading: boolean;
}) {
  const router = useRouter();
  const today = new Date();

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-11
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);

  type DateSummary = {
    tasks: TaskItem[];
    counts: {
      overdue: number;
      today: number;
      upcoming: number;
      total: number;
    };
  };

  // Group tasks by YYYY-MM-DD + hitung jumlah per status
  const tasksByDate = useMemo(() => {
    const map: Record<string, DateSummary> = {};
    const pad = (n: number) => n.toString().padStart(2, "0");

    for (const t of tasks) {
      const d = new Date(t.nextActionAt);
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
        d.getDate()
      )}`;
      if (!map[key]) {
        map[key] = {
          tasks: [],
          counts: { overdue: 0, today: 0, upcoming: 0, total: 0 },
        };
      }
      map[key].tasks.push(t);
      map[key].counts.total += 1;
      if (t.status === "overdue") map[key].counts.overdue += 1;
      if (t.status === "today") map[key].counts.today += 1;
      if (t.status === "upcoming") map[key].counts.upcoming += 1;
    }
    return map;
  }, [tasks]);

  const pad = (n: number) => n.toString().padStart(2, "0");
  const selectedKey =
    selectedDate &&
    `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(
      selectedDate.getDate()
    )}`;

  const selectedSummary: DateSummary | undefined =
    selectedKey && tasksByDate[selectedKey]
      ? tasksByDate[selectedKey]
      : undefined;

  const tasksForSelectedDate = selectedSummary?.tasks || [];

  // bikin grid kalender (start Senin)
  const { weeks, monthLabel } = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // 0=Sunday,...6=Saturday => ubah ke 0=Senin
    const jsDay = firstDay.getDay(); // 0-6
    const startOffset = (jsDay + 6) % 7; // 0=Mon ... 6=Sun

    const cells: { date: Date; inCurrentMonth: boolean }[] = [];

    // tanggal dari bulan sebelumnya yang “numplek” di awal
    for (let i = 0; i < startOffset; i++) {
      const d = new Date(currentYear, currentMonth, -i);
      cells.unshift({
        date: d,
        inCurrentMonth: false,
      });
    }

    // tanggal bulan ini
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        date: new Date(currentYear, currentMonth, d),
        inCurrentMonth: true,
      });
    }

    // lengkapi sampai kelipatan 7
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      cells.push({
        date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
        inCurrentMonth: false,
      });
    }

    const weeks: { date: Date; inCurrentMonth: boolean }[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }

    const monthLabel = new Date(currentYear, currentMonth, 1).toLocaleString(
      "id-ID",
      { month: "long", year: "numeric" }
    );

    return { weeks, monthLabel };
  }, [currentYear, currentMonth]);

  const goPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header kalender */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={goPrevMonth}
          className="rounded-full"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex flex-col items-center gap-1">
          <div className="text-sm font-semibold">{monthLabel}</div>
          {/* Legend status */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span>Terlambat</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Hari Ini</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              <span>Mendatang</span>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={goNextMonth}
          className="rounded-full"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Grid kalender */}
      <div className="rounded-xl border bg-card p-3 shadow-sm">
        {/* Header hari */}
        <div className="grid grid-cols-7 text-center text-[11px] font-medium text-muted-foreground mb-2">
          <div>Sen</div>
          <div>Sel</div>
          <div>Rab</div>
          <div>Kam</div>
          <div>Jum</div>
          <div>Sab</div>
          <div>Min</div>
        </div>

        <div className="space-y-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((cell, ci) => {
                const d = cell.date;
                const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
                  d.getDate()
                )}`;
                const summary = tasksByDate[key];
                const dayTasks = summary?.tasks || [];
                const counts = summary?.counts || {
                  overdue: 0,
                  today: 0,
                  upcoming: 0,
                  total: 0,
                };

                const isToday =
                  d.getFullYear() === today.getFullYear() &&
                  d.getMonth() === today.getMonth() &&
                  d.getDate() === today.getDate();
                const isSelected =
                  selectedDate &&
                  d.getFullYear() === selectedDate.getFullYear() &&
                  d.getMonth() === selectedDate.getMonth() &&
                  d.getDate() === selectedDate.getDate();

                return (
                  <button
                    key={ci}
                    onClick={() => {
                      setSelectedDate(d);
                    }}
                    className={cn(
                      "aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative transition-colors",
                      cell.inCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground/40",
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : isToday
                        ? "border border-primary/70 bg-background"
                        : dayTasks.length > 0
                        ? "bg-muted/80"
                        : "bg-background"
                    )}
                  >
                    <span className="text-[11px] md:text-[36px]">{d.getDate()}</span>

                    {/* Dot status */}
                    {dayTasks.length > 0 && (
                      <div
                        className={cn(
                          "mt-1 flex items-center gap-1",
                          isSelected ? "opacity-90" : "opacity-100"
                        )}
                      >
                        {counts.overdue > 0 && (
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        )}
                        {counts.today > 0 && (
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        )}
                        {counts.upcoming > 0 && (
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                        )}
                      </div>
                    )}

                    {/* Badge kecil jumlah total tugas di sudut */}
                    {dayTasks.length > 0 && (
                      <span
                        className={cn(
                          "absolute top-1 right-1 rounded-full px-1.5 text-[9px] font-medium",
                          isSelected
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-primary/10 text-primary"
                        )}
                      >
                        {dayTasks.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Ringkasan & list tugas untuk tanggal terpilih */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">
              Tugas tanggal{" "}
              {selectedDate
                ? selectedDate.toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "-"}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground mt-1">
              <span>{selectedSummary?.counts.total ?? 0} tugas terjadwal</span>
              {selectedSummary && selectedSummary.counts.total > 0 && (
                <>
                  {selectedSummary.counts.overdue > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      <span>{selectedSummary.counts.overdue} terlambat</span>
                    </span>
                  )}
                  {selectedSummary.counts.today > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <span>{selectedSummary.counts.today} hari ini</span>
                    </span>
                  )}
                  {selectedSummary.counts.upcoming > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-sky-500" />
                      <span>{selectedSummary.counts.upcoming} mendatang</span>
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {isLoading && (
          <p className="text-sm text-muted-foreground">Memuat tugas...</p>
        )}

        {!isLoading && tasksForSelectedDate.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Belum ada tugas di tanggal ini.
          </p>
        )}

        {!isLoading &&
          tasksForSelectedDate.map((t) => {
            const d = new Date(t.nextActionAt);
            const timeStr = d.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <button
                key={t.id}
                onClick={() => router.push(`/leads/${t.leadId}`)}
                className="w-full text-left rounded-xl border bg-card px-3 py-2.5 flex items-center justify-between gap-3 hover:bg-accent transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{t.leadName}</p>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {t.status === "overdue"
                        ? "Terlambat"
                        : t.status === "today"
                        ? "Hari Ini"
                        : "Mendatang"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {(t.productName || "-") +
                      " • " +
                      (t.followUpTypeName || t.followUpTypeCode || "Follow up")}
                  </p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" />
                    <span>{timeStr}</span>
                  </p>
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}
