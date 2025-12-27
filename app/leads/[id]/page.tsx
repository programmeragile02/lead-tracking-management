"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useParams } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import {
  Sparkles,
  CheckCircle2,
  Clock3,
  Loader2,
  FileText,
  GitBranch,
  Activity,
  CalendarClock,
  Package,
  Wallet,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { io as ioClient } from "socket.io-client";
import { WhatsAppChatCard } from "@/components/leads/detail/whatsapp/whatsapp-chat-card";
import { QuickMessageDialog } from "@/components/leads/detail/whatsapp/quick-message-dialog";
import { EditTemplateDialog } from "@/components/leads/detail/whatsapp/edit-template-dialog";
import { SaveToTemplateDialog } from "@/components/leads/detail/whatsapp/save-to-template-dialog";
import { OverviewTab } from "@/components/leads/detail/overview/overview-tab";
import { FollowUpScheduleDialog } from "@/components/leads/detail/modals/FollowUpScheduleDialog";
import { ProposalDialog } from "@/components/leads/detail/modals/ProposalDialog";
import { ActivityDialog } from "@/components/leads/detail/modals/ActivityDialog";
import { ActivityPreviewDialog } from "@/components/leads/detail/modals/ActivityPreviewDialog";
import { PriceDialog } from "@/components/leads/detail/modals/PriceDialog";
import { AiInsightPanel } from "@/components/leads/detail/ai/AiInsightPanel";
import { InfoItem } from "@/components/leads/detail/info-item";
import { LeadActionFab } from "@/components/leads/detail/lead-action-fab";
import { StatusModal } from "@/components/leads/detail/status-modal";
import { StageModal } from "@/components/leads/detail/stage-modal";
import { QuickStagePanel } from "@/components/leads/detail/QuickStagePanel";
import { PriceItem } from "@/components/leads/detail/price-item";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getStatusClass } from "@/lib/lead-status";
import { cn } from "@/lib/utils";
import { SubStatusModal } from "@/components/leads/detail/sub-status-modal";
import { LeadNotesDrawer } from "@/components/leads/detail/notes/LeadNotesDrawer";

type ChatFrom = "client" | "sales";
type SentByRole = "sales" | "team-leader" | "manager" | null;

interface ChatMessageUi {
  id: string | number;
  from: ChatFrom;
  sentByRole?: SentByRole;
  sentByName?: string | null;
  text: string;
  time: string;
  waStatus?: "PENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED" | null;
  type?: "TEXT" | "MEDIA";
  mediaUrl?: string | null;
  mediaName?: string | null;
  mediaMime?: string | null;
}

interface StageWithMeta {
  id: number;
  code: string;
  label: string;
  startedAt?: string | null;
  doneAt?: string | null;
  mode?: "NORMAL" | "SKIPPED" | null;
}

interface LeadDetailResponse {
  ok: boolean;
  data?: {
    lead: any;
    products: { id: number; name: string }[];
    statuses: { id: number; name: string; code: string }[];
    stages: { id: number; name: string; code: string }[];
    stageHistory: {
      id: number;
      stageId: number;
      createdAt: string;
      doneAt: string | null;
      mode: "NORMAL" | "SKIPPED";
      stage: { id: number; name: string; code: string };
    }[];
    statusHistory: {
      id: number;
      statusId: number;
      createdAt: string;
      status: { id: number; name: string; code: string };
    }[];
    profileCompletion: number;
    dynamicFields: any[];
    followUpTypes: {
      id: number;
      code: string; // "FU1", "KIRIM_PENAWARAN", ...
      name: string; // "Follow Up 1", "Kirim Penawaran", ...
      order: number;
      isActive: boolean;
    }[];
  };
}

interface LeadMessagesResponse {
  ok: boolean;
  data?: {
    id: number;
    content: string;
    direction: "INBOUND" | "OUTBOUND";
    createdAt: string;
    waStatus?: "PENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED" | null;
    sentAt?: string | null;
    deliveredAt?: string | null;
    readAt?: string | null;
    type?: "TEXT" | "MEDIA";
    mediaUrl?: string | null;
    mediaName?: string | null;
    mediaMime?: string | null;
  }[];
}

interface LeadFollowUpItem {
  id: number;
  typeId: number | null;
  typeCode: string | null;
  typeName: string | null;
  channel: "WHATSAPP" | "CALL" | "ZOOM" | "VISIT";
  note?: string | null;
  doneAt: string | null;
  nextActionAt?: string | null;
  createdAt: string;
  sales?: {
    id: number;
    name: string;
  } | null;
}

interface LeadFollowUpsResponse {
  ok: boolean;
  data?: LeadFollowUpItem[];
}

interface LeadActivityApiItem {
  id: number;
  title: string;
  description: string | null;
  happenedAt: string;
  createdAt: string;
  photoUrl?: string | null;
  createdBy: { id: number; name: string } | null;
}

interface LeadActivitiesResponse {
  ok: boolean;
  data?: LeadActivityApiItem[];
}

type ActivityKind = "FOLLOW_UP" | "STAGE" | "STATUS" | "ACTIVITY";

interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  description: string;
  at: string; // ISO
  photoUrl?: string | null;
  createdByName?: string | null;
}

type LeadFieldTypeUi =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "DATE"
  | "SINGLE_SELECT"
  | "MULTI_SELECT";

type DynamicField = {
  id: number;
  key: string;
  label: string;
  type: LeadFieldTypeUi;
  isRequired: boolean;
  options?: { value: string; label: string }[];
  value?: string | null; // string / JSON (multi select)
};

type PriceKind = "OFFERING" | "NEGOTIATION" | "CLOSING";

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

type WaClientStatus =
  | "INIT"
  | "PENDING_QR"
  | "CONNECTED"
  | "DISCONNECTED"
  | "ERROR";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatCurrencyIDR(value?: number | string | null) {
  if (value === null || value === undefined || value === "") return "-";

  const n = typeof value === "string" ? Number(value) : value;

  if (Number.isNaN(n)) return String(value);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

// untuk mask input: "12000000" -> "12.000.000"
function formatRupiahInput(value: string): string {
  // ambil hanya angka
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";

  // tambahkan titik tiap 3 digit dari belakang
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// untuk ambil angka mentah: "12.000.000" -> 12000000
function parseRupiahToNumber(value: string): number {
  const digits = value.replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits);
}

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const leadId = params.id;
  const { toast } = useToast();

  const { user } = useCurrentUser();
  const isSales = user?.roleSlug === "sales";
  const isTeamLeader = user?.roleSlug === "team-leader";
  const isManager = user?.roleSlug === "manager";

  const {
    data: detailRes,
    isLoading: detailLoading,
    mutate: mutateDetail,
  } = useSWR<LeadDetailResponse>(`/api/leads/${leadId}/detail`, fetcher);

  const {
    data: messagesRes,
    isLoading: messagesLoading,
    mutate: mutateMessages,
  } = useSWR<LeadMessagesResponse>(`/api/leads/${leadId}/messages`, fetcher, {
    refreshInterval: 10000,
  });

  const {
    data: followUpsRes,
    isLoading: followUpsLoading,
    mutate: mutateFollowUps,
  } = useSWR<LeadFollowUpsResponse>(`/api/leads/${leadId}/followups`, fetcher);

  const {
    data: activitiesRes,
    isLoading: activitiesLoading,
    mutate: mutateActivities,
  } = useSWR<LeadActivitiesResponse>(
    `/api/leads/${leadId}/activities`,
    fetcher
  );

  const {
    data: aiCacheRes,
    isLoading: aiCacheLoading,
    mutate: mutateAiCache,
  } = useSWR<{
    ok: boolean;
    data: WhatsAppAiAnalysis | null;
    cached?: boolean;
  }>(leadId ? `/api/leads/${leadId}/whatsapp/ai-analysis` : null, fetcher);

  const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3016";

  useEffect(() => {
    if (!leadId) return;

    const s = ioClient(SOCKET_URL, { transports: ["websocket"] });
    s.emit("join", { leadId: Number(leadId) });

    s.on("wa_inbound", () => mutateMessages());
    s.on("wa_receipt", () => mutateMessages());
    s.on("wa_outbound_created", () => {
      mutateMessages();
      mutateActivities();
      mutateDetail();
    });

    return () => {
      s.emit("leave", { leadId: Number(leadId) });
      s.disconnect();
    };
  }, [leadId, mutateMessages]);

  const lead = detailRes?.data?.lead;
  const products = detailRes?.data?.products ?? [];
  const stagesRaw = detailRes?.data?.stages ?? [];
  const stageHistory = detailRes?.data?.stageHistory ?? [];
  const statusHistory = detailRes?.data?.statusHistory ?? [];
  const followUpTypes = detailRes?.data?.followUpTypes ?? [];
  const profileCompletion = detailRes?.data?.profileCompletion ?? 0;
  const statuses = detailRes?.data?.statuses ?? [];
  const salesName = lead?.sales?.name ?? null;

  function getStatusNameById(id: number | null) {
    if (!id) return "";
    return statuses.find((s) => s.id === id)?.name || "";
  }

  const followUps = followUpsRes?.data ?? [];
  const lastFollowUp = followUps[0] ?? null;

  // ==== STATUS ====
  const [statusId, setStatusId] = useState<number | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    setStatusId(lead?.statusId ?? null);
  }, [lead?.statusId]);

  async function updateStatus(nextStatusId: number) {
    if (!leadId) return;

    const statusName = getStatusNameById(nextStatusId);

    try {
      setStatusUpdating(true);

      const res = await fetch(`/api/leads/${leadId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statusId: nextStatusId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal mengubah status");
      }

      await mutateDetail();

      toast({
        title: "Status berhasil diubah",
        description: statusName
          ? `Status lead diubah ke "${statusName}"`
          : "Status lead berhasil diperbarui.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal mengubah status",
        description: err?.message || "Terjadi kesalahan.",
      });
    } finally {
      setStatusUpdating(false);
    }
  }

  const handleQuickStatus = (nextStatusId: number) => {
    setStatusId(nextStatusId); // optimistic
    void updateStatus(nextStatusId);
  };

  // ==== STAGE / TAHAPAN ====

  const stages: StageWithMeta[] = useMemo(() => {
    // ambil history TERAKHIR per stage (berdasarkan createdAt desc)
    const lastByStage = new Map<
      number,
      { createdAt: string; doneAt: string | null; mode: any }
    >();

    const sorted = [...stageHistory].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    for (const h of sorted) {
      if (!lastByStage.has(h.stageId)) {
        lastByStage.set(h.stageId, {
          createdAt: h.createdAt,
          doneAt: (h as any).doneAt ?? null,
          mode: (h as any).mode ?? "NORMAL",
        });
      }
    }

    return stagesRaw.map((s) => {
      const meta = lastByStage.get(s.id);
      return {
        id: s.id,
        code: s.code,
        label: s.name,
        startedAt: meta?.createdAt ?? null,
        doneAt: meta?.doneAt ?? null,
        mode: meta?.mode ?? null,
      };
    });
  }, [stagesRaw, stageHistory]);

  const currentStageId: number | undefined =
    lead?.stageId ?? stages[0]?.id ?? undefined;

  const currentStage =
    stages.find((s) => s.id === currentStageId) ?? stages[0] ?? undefined;

  const [stageUpdating, setStageUpdating] = useState(false);
  const [timelineExpanded, setTimelineExpanded] = useState(false);

  async function moveToStage(targetStageId: number) {
    try {
      setStageUpdating(true);
      const res = await fetch(`/api/leads/${leadId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId: targetStageId }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal mengubah tahapan");
      }
      await mutateDetail();
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Gagal mengubah tahapan",
        description: err?.message || "Terjadi kesalahan.",
      });
    } finally {
      setStageUpdating(false);
    }
  }

  function handleGoToNextStage() {
    if (!currentStage || stages.length === 0) return;
    const idx = stages.findIndex((s) => s.id === currentStage.id);
    const next = stages[idx + 1];
    if (!next) return; // sudah tahap terakhir
    void moveToStage(next.id);
  }

  // tombol "Tandai selesai"
  async function handleStageDone() {
    if (!currentStageId) return;

    // 1) checklist selesai tahap aktif
    await markStageDone(currentStageId, "NORMAL");

    // 2) lanjut ke tahap berikutnya
    handleGoToNextStage();
  }

  // ==== FOLLOW UP (REAL, pakai master) ====

  const [followUpTypeCode, setFollowUpTypeCode] = useState<string>("");

  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("");
  const [followUpChannel, setFollowUpChannel] = useState<
    "wa" | "call" | "zoom" | "visit"
  >("wa");
  const [followUpNote, setFollowUpNote] = useState("");
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [savingFollowUp, setSavingFollowUp] = useState(false);

  // pilih default: FU1 kalau ada, kalau nggak, pakai pertama
  useEffect(() => {
    if (!followUpTypes.length) return;

    setFollowUpTypeCode((prev) => {
      if (prev) return prev;
      const fu1 = followUpTypes.find((t) => t.code === "FU1");
      return fu1?.code || followUpTypes[0].code;
    });
  }, [followUpTypes]);

  // auto step suggestion: kalau terakhir FU1 → suggest FU2, dst
  useEffect(() => {
    if (!lastFollowUp || !followUpTypes.length) return;

    const orderMap = new Map(
      followUpTypes.map((t) => [t.code, t.order] as const)
    );
    const lastOrder = orderMap.get(lastFollowUp.typeCode || "");
    if (lastOrder == null) return;

    const next = followUpTypes.find((t) => t.order === lastOrder + 1);
    if (next) {
      setFollowUpTypeCode(next.code);
    }

    // prefill tanggal & jam dari nextActionAt kalau ada
    if (lastFollowUp.nextActionAt) {
      const d = new Date(lastFollowUp.nextActionAt);
      const y = d.getFullYear();
      const m = `${d.getMonth() + 1}`.padStart(2, "0");
      const day = `${d.getDate()}`.padStart(2, "0");
      const hh = `${d.getHours()}`.padStart(2, "0");
      const mm = `${d.getMinutes()}`.padStart(2, "0");
      setFollowUpDate(`${y}-${m}-${day}`);
      setFollowUpTime(`${hh}:${mm}`);
    }
  }, [lastFollowUp?.id, followUpTypes]);

  function getFollowUpTypeLabel(code?: string | null) {
    if (!code) return "-";
    const t = followUpTypes.find((x) => x.code === code);
    return t?.name || code;
  }

  function followUpChannelLabel(ch: "wa" | "call" | "zoom" | "visit" | string) {
    switch (ch) {
      case "wa":
        return "WhatsApp";
      case "call":
        return "Telepon";
      case "zoom":
        return "Zoom";
      case "visit":
        return "Kunjungan";
      default:
        return ch.toUpperCase();
    }
  }

  async function handleSaveFollowUp() {
    if (!leadId) return;
    if (!followUpTypeCode || !followUpDate || !followUpTime) {
      toast({
        variant: "destructive",
        title: "Data belum lengkap",
        description: "Step tindak lanjut, tanggal, dan jam harus diisi.",
      });
      return;
    }

    try {
      setSavingFollowUp(true);
      const res = await fetch(`/api/leads/${leadId}/followups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typeCode: followUpTypeCode,
          date: followUpDate,
          time: followUpTime,
          channel: followUpChannel,
          note: followUpNote || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal menyimpan tindak lanjut");
      }

      toast({
        title: "Tindak lanjut tersimpan",
        description:
          "Jadwal follow up berhasil disimpan dan tercatat di aktivitas.",
      });

      setScheduleModalOpen(false);
      setFollowUpNote("");
      await Promise.all([
        mutateFollowUps(),
        mutateActivities(),
        mutateDetail(),
      ]);
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Gagal menyimpan tindak lanjut",
        description: err?.message || "Terjadi kesalahan.",
      });
    } finally {
      setSavingFollowUp(false);
    }
  }

  // ==== CHAT WA ====
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);

  const chatMessages: ChatMessageUi[] = useMemo(() => {
    if (!messagesRes?.ok || !messagesRes.data) return [];

    return messagesRes.data.map((m) => {
      const timeBase =
        m.readAt ||
        m.deliveredAt ||
        m.sentAt ||
        m.createdAt ||
        new Date().toISOString();

      return {
        id: m.id,
        from: m.direction === "OUTBOUND" ? "sales" : "client",
        sentByRole: m.sentByRole ?? null,
        sentByName: m.sentBy?.name ?? null,
        text: m.content,
        time: formatTime(timeBase),
        waStatus: m.waStatus ?? "PENDING",
        type: m.type ?? "TEXT",
        mediaUrl: m.mediaUrl,
        mediaName: m.mediaName,
        mediaMime: m.mediaMime,
      };
    });
  }, [messagesRes]);

  const chatWrapRef = useRef<HTMLDivElement | null>(null);

  function scrollChatToBottom(behavior: ScrollBehavior = "smooth") {
    const el = chatWrapRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }

  // scroll saat pertama load & saat ada pesan baru
  useEffect(() => {
    scrollChatToBottom("auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesLoading]);

  useEffect(() => {
    // kalau realtime nambah pesan → scroll smooth
    scrollChatToBottom("smooth");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMessages.length]);

  async function handleSend(text?: string) {
    const message = text ?? chatInput;

    if (!message.trim()) return;

    if (waStatus !== "CONNECTED") {
      toast({
        variant: "destructive",
        title: "WhatsApp belum siap",
        description: "Koneksi WhatsApp belum aktif.",
      });
      return;
    }

    try {
      setSending(true);

      const res = await fetch(`/api/leads/${leadId}/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal mengirim pesan");
      }

      setChatInput(""); // clear input
      await mutateMessages();

      toast({
        title: "Pesan terkirim",
        duration: 3000,
        description: `Pesan berhasil dikirim ke ${lead.name}`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal mengirim pesan",
        description: err?.message || "Terjadi kesalahan",
      });
    } finally {
      setSending(false);
    }
  }

  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);

  const EMOJIS = [
    "😀",
    "😂",
    "😍",
    "🥳",
    "👍",
    "🙏",
    "🔥",
    "💯",
    "🎉",
    "✅",
    "📌",
    "📄",
    "📞",
    "🤝",
    "😅",
    "😢",
    "😡",
    "🤔",
    "❤️",
    "✨",
  ];

  function insertAtCursor(text: string) {
    const el = chatInputRef.current;
    if (!el) {
      setChatInput((prev) => prev + text);
      return;
    }

    const start = el.selectionStart ?? chatInput.length;
    const end = el.selectionEnd ?? chatInput.length;

    const next = chatInput.slice(0, start) + text + chatInput.slice(end);
    setChatInput(next);

    // balikin caret setelah emoji
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + text.length;
      el.setSelectionRange(pos, pos);
    });
  }

  // ==== DISPLAY FIELD DARI LEAD ====
  const displayName = lead?.name || "Lead Tanpa Nama";
  const displayPhone = lead?.phone || "-";
  const displaySource = lead?.source?.name || "Tanpa sumber";
  const displayAddress = lead?.address || "-";
  const displayCity = lead?.city || "-";
  const displayProductName = lead?.product?.name || "Belum dipilih";

  const [updatingProduct, setUpdatingProduct] = useState(false);

  async function handleChangeProduct(productId: string) {
    if (!productId) return;
    try {
      setUpdatingProduct(true);
      const res = await fetch(`/api/leads/${leadId}/product`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: Number(productId) }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Tidak bisa mengubah produk");
      }
      toast({
        title: "Produk diperbarui",
        description: "Produk untuk lead ini berhasil disimpan.",
      });
      await mutateDetail();
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Gagal menyimpan produk",
        description: err?.message || "Terjadi kesalahan saat update produk.",
      });
    } finally {
      setUpdatingProduct(false);
    }
  }

  const currentStatus = lead?.status ?? null;

  const statusBadge = (
    <Badge
      className={cn(
        "rounded-full px-3 py-0.5 text-md",
        getStatusClass(currentStatus?.code)
      )}
    >
      {currentStatus?.name ?? "Tanpa Status"}
    </Badge>
  );

  // ==== AKTIVITAS (gabungan stage, status, follow up, activity manual) ====

  const activities: ActivityItem[] = useMemo(() => {
    const list: ActivityItem[] = [];

    // 1) Riwayat tahapan
    for (const h of stageHistory) {
      list.push({
        id: `stage-${h.id}`,
        kind: "STAGE",
        title: `Pindah tahap ke "${h.stage.name}"`,
        description: "",
        at: h.createdAt,
      });
    }

    // 2) Riwayat status
    for (const h of statusHistory) {
      list.push({
        id: `status-${h.id}`,
        kind: "STATUS",
        title: `Ubah status menjadi "${h.status.name}"`,
        description: "",
        at: h.createdAt,
      });
    }

    // 3) Tindak lanjut
    for (const fu of followUps) {
      // tentukan teks waktu
      let waktuText = "";
      if (fu.doneAt) {
        waktuText = `Dilakukan: ${formatDateTime(fu.doneAt)}`;
      } else if (fu.nextActionAt) {
        waktuText = `Jadwal: ${formatDateTime(fu.nextActionAt)}`;
      }

      list.push({
        id: `fu-${fu.id}`,
        kind: "FOLLOW_UP",
        title:
          fu.typeName || getFollowUpTypeLabel(fu.typeCode) || "Tindak lanjut",
        description: [
          fu.channel ? `Aksi: ${fu.channel}` : "",
          waktuText,
          fu.note ? `Catatan: ${fu.note}` : "",
        ]
          .filter(Boolean)
          .join(" • "),
        // pakai waktu yang paling relevan untuk timeline
        at: fu.createdAt,
      });
    }

    // 4) Aktivitas manual / otomatis (LeadActivity)
    const apiActivities = activitiesRes?.data ?? [];
    for (const a of apiActivities) {
      list.push({
        id: `act-${a.id}`,
        kind: "ACTIVITY",
        title: a.title,
        description: a.description || "",
        at: a.happenedAt || a.createdAt,
        photoUrl: a.photoUrl,
        createdByName: a.createdBy?.name ?? null,
      });
    }

    return list.sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
    );
  }, [stageHistory, statusHistory, followUps, followUpTypes, activitiesRes]);

  // ==== PROPOSAL (KIRIM PENAWARAN PDF VIA WA) ====
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [proposalFile, setProposalFile] = useState<File | null>(null);
  const [proposalCaption, setProposalCaption] = useState("");
  const [proposalUploading, setProposalUploading] = useState(false);
  const proposalFileInputRef = useRef<HTMLInputElement | null>(null);

  const MAX_PROPOSAL_SIZE = 5 * 1024 * 1024; // 5MB

  function handleProposalFileChange(e: any) {
    const file = e.target.files?.[0] as File | undefined;
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        variant: "destructive",
        title: "Format tidak didukung",
        description: "File penawaran harus berformat PDF.",
      });
      e.target.value = "";
      return;
    }

    if (file.size > MAX_PROPOSAL_SIZE) {
      toast({
        variant: "destructive",
        title: "File terlalu besar",
        description: "Ukuran maksimal file penawaran adalah 5MB.",
      });
      e.target.value = "";
      return;
    }

    setProposalFile(file);
  }

  function handleProposalDrop(e: any) {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0] as File | undefined;
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        variant: "destructive",
        title: "Format tidak didukung",
        description: "File penawaran harus berformat PDF.",
      });
      return;
    }

    if (file.size > MAX_PROPOSAL_SIZE) {
      toast({
        variant: "destructive",
        title: "File terlalu besar",
        description: "Ukuran maksimal file penawaran adalah 5MB.",
      });
      return;
    }

    setProposalFile(file);
    if (proposalFileInputRef.current) {
      proposalFileInputRef.current.value = "";
    }
  }

  function handleProposalDragOver(e: any) {
    e.preventDefault();
  }

  function handleClearProposalFile() {
    setProposalFile(null);
    if (proposalFileInputRef.current) {
      proposalFileInputRef.current.value = "";
    }
  }

  async function handleSendProposal() {
    if (!leadId) return;
    if (!proposalFile) {
      toast({
        variant: "destructive",
        title: "File belum dipilih",
        description: "Silakan pilih file proposal terlebih dahulu.",
      });
      return;
    }

    if (displayPhone === "-" || !displayPhone) {
      toast({
        variant: "destructive",
        title: "Nomor WhatsApp tidak tersedia",
        description: "Lead ini belum memiliki nomor WhatsApp yang valid.",
      });
      return;
    }

    try {
      setProposalUploading(true);

      const formData = new FormData();
      formData.append("file", proposalFile);
      if (proposalCaption.trim()) {
        formData.append("caption", proposalCaption.trim());
      }

      const res = await fetch(`/api/leads/${leadId}/whatsapp/proposal`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal mengirim proposal");
      }

      toast({
        title: "Proposal terkirim",
        description:
          "File penawaran berhasil dikirim ke WhatsApp lead dan tercatat di percakapan.",
      });

      setProposalModalOpen(false);
      setProposalFile(null);
      setProposalCaption("");
      if (proposalFileInputRef.current) {
        proposalFileInputRef.current.value = "";
      }

      await Promise.all([
        mutateMessages(),
        mutateActivities(),
        mutateDetail(),
        // mutateFollowUps(),
      ]);
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Gagal mengirim proposal",
        description: err?.message || "Terjadi kesalahan.",
      });
    } finally {
      setProposalUploading(false);
    }
  }

  // ==== MODAL TAMBAH AKTIVITAS MANUAL ====

  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDate, setActivityDate] = useState("");
  const [activityTime, setActivityTime] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [activityPhoto, setActivityPhoto] = useState<File | null>(null);
  const [activityPhotoPreview, setActivityPhotoPreview] = useState<
    string | null
  >(null);
  const [activitySaving, setActivitySaving] = useState(false);
  const activityFileInputRef = useRef<HTMLInputElement | null>(null);

  const MAX_ACTIVITY_PHOTO_SIZE = 2 * 1024 * 1024; // 2MB

  function handleActivityPhotoChange(e: any) {
    const file = e.target.files?.[0] as File | undefined;
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Format tidak didukung",
        description: "Foto aktivitas harus berupa gambar (JPG/PNG).",
      });
      e.target.value = "";
      return;
    }

    if (file.size > MAX_ACTIVITY_PHOTO_SIZE) {
      toast({
        variant: "destructive",
        title: "File terlalu besar",
        description: "Ukuran maksimal foto aktivitas adalah 2MB.",
      });
      e.target.value = "";
      return;
    }

    setActivityPhoto(file);
    const url = URL.createObjectURL(file);
    setActivityPhotoPreview(url);
  }

  function handleActivityDrop(e: any) {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0] as File | undefined;
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Format tidak didukung",
        description: "Foto aktivitas harus berupa gambar (JPG/PNG).",
      });
      return;
    }

    if (file.size > MAX_ACTIVITY_PHOTO_SIZE) {
      toast({
        variant: "destructive",
        title: "File terlalu besar",
        description: "Ukuran maksimal foto aktivitas adalah 2MB.",
      });
      return;
    }

    setActivityPhoto(file);
    const url = URL.createObjectURL(file);
    setActivityPhotoPreview(url);

    if (activityFileInputRef.current) {
      activityFileInputRef.current.value = "";
    }
  }

  function handleActivityDragOver(e: any) {
    e.preventDefault();
  }

  function handleClearActivityPhoto() {
    setActivityPhoto(null);
    setActivityPhotoPreview(null);
    if (activityFileInputRef.current) {
      activityFileInputRef.current.value = "";
    }
  }

  async function handleSaveActivity() {
    if (!leadId) return;
    if (!activityTitle || !activityDate || !activityTime) {
      toast({
        variant: "destructive",
        title: "Data belum lengkap",
        description: "Judul, tanggal, dan jam aktivitas wajib diisi.",
      });
      return;
    }

    try {
      setActivitySaving(true);
      const formData = new FormData();
      formData.append("title", activityTitle);
      formData.append("date", activityDate);
      formData.append("time", activityTime);
      if (activityDescription.trim()) {
        formData.append("description", activityDescription.trim());
      }
      if (activityPhoto) {
        formData.append("photo", activityPhoto);
      }

      const res = await fetch(`/api/leads/${leadId}/activities`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal menyimpan aktivitas");
      }

      toast({
        title: "Aktivitas tersimpan",
        description: "Aktivitas berhasil ditambahkan untuk lead ini.",
      });

      setActivityModalOpen(false);
      setActivityTitle("");
      setActivityDate("");
      setActivityTime("");
      setActivityDescription("");
      setActivityPhoto(null);
      setActivityPhotoPreview(null);
      if (activityFileInputRef.current) {
        activityFileInputRef.current.value = "";
      }

      await mutateActivities();
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Gagal menyimpan aktivitas",
        description: err?.message || "Terjadi kesalahan.",
      });
    } finally {
      setActivitySaving(false);
    }
  }

  // ==== MODAL PREVIEW FOTO AKTIVITAS ====
  const [activityPreviewOpen, setActivityPreviewOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(
    null
  );

  function handleOpenActivityPreview(act: ActivityItem) {
    setSelectedActivity(act);
    setActivityPreviewOpen(true);
  }

  // form
  const dynamicFields = (detailRes?.data?.dynamicFields ??
    []) as DynamicField[];

  // ==== OVERVIEW EDITABLE ====
  const [overviewEditing, setOverviewEditing] = useState(false);
  const [savingOverview, setSavingOverview] = useState(false);

  // field paten
  const [overviewName, setOverviewName] = useState("");
  const [overviewPhone, setOverviewPhone] = useState("");
  const [overviewAddress, setOverviewAddress] = useState("");
  const [overviewCity, setOverviewCity] = useState("");
  const [overviewProductId, setOverviewProductId] = useState<string>("");

  // field dinamis, disimpan per fieldId
  const [overviewCustomValues, setOverviewCustomValues] = useState<
    Record<number, string>
  >({});

  useEffect(() => {
    if (!lead) return;

    // field paten
    setOverviewName(lead.name || "");
    setOverviewPhone(lead.phone || "");
    setOverviewAddress(lead.address || "");
    setOverviewCity(lead.city || "");
    setOverviewProductId(lead.productId ? String(lead.productId) : "");

    // field dinamis
    const map: Record<number, string> = {};
    for (const f of dynamicFields) {
      map[f.id] = f.value ?? "";
    }
    setOverviewCustomValues(map);
  }, [lead, dynamicFields]);

  function setCustomValue(fieldId: number, value: string) {
    setOverviewCustomValues((prev) => ({ ...prev, [fieldId]: value }));
  }

  async function handleSaveOverview() {
    if (!leadId) return;

    try {
      setSavingOverview(true);

      const customValuesPayload = dynamicFields.map((f) => ({
        fieldId: f.id,
        value: overviewCustomValues[f.id] ?? "",
      }));

      const res = await fetch(`/api/leads/${leadId}/overview`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: overviewName,
          phone: overviewPhone,
          address: overviewAddress,
          city: overviewCity,
          productId: overviewProductId ? Number(overviewProductId) : null,
          customValues: customValuesPayload,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal menyimpan overview");
      }

      toast({
        title: "Data lead diperbarui",
        description: "Perubahan di overview berhasil disimpan.",
      });

      setOverviewEditing(false);
      await mutateDetail();
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Gagal menyimpan",
        description: err?.message || "Terjadi kesalahan.",
      });
    } finally {
      setSavingOverview(false);
    }
  }

  function handleCancelOverview() {
    // reset ke data dari server (useEffect akan isi lagi)
    if (lead) {
      setOverviewEditing(false);
      // trigger ulang efek dengan cara sederhana
      // (kalau mau aman, bisa panggil mutateDetail(), tapi biasanya tidak perlu)
    } else {
      setOverviewEditing(false);
    }
  }

  // harga
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [priceKind, setPriceKind] = useState<PriceKind>("OFFERING");
  const [priceInput, setPriceInput] = useState("");
  const [savingPrice, setSavingPrice] = useState(false);

  function getLeadPriceForKind(kind: PriceKind) {
    if (!lead) return "";
    const raw =
      kind === "OFFERING"
        ? lead.priceOffering
        : kind === "NEGOTIATION"
        ? lead.priceNegotiation
        : lead.priceClosing;

    if (raw === null || raw === undefined) return "";

    // pastikan jadi string digit dulu
    const asNumber = typeof raw === "number" ? raw : Number(raw);
    if (Number.isNaN(asNumber)) return "";

    return formatRupiahInput(String(asNumber));
  }

  function handleOpenPriceModal() {
    if (lead) {
      // heuristik: penawaran dulu, kalau sudah → nego, kalau sudah → closing
      let initialKind: PriceKind = "OFFERING";
      if (lead.priceOffering != null) initialKind = "NEGOTIATION";
      if (lead.priceNegotiation != null) initialKind = "CLOSING";

      setPriceKind(initialKind);
      setPriceInput(getLeadPriceForKind(initialKind));
    }
    setPriceModalOpen(true);
  }

  function handleChangePriceKind(next: PriceKind) {
    setPriceKind(next);
    setPriceInput(getLeadPriceForKind(next));
  }

  async function handleSavePrice() {
    if (!leadId) return;

    if (!priceInput.trim()) {
      toast({
        variant: "destructive",
        title: "Nominal belum diisi",
        description: "Isi nominal harga terlebih dahulu.",
      });
      return;
    }

    const numeric = parseRupiahToNumber(priceInput);
    if (!numeric) {
      // kalau mau 0 dianggap valid, ceknya bisa diubah (numeric < 0 misalnya)
      toast({
        variant: "destructive",
        title: "Format angka tidak valid",
        description: "Pastikan nominal hanya berisi angka.",
      });
      return;
    }

    const field =
      priceKind === "OFFERING"
        ? "priceOffering"
        : priceKind === "NEGOTIATION"
        ? "priceNegotiation"
        : "priceClosing";

    try {
      setSavingPrice(true);

      const res = await fetch(`/api/leads/${leadId}/price`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field,
          value: numeric,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal menyimpan harga");
      }

      toast({
        title: "Harga tersimpan",
        description: "Harga berhasil diperbarui untuk lead ini.",
      });

      setPriceModalOpen(false);
      await mutateDetail();
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Gagal menyimpan harga",
        description: err?.message || "Terjadi kesalahan.",
      });
    } finally {
      setSavingPrice(false);
    }
  }

  const [markingFollowUpDone, setMarkingFollowUpDone] = useState(false);

  async function handleMarkFollowUpDone(followUpId: number) {
    if (!leadId) return;

    try {
      setMarkingFollowUpDone(true);

      const res = await fetch(
        `/api/leads/${leadId}/followups/${followUpId}/done`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal menandai tindak lanjut");
      }

      toast({
        title: "Tindak lanjut selesai",
        description: "Follow up berhasil ditandai sebagai selesai.",
      });

      // refresh data follow up + aktivitas (timeline)
      await Promise.all([mutateFollowUps(), mutateActivities()]);
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Gagal menandai tindak lanjut",
        description: err?.message || "Terjadi kesalahan.",
      });
    } finally {
      setMarkingFollowUpDone(false);
    }
  }

  const [stageChecklistSaving, setStageChecklistSaving] = useState<
    number | null
  >(null);

  async function markStageDone(
    stageId: number,
    mode: "NORMAL" | "SKIPPED" = "NORMAL"
  ) {
    try {
      setStageChecklistSaving(stageId);
      const res = await fetch(`/api/leads/${leadId}/stage/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageId,
          mode,
          note: mode === "SKIPPED" ? "Checklist: diskip" : "Checklist: selesai",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok)
        throw new Error(json.error || "Gagal checklist tahap");
      await mutateDetail();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err?.message || "Error",
      });
    } finally {
      setStageChecklistSaving(null);
    }
  }

  const [syncingChat, setSyncingChat] = useState(false);

  async function handleSyncChat() {
    if (!leadId) return;
    try {
      setSyncingChat(true);
      toast({
        title: "Sinkronisasi chat dimulai",
        description: "Mohon tunggu sebentar..",
      });

      const res = await fetch(`/api/leads/${leadId}/whatsapp/sync-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 300 }), // bebas: 100/200/300
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal sinkronisasi chat");
      }

      toast({
        title: "Sinkronisasi chat selesai",
        description: `Masuk: ${json.data.inserted}, skip: ${
          json.data.skipped
        }, fetched: ${json.data.fetched}${
          json.data.note ? ` (${json.data.note})` : ""
        }`,
      });

      await Promise.all([mutateMessages(), mutateActivities(), mutateDetail()]);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal sinkronisasi chat",
        description: err?.message || "Terjadi kesalahan.",
      });
    } finally {
      setSyncingChat(false);
    }
  }

  // ==== AI ANALYSIS (Gemini) ====
  const [aiLoading, setAiLoading] = useState(false);
  const [aiData, setAiData] = useState<WhatsAppAiAnalysis | null>(null);
  const [aiCached, setAiCached] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (!aiCacheRes) return;

    if (aiCacheRes.ok && aiCacheRes.data) {
      setAiData(aiCacheRes.data);
      setAiCached(true);
      setAiError(null);
    }
  }, [aiCacheRes]);

  async function handleAnalyzeChat(limit = 60) {
    if (!leadId) return;

    try {
      setAiLoading(true);
      setAiError(null);

      toast({
        title: "Memulai Analisis AI Chat",
        description: "Mohon tunggu sebentar...",
      });

      const res = await fetch(`/api/leads/${leadId}/whatsapp/ai-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal analisis chat");
      }

      setAiData(json.data ?? null);
      setAiCached(Boolean(json.cached));

      await mutateAiCache();

      toast({
        title: "Analisis AI siap",
        description: json.cached
          ? "Menggunakan hasil cache (tidak memotong limit)"
          : "Hasil analisis terbaru berhasil dibuat",
      });
    } catch (err: any) {
      console.error(err);
      setAiError(err?.message || "Terjadi kesalahan");
      toast({
        variant: "destructive",
        title: "Gagal analisis chat",
        description: err?.message || "Terjadi kesalahan.",
      });
    } finally {
      setAiLoading(false);
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Tersalin", description: "Teks berhasil di-copy." });
    } catch {
      toast({
        variant: "destructive",
        title: "Gagal copy",
        description: "Browser tidak mengizinkan clipboard.",
      });
    }
  }

  function priorityBadgeClass(p: AiPriority) {
    if (p === "HIGH") return "bg-red-500 text-white";
    if (p === "MEDIUM") return "bg-amber-500 text-white";
    return "bg-slate-600 text-white";
  }

  function statusHintBadgeClass(s: AiStatusHint) {
    if (s === "HOT") return "bg-red-500 text-white";
    if (s === "WARM") return "bg-amber-500 text-white";
    if (s === "COLD") return "bg-slate-700 text-slate-50";
    return "bg-slate-300 text-slate-900";
  }

  function useAiReply(text: string) {
    setChatInput(text);
    requestAnimationFrame(() => chatInputRef.current?.focus());
  }

  const TPL_PICKER_KEY = "/api/whatsapp/templates?mode=picker";

  const { mutate } = useSWRConfig();

  const [quickMsgOpen, setQuickMsgOpen] = useState(false);
  const [editTplOpen, setEditTplOpen] = useState(false);
  const [selectedTpl, setSelectedTpl] = useState<any>(null);

  const [saveTplOpen, setSaveTplOpen] = useState(false);
  const [saveTplPayload, setSaveTplPayload] = useState<{
    text: string;
    type?: "TEXT" | "MEDIA";
    mediaUrl?: string | null;
    mediaName?: string | null;
  } | null>(null);

  function closeEditTpl() {
    setEditTplOpen(false);
    setSelectedTpl(null);
  }

  function closeSaveTpl() {
    setSaveTplOpen(false);
    setSaveTplPayload(null);
  }

  // pakai ini untuk refresh template (global + user) setelah create/edit/override
  async function refreshTemplates() {
    await mutate(TPL_PICKER_KEY); // refresh cache
    // kalau QuickMessageDialog sedang open, dia akan rerender pakai cache baru
  }

  function handleUseQuickMessage(text: string) {
    setChatInput(text);
    setQuickMsgOpen(false);
    requestAnimationFrame(() => chatInputRef.current?.focus());
  }

  function handleEditTemplate(tpl: any) {
    setSelectedTpl(tpl);
    setEditTplOpen(true);
  }

  // dari bubble chat
  function handleSaveBubbleToTemplate(m: any) {
    setSaveTplPayload({
      text: m.text || "",
      type: m.type ?? "TEXT",
      mediaUrl: m.mediaUrl ?? null,
      mediaName: m.mediaName ?? null,
    });
    setSaveTplOpen(true);
  }

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [stageModalOpen, setStageModalOpen] = useState(false);

  // ==== SUB STATUS ====
  const [subStatusId, setSubStatusId] = useState<number | null>(null);
  const [subStatusUpdating, setSubStatusUpdating] = useState(false);
  const [subStatusModalOpen, setSubStatusModalOpen] = useState(false);

  const [noteOpen, setNoteOpen] = useState(false);

  const isAnyModalOpen =
    scheduleModalOpen ||
    proposalModalOpen ||
    quickMsgOpen ||
    editTplOpen ||
    saveTplOpen ||
    activityModalOpen ||
    activityPreviewOpen ||
    priceModalOpen ||
    statusModalOpen ||
    stageModalOpen ||
    subStatusModalOpen ||
    noteOpen;

  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.position = "";
      document.body.style.width = "";
    }

    return () => {
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [isAnyModalOpen]);

  const waInfo = detailRes?.data?.whatsapp;

  const waStatus: WaClientStatus | null = waInfo?.status ?? null;
  const waSalesId = waInfo?.salesId ?? null;

  useEffect(() => {
    if (!waSalesId) return;
    if (!waStatus) return;

    // kalau sudah siap → tidak usah start
    if (waStatus === "CONNECTED") return;

    // init secara eksplisit
    fetch(`/api/leads/${leadId}/whatsapp/start`, {
      method: "POST",
    }).catch(() => {});
  }, [waSalesId, waStatus]);

  useEffect(() => {
    setSubStatusId(lead?.subStatusId ?? null);
  }, [lead?.subStatusId]);

  async function updateSubStatus(nextSubStatusId: number) {
    if (!leadId) return;

    try {
      setSubStatusUpdating(true);

      const res = await fetch(`/api/leads/${leadId}/sub-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subStatusId: nextSubStatusId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || "Gagal mengubah sub status");
      }

      await Promise.all([
        mutateDetail(),
        mutateActivities(), // biar langsung muncul di timeline
      ]);

      toast({
        title: "Sub status diperbarui",
        description: `Sub status diubah ke "${json.data.subStatus.name}"`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal mengubah sub status",
        description: err?.message || "Terjadi kesalahan.",
      });
    } finally {
      setSubStatusUpdating(false);
    }
  }

  function handleSendAiMessage(text: string) {
    handleSend(text);
  }

  return (
    <DashboardLayout title="Detail Leads">
      <div className="flex min-h-[100dvh] flex-col">
        <main className="mx-auto flex w-full flex-1 flex-col gap-4 px-3 pb-20 pt-3 sm:px-4 md:pb-8">
          {/* SALES INFO */}
          <Badge
            variant="default"
            className="flex items-center gap-1.5 text-xs sm:text-sm"
          >
            Sales:
            <span className="font-medium">
              {salesName ?? "Belum ditentukan"}
            </span>
          </Badge>
          {/* RINGKASAN LEAD */}
          <section className="flex flex-col gap-5 rounded-xl border p-5 md:flex-row md:items-center md:justify-between bg-secondary">
            {/* ===== IDENTITAS LEAD ===== */}
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
                {displayName?.charAt(0) || "L"}
              </div>

              <div className="space-y-1.5">
                {/* Nama */}
                <p className="text-base font-semibold leading-tight sm:text-lg">
                  {displayName}
                </p>

                {/* Produk & Lokasi */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground sm:text-base">
                  <span className="flex items-center gap-1.5">
                    📦 {displayProductName}
                  </span>
                  <span className="flex items-center gap-1.5">
                    📍 {displayCity}
                  </span>
                </div>

                {/* Badges */}
                <div className="mt-1.5 flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1.5 text-xs sm:text-sm"
                  >
                    🧭 {displaySource}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1.5 text-xs sm:text-sm"
                  >
                    📱 {displayPhone}
                  </Badge>
                </div>
              </div>
            </div>

            {/* ===== KELENGKAPAN PROFIL ===== */}
            <div className="flex w-full flex-col gap-3 md:w-80">
              {/* Header */}
              <div className="flex items-center justify-between text-sm font-medium text-muted-foreground sm:text-base">
                <span className="flex items-center gap-2">
                  📊 Kelengkapan profil
                </span>
                <span className="text-base font-semibold text-foreground">
                  {profileCompletion}%
                </span>
              </div>

              {/* Progress */}
              <Progress value={profileCompletion} className="h-2.5" />

              {/* Checklist */}
              <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                <Badge
                  variant={lead?.phone ? "secondary" : "outline"}
                  className="flex items-center gap-1.5"
                >
                  {lead?.phone ? "✔" : "○"} WhatsApp
                </Badge>

                <Badge
                  variant={lead?.address ? "secondary" : "outline"}
                  className="flex items-center gap-1.5"
                >
                  {lead?.address ? "✔" : "○"} Alamat
                </Badge>

                <Badge
                  variant={lead?.productId ? "secondary" : "outline"}
                  className="flex items-center gap-1.5"
                >
                  {lead?.productId ? "✔" : "○"} Produk
                </Badge>

                <Badge
                  variant={lead?.statusId ? "secondary" : "outline"}
                  className="flex items-center gap-1.5"
                >
                  {lead?.statusId ? "✔" : "○"} Status
                </Badge>
              </div>
            </div>
          </section>

          {/* 4 CARD ATAS */}
          {/* ===== INFO STRIP ===== */}
          <section className="rounded-xl border p-3 bg-secondary">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <InfoItem
                icon={GitBranch}
                label="Tahap"
                value={currentStage?.label || "-"}
                highlight
              />

              <InfoItem
                icon={Activity}
                label="Status"
                value={
                  lead?.subStatus
                    ? `${lead.status?.name} · ${lead.subStatus.name}`
                    : lead?.status?.name ?? "-"
                }
                highlight
              />

              <InfoItem
                icon={CalendarClock}
                label="Follow Up"
                value={
                  lastFollowUp
                    ? lastFollowUp.doneAt
                      ? "Selesai"
                      : lastFollowUp.nextActionAt
                      ? formatDateTime(lastFollowUp.nextActionAt)
                      : lastFollowUp.typeName || "-"
                    : "Belum ada"
                }
                highlight
              />

              <InfoItem
                icon={Package}
                label="Produk"
                value={displayProductName}
                highlight
              />
            </div>
          </section>

          {/* DETAIL & INTERAKSI */}
          <section>
            <CardContent className="px-0">
              {/* QUICK ACTIONS DI ATAS CHAT */}
              <div className="space-y-2 rounded-md border bg-secondary p-2 mb-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {/* Quick Tindak Lanjut */}
                  <div className="flex flex-col justify-between rounded-lg border bg-background p-3">
                    <div className="space-y-2">
                      {/* Header */}
                      <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                        <CalendarClock className="h-4 w-4" />
                        <span>Tindak lanjut</span>
                      </div>

                      {/* Main info */}
                      <p className="text-sm font-semibold leading-tight">
                        {lastFollowUp
                          ? lastFollowUp.typeName ||
                            getFollowUpTypeLabel(lastFollowUp.typeCode)
                          : "Belum ada tindak lanjut"}
                      </p>

                      {/* Meta */}
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        {lastFollowUp ? (
                          lastFollowUp.doneAt ? (
                            <>
                              Terakhir{" "}
                              <span className="font-medium text-foreground">
                                {formatDateTime(lastFollowUp.doneAt)}
                              </span>{" "}
                              ·{" "}
                              {followUpChannelLabel(
                                lastFollowUp.channel.toLowerCase()
                              )}
                            </>
                          ) : lastFollowUp.nextActionAt ? (
                            <>
                              Dijadwalkan{" "}
                              <span className="font-medium text-foreground">
                                {formatDateTime(lastFollowUp.nextActionAt)}
                              </span>{" "}
                              ·{" "}
                              {followUpChannelLabel(
                                lastFollowUp.channel.toLowerCase()
                              )}
                            </>
                          ) : (
                            "Sudah ada tindak lanjut, tanpa jadwal berikutnya"
                          )
                        ) : (
                          "Belum ada jadwal tersimpan"
                        )}
                      </p>
                    </div>

                    {/* Action */}
                    {lastFollowUp && !lastFollowUp.doneAt && (
                      <div className="mt-3">
                        {isSales && (
                          <Button
                            size="sm"
                            className="h-8 w-full text-xs"
                            onClick={() =>
                              handleMarkFollowUpDone(lastFollowUp.id)
                            }
                            disabled={markingFollowUpDone}
                          >
                            {markingFollowUpDone ? (
                              <>
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                Menyimpan
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Tandai selesai
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quick Harga */}
                  <div className="rounded-lg border bg-background p-3">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                        <Wallet className="h-4 w-4" />
                        <span>Harga</span>
                      </div>

                      {/* Price grid */}
                      <div className="grid grid-cols-3 gap-3 text-xs md:text-sm">
                        <PriceItem
                          label="Penawaran"
                          value={formatCurrencyIDR(lead?.priceOffering)}
                        />
                        <PriceItem
                          label="Nego"
                          value={formatCurrencyIDR(lead?.priceNegotiation)}
                        />
                        <PriceItem
                          label="Closing"
                          value={formatCurrencyIDR(lead?.priceClosing)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <Tabs defaultValue="whatsapp">
                <TabsList className="mb-3 w-full justify-start overflow-x-auto">
                  <TabsTrigger value="overview" className="text-xs sm:text-sm">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="text-xs sm:text-sm">
                    Aktivitas
                  </TabsTrigger>
                  <TabsTrigger value="whatsapp" className="text-xs sm:text-sm">
                    WhatsApp
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="text-xs sm:text-sm">
                    AI Analysis
                  </TabsTrigger>
                </TabsList>

                {/* OVERVIEW */}
                <TabsContent value="overview" className="space-y-4 text-sm">
                  <OverviewTab
                    overviewEditing={overviewEditing}
                    setOverviewEditing={setOverviewEditing}
                    savingOverview={savingOverview}
                    detailLoading={detailLoading}
                    onCancel={handleCancelOverview}
                    onSave={handleSaveOverview}
                    displayName={displayName}
                    displayPhone={displayPhone}
                    displaySource={displaySource}
                    displayAddress={displayAddress}
                    displayCity={displayCity}
                    displayProductName={displayProductName}
                    lead={lead}
                    products={products}
                    updatingProduct={updatingProduct}
                    overviewName={overviewName}
                    setOverviewName={setOverviewName}
                    overviewPhone={overviewPhone}
                    setOverviewPhone={setOverviewPhone}
                    overviewAddress={overviewAddress}
                    setOverviewAddress={setOverviewAddress}
                    overviewCity={overviewCity}
                    setOverviewCity={setOverviewCity}
                    overviewProductId={overviewProductId}
                    setOverviewProductId={setOverviewProductId}
                    formatCurrencyIDR={formatCurrencyIDR}
                    dynamicFields={dynamicFields}
                    overviewCustomValues={overviewCustomValues}
                    setCustomValue={setCustomValue}
                    isSales={isSales}
                  />
                </TabsContent>

                {/* AKTIVITAS */}
                <TabsContent value="activity" className="space-y-3 text-sm">
                  <div className="flex items-center justify-end">
                    {/* <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActivityModalOpen(true)}
                    >
                      Tambah Aktivitas
                    </Button> */}
                  </div>

                  {activitiesLoading ? (
                    <p className="text-sm text-muted-foreground">
                      Memuat aktivitas...
                    </p>
                  ) : activities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Belum ada aktivitas tercatat untuk lead ini
                    </p>
                  ) : (
                    <div className="relative max-h-96 overflow-y-auto rounded-xl border bg-secondary p-4">
                      <div className="relative space-y-4">
                        {/* Vertical line */}
                        <div className="absolute left-4 top-0 h-full w-px bg-border border" />

                        {activities.map((a, idx) => (
                          <div key={a.id} className="relative flex gap-4">
                            {/* Dot + Icon */}
                            <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background border">
                              {a.kind === "FOLLOW_UP" && (
                                <Clock3 className="h-4 w-4 text-amber-500" />
                              )}
                              {a.kind === "STAGE" && (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              )}
                              {a.kind === "STATUS" && (
                                <Sparkles className="h-4 w-4 text-blue-500" />
                              )}
                              {a.kind === "ACTIVITY" && (
                                <FileText className="h-4 w-4 text-violet-500" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-2">
                              <div className="rounded-lg border bg-background p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs md:text-sm font-medium">
                                    {a.title}
                                  </p>
                                  <span className="text-[11px] text-muted-foreground">
                                    {formatDateTime(a.at)}
                                  </span>
                                </div>

                                {/* Photo preview */}
                                {a.kind === "ACTIVITY" && a.photoUrl && (
                                  <button
                                    type="button"
                                    className="mt-2 inline-block overflow-hidden rounded-md border cursor-pointer"
                                    onClick={() => handleOpenActivityPreview(a)}
                                  >
                                    <img
                                      src={a.photoUrl}
                                      alt={a.title}
                                      className="h-16 w-16 object-cover"
                                    />
                                  </button>
                                )}

                                {a.description && (
                                  <p className="mt-1 text-[11px] text-muted-foreground">
                                    {a.description}
                                  </p>
                                )}

                                {a.createdByName && (
                                  <p className="mt-1 text-[11px] text-muted-foreground">
                                    Dibuat oleh {a.createdByName}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* WHATSAPP */}
                <TabsContent value="whatsapp" className="space-y-3 text-sm">
                  {/* Chat*/}
                  <div className="flex flex-col gap-3 lg:flex-row">
                    {/* CHAT PANEL */}
                    <div className="flex-1">
                      <WhatsAppChatCard
                        displayName={displayName}
                        displayPhone={displayPhone}
                        leadHasPhone={Boolean(lead?.phone)}
                        syncingChat={syncingChat}
                        onSyncChat={handleSyncChat}
                        messagesLoading={messagesLoading}
                        chatMessages={chatMessages}
                        chatWrapRef={chatWrapRef}
                        chatInput={chatInput}
                        setChatInput={setChatInput}
                        sending={sending}
                        onSend={handleSend}
                        onOpenProposal={() => setProposalModalOpen(true)}
                        onOpenFollowUp={() => setScheduleModalOpen(true)}
                        onOpenQuickMessage={() => setQuickMsgOpen(true)}
                        EMOJIS={EMOJIS}
                        insertAtCursor={insertAtCursor}
                        chatInputRef={chatInputRef}
                        onSaveMessageToTemplate={handleSaveBubbleToTemplate}
                        waStatus={waStatus}
                        waSalesId={waSalesId}
                        sales={isSales}
                      />
                    </div>
                  </div>

                  {/* MODAL KIRIM PENAWARAN (PDF) */}
                  <ProposalDialog
                    open={proposalModalOpen}
                    onOpenChange={setProposalModalOpen}
                    proposalFile={proposalFile}
                    proposalCaption={proposalCaption}
                    uploading={proposalUploading}
                    fileInputRef={proposalFileInputRef}
                    onFileChange={handleProposalFileChange}
                    onClearFile={handleClearProposalFile}
                    onDragOver={handleProposalDragOver}
                    onDrop={handleProposalDrop}
                    onCaptionChange={setProposalCaption}
                    onSend={handleSendProposal}
                    formatFileSize={formatFileSize}
                  />

                  <QuickMessageDialog
                    open={quickMsgOpen}
                    onOpenChange={(v) => {
                      setQuickMsgOpen(v);
                      if (!v) {
                        closeEditTpl();
                        closeSaveTpl();
                      }
                    }}
                    lead={lead}
                    onUse={handleUseQuickMessage}
                    onEditRequest={handleEditTemplate}
                    currentUser={detailRes?.data?.currentUser}
                    settings={detailRes?.data?.settings}
                  />

                  <EditTemplateDialog
                    open={editTplOpen}
                    onOpenChange={(v) => {
                      setEditTplOpen(v);
                      if (!v) setSelectedTpl(null);
                    }}
                    template={selectedTpl}
                    onSaved={async () => {
                      await refreshTemplates();
                      closeEditTpl();
                    }}
                  />

                  <SaveToTemplateDialog
                    open={saveTplOpen}
                    onOpenChange={(v) => {
                      setSaveTplOpen(v);
                      if (!v) setSaveTplPayload(null);
                    }}
                    messageText={saveTplPayload?.text || ""}
                    messageType={saveTplPayload?.type}
                    mediaUrl={saveTplPayload?.mediaUrl}
                    mediaName={saveTplPayload?.mediaName}
                    onSaved={async () => {
                      await refreshTemplates();
                      closeSaveTpl();
                    }}
                  />
                </TabsContent>

                <TabsContent value="ai" className="space-y-3 text-sm">
                  {/* ===== AI INSIGHT + REPLIES ===== */}
                  <AiInsightPanel
                    aiData={aiData}
                    aiLoading={aiLoading || aiCacheLoading}
                    aiCached={aiCached}
                    aiError={aiError}
                    onAnalyze={handleAnalyzeChat}
                    onCopy={copyToClipboard}
                    onSend={handleSendAiMessage}
                    priorityBadgeClass={priorityBadgeClass}
                  />
                </TabsContent>

                {/* MODAL TAMBAH AKTIVITAS MANUAL */}
                <ActivityDialog
                  open={activityModalOpen}
                  onOpenChange={setActivityModalOpen}
                  title={activityTitle}
                  date={activityDate}
                  time={activityTime}
                  description={activityDescription}
                  photo={activityPhoto}
                  photoPreview={activityPhotoPreview}
                  saving={activitySaving}
                  fileInputRef={activityFileInputRef}
                  onTitleChange={setActivityTitle}
                  onDateChange={setActivityDate}
                  onTimeChange={setActivityTime}
                  onDescriptionChange={setActivityDescription}
                  onPhotoChange={handleActivityPhotoChange}
                  onPhotoDragOver={handleActivityDragOver}
                  onPhotoDrop={handleActivityDrop}
                  onClearPhoto={handleClearActivityPhoto}
                  onPreview={() => {
                    setSelectedActivity({
                      id: "new",
                      kind: "ACTIVITY",
                      title: activityTitle || "Preview foto",
                      description: activityDescription || "Preview foto",
                      at: new Date().toISOString(),
                      photoUrl: activityPhotoPreview,
                    });
                    setActivityPreviewOpen(true);
                  }}
                  onSave={handleSaveActivity}
                  formatFileSize={formatFileSize}
                />

                {/* MODAL PREVIEW FOTO AKTIVITAS */}
                <ActivityPreviewDialog
                  open={activityPreviewOpen}
                  onOpenChange={setActivityPreviewOpen}
                  title={selectedActivity?.title}
                  photoUrl={selectedActivity?.photoUrl}
                  description={selectedActivity?.description}
                  createdByName={selectedActivity?.createdByName}
                  formattedAt={
                    selectedActivity
                      ? formatDateTime(selectedActivity.at)
                      : undefined
                  }
                />

                {/* MODAL ATUR HARGA (STEP BY STEP) */}
                <PriceDialog
                  open={priceModalOpen}
                  onOpenChange={setPriceModalOpen}
                  priceKind={priceKind}
                  priceInput={priceInput}
                  saving={savingPrice}
                  onChangeKind={setPriceKind}
                  onChangeInput={(v) => setPriceInput(formatRupiahInput(v))}
                  onSave={handleSavePrice}
                />

                {/* MODAL TINDAK LANJUT */}
                <FollowUpScheduleDialog
                  open={scheduleModalOpen}
                  onOpenChange={setScheduleModalOpen}
                  followUpTypeCode={followUpTypeCode}
                  setFollowUpTypeCode={setFollowUpTypeCode}
                  followUpDate={followUpDate}
                  setFollowUpDate={setFollowUpDate}
                  followUpTime={followUpTime}
                  setFollowUpTime={setFollowUpTime}
                  followUpChannel={followUpChannel}
                  setFollowUpChannel={setFollowUpChannel}
                  followUpNote={followUpNote}
                  setFollowUpNote={setFollowUpNote}
                  followUpTypes={followUpTypes}
                  saving={savingFollowUp}
                  onSave={handleSaveFollowUp}
                />
              </Tabs>
            </CardContent>
          </section>
        </main>
      </div>

      {/* ===== FLOATING ACTION BUTTON ===== */}
      {!isAnyModalOpen && (
        <LeadActionFab
          onFollowUp={() => setScheduleModalOpen(true)}
          onPrice={handleOpenPriceModal}
          onActivity={() => setActivityModalOpen(true)}
          onSyncChat={handleSyncChat}
          onAnalyzeAi={() => handleAnalyzeChat(60)}
          onStatus={() => setStatusModalOpen(true)}
          onStage={() => setStageModalOpen(true)}
          onSubStatus={() => setSubStatusModalOpen(true)}
          onNote={() => setNoteOpen(true)}
        />
      )}

      <StatusModal
        open={statusModalOpen}
        onOpenChange={setStatusModalOpen}
        value={statusId}
        loading={statusUpdating}
        onChange={(nextStatusId: number) => {
          setStatusId(nextStatusId); // optimistic
          updateStatus(nextStatusId);
        }}
      />

      <SubStatusModal
        open={subStatusModalOpen}
        onOpenChange={setSubStatusModalOpen}
        statusId={lead?.statusId ?? null}
        statusName={lead?.status?.name}
        value={subStatusId}
        loading={subStatusUpdating}
        onChange={(nextSubStatusId) => {
          setSubStatusId(nextSubStatusId);
          updateSubStatus(nextSubStatusId);
        }}
      />

      <StageModal open={stageModalOpen} onOpenChange={setStageModalOpen}>
        <QuickStagePanel
          stages={stages}
          currentStageId={currentStageId}
          stageUpdating={stageUpdating}
          stageChecklistSaving={stageChecklistSaving}
          onStageDone={handleStageDone}
          onMarkDone={markStageDone}
        />
      </StageModal>

      <LeadNotesDrawer
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        leadId={Number(leadId)}
      />
    </DashboardLayout>
  );
}

/* ==== helper components & functions ==== */

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(1)} ${sizes[i]}`;
}
