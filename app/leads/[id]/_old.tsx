"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import {
  Phone,
  Send,
  Sparkles,
  CheckCircle2,
  Circle,
  Clock3,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  Pencil,
  X,
  SendHorizonal,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { MessageStatusIcon } from "@/components/leads/detail/message-status-icon";
import { io as ioClient } from "socket.io-client";
import { Smile } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

type LeadStatusUi = "new" | "cold" | "warm" | "hot" | "won" | "lost";

type ChatFrom = "client" | "sales";

interface ChatMessageUi {
  id: string | number;
  from: ChatFrom;
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

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// mapping UI ↔ DB code
function mapStatusDbToUi(code?: string | null): LeadStatusUi {
  switch (code) {
    case "NEW":
      return "new";
    case "COLD":
      return "cold";
    case "WARM":
      return "warm";
    case "HOT":
      return "hot";
    case "CLOSE_WON":
      return "won";
    case "CLOSE_LOST":
      return "lost";
    default:
      return "new";
  }
}

function mapStatusUiToDb(ui: LeadStatusUi): string {
  switch (ui) {
    case "new":
      return "NEW";
    case "cold":
      return "COLD";
    case "warm":
      return "WARM";
    case "hot":
      return "HOT";
    case "won":
      return "CLOSE_WON";
    case "lost":
      return "CLOSE_LOST";
  }
}

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

  const followUps = followUpsRes?.data ?? [];
  const lastFollowUp = followUps[0] ?? null;

  // ==== STATUS ====
  const [status, setStatus] = useState<LeadStatusUi>("new");
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    if (lead?.status?.code) {
      setStatus(mapStatusDbToUi(lead.status.code));
    }
  }, [lead?.status?.code]);

  const statusLabelMap: Record<LeadStatusUi, string> = {
    new: "New",
    cold: "Cold",
    warm: "Warm",
    hot: "Hot",
    won: "Close Won",
    lost: "Close Lost",
  };

  function getStatusBadgeClass(s: LeadStatusUi) {
    switch (s) {
      case "new":
        return "bg-slate-200 text-slate-800";
      case "cold":
        return "bg-slate-700 text-slate-50";
      case "warm":
        return "bg-amber-500 text-white";
      case "hot":
        return "bg-red-500 text-white";
      case "won":
        return "bg-emerald-500 text-white";
      case "lost":
        return "bg-rose-500 text-white";
      default:
        return "";
    }
  }

  async function updateStatus(next: LeadStatusUi) {
    if (!leadId) return;
    try {
      setStatus(next);
      setStatusUpdating(true);

      const res = await fetch(`/api/leads/${leadId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statusCode: mapStatusUiToDb(next),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal mengubah status");
      }
      await mutateDetail();
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Gagal mengubah status",
        description: err?.message || "Terjadi kesalahan.",
      });
    } finally {
      setStatusUpdating(false);
    }
  }

  const handleQuickStatus = (s: LeadStatusUi) => {
    void updateStatus(s);
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

  const handleSend = async () => {
    if (!chatInput.trim()) return;
    try {
      setSending(true);
      const res = await fetch(`/api/leads/${leadId}/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatInput }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal mengirim pesan WhatsApp");
      }
      setChatInput("");
      await mutateMessages();
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Gagal mengirim pesan",
        description: err?.message || "Terjadi kesalahan saat kirim WA.",
      });
    } finally {
      setSending(false);
    }
  };

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
  const displayCity = lead?.address || "-";
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

  const statusBadge = (
    <Badge
      className={`rounded-full px-3 py-0.5 text-md ${getStatusBadgeClass(
        status
      )}`}
    >
      {statusLabelMap[status]}
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

  async function handleAnalyzeChat(limit = 60) {
    if (!leadId) return;

    try {
      setAiLoading(true);
      setAiError(null);

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

      toast({
        title: "Analisis AI siap",
        description: json.cached
          ? "Menggunakan hasil cache (tidak memotong limit)."
          : "Hasil analisis terbaru berhasil dibuat.",
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

  return (
    <DashboardLayout title="Detail Leads">
      <div className="flex min-h-screen flex-col bg-background">
        <main className="mx-auto flex w-full flex-1 flex-col gap-4 px-3 pb-20 pt-3 sm:px-4 md:pb-8">
          {/* RINGKASAN LEAD */}
          <section className="flex flex-col gap-3 rounded-xl border bg-card p-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-base font-semibold">
                {displayName?.charAt(0) || "L"}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold sm:text-base">
                  {displayName}
                </p>
                <p className="text-md text-muted-foreground sm:text-sm">
                  {displayProductName} • {displayCity}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-[12px]">
                    {displaySource}
                  </Badge>
                  <Badge variant="outline" className="text-[12px]">
                    WA: {displayPhone}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 md:w-72">
              <div className="flex items-center justify-between text-md font-medium text-muted-foreground">
                <span>Kelengkapan profil</span>
                <span>{profileCompletion}%</span>
              </div>
              <Progress value={profileCompletion} className="h-2" />
              <div className="flex flex-wrap gap-1 text-[11px]">
                <Badge variant={lead?.phone ? "secondary" : "outline"}>
                  {lead?.phone ? "✔ WA" : "✖ WA"}
                </Badge>
                <Badge variant={lead?.address ? "secondary" : "outline"}>
                  {lead?.address ? "✔ Alamat" : "✖ Alamat"}
                </Badge>
                <Badge variant={lead?.productId ? "secondary" : "outline"}>
                  {lead?.productId ? "✔ Produk" : "✖ Produk"}
                </Badge>
                <Badge variant={lead?.statusId ? "secondary" : "outline"}>
                  {lead?.statusId ? "✔ Status" : "✖ Status"}
                </Badge>
              </div>
            </div>
          </section>

          {/* 4 CARD ATAS */}
          <section className="grid gap-3 md:grid-cols-4">
            {/* Tahap ringkas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm md:text-lg">
                  Tahap Penjualan Aktif
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-md sm:text-sm">
                <div className="space-y-1">
                  <p className="text-xl font-medium">
                    <Badge className="text-sm md:text-xl">
                      {currentStage?.label || "-"}
                    </Badge>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Status lead */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm md:text-lg">
                  Status Lead Saat Ini
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs sm:text-sm flex justify-around flex-wrap items-center">
                <div className="flex items-center gap-2">
                  {statusBadge}
                  {statusUpdating && (
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  )}
                </div>
                <Select
                  value={status}
                  onValueChange={(v) => updateStatus(v as LeadStatusUi)}
                  disabled={statusUpdating}
                >
                  <SelectTrigger className="mt-1 h-9 text-sm md:text-lg">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="cold">Cold</SelectItem>
                    <SelectItem value="warm">Warm</SelectItem>
                    <SelectItem value="hot">Hot</SelectItem>
                    <SelectItem value="won">Close Won</SelectItem>
                    <SelectItem value="lost">Close Lost</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Tindak lanjut ringkas (REAL) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm md:text-lg">
                  Tindak Lanjut Saat Ini
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs sm:text-sm">
                <div className="space-y-0.5">
                  {lastFollowUp ? (
                    <>
                      <p className="font-medium">
                        <Badge className="text-sm md:text-lg bg-blue-500">
                          {lastFollowUp.typeName ||
                            getFollowUpTypeLabel(lastFollowUp.typeCode)}
                        </Badge>
                      </p>
                      <p className="text-[11px] md:text-sm text-muted-foreground mt-2">
                        {lastFollowUp.doneAt
                          ? `Terakhir: ${formatDateTime(lastFollowUp.doneAt)}`
                          : lastFollowUp.nextActionAt
                          ? `Jadwal: ${formatDateTime(
                              lastFollowUp.nextActionAt
                            )}`
                          : "Belum ada tindak lanjut"}
                      </p>
                      {lastFollowUp.channel && (
                        <p className="text-[11px] md:text-sm text-muted-foreground">
                          Aksi:{" "}
                          {followUpChannelLabel(
                            lastFollowUp.channel.toLowerCase()
                          )}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Belum ada tindak lanjut tercatat untuk lead ini
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Produk */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm md:text-lg">
                  Produk yang Diminati
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs sm:text-sm">
                <Select
                  value={lead?.productId ? String(lead.productId) : ""}
                  onValueChange={handleChangeProduct}
                  disabled={updatingProduct || detailLoading}
                >
                  <SelectTrigger className="mt-1 h-9 text-sm md:text-lg">
                    <SelectValue placeholder="Pilih produk" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {updatingProduct && (
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Menyimpan perubahan...
                  </p>
                )}
              </CardContent>
            </Card>
          </section>

          {/* DETAIL & INTERAKSI */}
          <section>
            <Card className="overflow-hidden">
              <CardHeader className="pb-0">
                <CardTitle className="text-base md:text-xl">
                  Detail & Interaksi Lead
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <Tabs defaultValue="whatsapp">
                  <TabsList className="mb-3 w-full justify-start overflow-x-auto">
                    <TabsTrigger
                      value="overview"
                      className="text-xs sm:text-sm"
                    >
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="activity"
                      className="text-xs sm:text-sm"
                    >
                      Aktivitas
                    </TabsTrigger>
                    <TabsTrigger
                      value="whatsapp"
                      className="text-xs sm:text-sm"
                    >
                      WhatsApp
                    </TabsTrigger>
                  </TabsList>

                  {/* OVERVIEW */}
                  <TabsContent value="overview" className="space-y-4 text-sm">
                    <div className="mb-2 flex items-center justify-end">
                      {!overviewEditing ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 text-xs"
                          onClick={() => setOverviewEditing(true)}
                          disabled={detailLoading}
                        >
                          <Pencil className="mr-1 h-3 w-3" />
                          Edit
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                            onClick={handleCancelOverview}
                            disabled={savingOverview}
                          >
                            <X className="mr-1 h-3 w-3" />
                            Batal
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 px-3 text-xs"
                            onClick={handleSaveOverview}
                            disabled={savingOverview}
                          >
                            {savingOverview ? (
                              <>
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                Menyimpan...
                              </>
                            ) : (
                              "Simpan perubahan"
                            )}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* INFORMASI KONTAK */}
                    <div>
                      <p className="mb-1 text-sm md:text-lg font-medium text-muted-foreground">
                        Informasi Kontak
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {/* Nama PIC */}
                        <div>
                          <p className="text-[11px] md:text-sm text-muted-foreground">
                            Nama
                          </p>
                          {overviewEditing ? (
                            <Input
                              className="mt-1 h-9 text-xs sm:text-sm"
                              value={overviewName}
                              onChange={(e) => setOverviewName(e.target.value)}
                            />
                          ) : (
                            <p className="text-xs sm:text-sm">{displayName}</p>
                          )}
                        </div>

                        {/* WhatsApp */}
                        <div>
                          <p className="text-[11px] md:text-sm text-muted-foreground">
                            WhatsApp
                          </p>
                          {overviewEditing ? (
                            <Input
                              className="mt-1 h-9 text-xs sm:text-sm"
                              value={overviewPhone}
                              onChange={(e) => setOverviewPhone(e.target.value)}
                              placeholder="62xxxxxxxxxxx"
                            />
                          ) : (
                            <p className="text-xs sm:text-sm">{displayPhone}</p>
                          )}
                        </div>

                        {/* Sumber Lead (hanya view, karena master-nya sendiri) */}
                        <div>
                          <p className="text-[11px] md:text-sm text-muted-foreground">
                            Sumber Lead
                          </p>
                          <p className="text-xs sm:text-sm">{displaySource}</p>
                        </div>

                        {/* Alamat */}
                        <div>
                          <p className="text-[11px] md:text-sm text-muted-foreground">
                            Alamat
                          </p>
                          {overviewEditing ? (
                            <Textarea
                              rows={2}
                              className="mt-1 text-xs sm:text-sm"
                              value={overviewAddress}
                              onChange={(e) =>
                                setOverviewAddress(e.target.value)
                              }
                            />
                          ) : (
                            <p className="text-xs sm:text-sm">{displayCity}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* INFORMASI PRODUK & STATUS */}
                    <div>
                      <p className="mb-1 text-sm md:text-lg font-medium text-muted-foreground">
                        Informasi Produk
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {/* Produk */}
                        <div>
                          <p className="text-[11px] md:text-sm text-muted-foreground">
                            Produk
                          </p>
                          {overviewEditing ? (
                            <Select
                              value={overviewProductId}
                              onValueChange={(v) => setOverviewProductId(v)}
                              disabled={updatingProduct || detailLoading}
                            >
                              <SelectTrigger className="mt-1 h-9 text-xs sm:text-sm">
                                <SelectValue placeholder="Pilih produk" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((p) => (
                                  <SelectItem key={p.id} value={String(p.id)}>
                                    {p.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-xs sm:text-sm">
                              {displayProductName}
                            </p>
                          )}
                        </div>

                        {/* Status */}
                        <div>
                          <p className="text-[11px] md:text-sm text-muted-foreground">
                            Status
                          </p>
                          <p className="text-xs sm:text-sm font-medium">
                            {lead?.status?.name || "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* INFORMASI HARGA */}
                    <div>
                      <p className="mb-1 text-sm md:text-lg font-medium text-muted-foreground">
                        Informasi Harga
                      </p>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <div>
                          <p className="text-[11px] md:text-sm text-muted-foreground">
                            Harga Penawaran
                          </p>
                          <p className="text-xs sm:text-sm font-medium">
                            {formatCurrencyIDR(lead?.priceOffering)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] md:text-sm text-muted-foreground">
                            Harga Negosiasi
                          </p>
                          <p className="text-xs sm:text-sm font-medium">
                            {formatCurrencyIDR(lead?.priceNegotiation)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] md:text-sm text-muted-foreground">
                            Harga Closing
                          </p>
                          <p className="text-xs sm:text-sm font-medium">
                            {formatCurrencyIDR(lead?.priceClosing)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* FIELD DINAMIS */}
                    {dynamicFields.length > 0 && (
                      <div>
                        <p className="mb-1 text-sm md:text-lg font-medium text-muted-foreground">
                          Informasi Tambahan
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {dynamicFields.map((f) => {
                            const value = overviewCustomValues[f.id] ?? "";
                            const requiredMark = f.isRequired ? " *" : "";

                            if (!overviewEditing) {
                              return (
                                <div key={f.id}>
                                  <p className="text-[11px] md:text-sm text-muted-foreground">
                                    {f.label}
                                  </p>
                                  <p className="text-xs sm:text-sm">
                                    {value || "-"}
                                  </p>
                                </div>
                              );
                            }

                            // mode edit
                            switch (f.type) {
                              case "TEXTAREA":
                                return (
                                  <div key={f.id}>
                                    <p className="text-[11px] md:text-sm text-muted-foreground">
                                      {f.label}
                                      {requiredMark}
                                    </p>
                                    <Textarea
                                      rows={3}
                                      className="mt-1 text-xs sm:text-sm"
                                      value={value}
                                      onChange={(e) =>
                                        setCustomValue(f.id, e.target.value)
                                      }
                                    />
                                  </div>
                                );
                              case "NUMBER":
                                return (
                                  <div key={f.id}>
                                    <p className="text-[11px] md:text-sm text-muted-foreground">
                                      {f.label}
                                      {requiredMark}
                                    </p>
                                    <Input
                                      type="number"
                                      className="mt-1 h-9 text-xs sm:text-sm"
                                      value={value}
                                      onChange={(e) =>
                                        setCustomValue(f.id, e.target.value)
                                      }
                                    />
                                  </div>
                                );
                              case "DATE":
                                return (
                                  <div key={f.id}>
                                    <p className="text-[11px] md:text-sm text-muted-foreground">
                                      {f.label}
                                      {requiredMark}
                                    </p>
                                    <Input
                                      type="date"
                                      className="mt-1 h-9 text-xs sm:text-sm"
                                      value={value}
                                      onChange={(e) =>
                                        setCustomValue(f.id, e.target.value)
                                      }
                                    />
                                  </div>
                                );
                              case "SINGLE_SELECT":
                                return (
                                  <div key={f.id}>
                                    <p className="text-[11px] md:text-sm text-muted-foreground">
                                      {f.label}
                                      {requiredMark}
                                    </p>
                                    <Select
                                      value={value}
                                      onValueChange={(v) =>
                                        setCustomValue(f.id, v)
                                      }
                                    >
                                      <SelectTrigger className="mt-1 h-9 text-xs sm:text-sm">
                                        <SelectValue placeholder="Pilih" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {f.options?.map((opt) => (
                                          <SelectItem
                                            key={opt.value}
                                            value={opt.value}
                                          >
                                            {opt.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                );
                              case "MULTI_SELECT": {
                                let selected: string[] = [];
                                try {
                                  selected = value ? JSON.parse(value) : [];
                                } catch {
                                  selected = [];
                                }
                                return (
                                  <div key={f.id} className="space-y-1">
                                    <p className="text-[11px] md:text-sm text-muted-foreground">
                                      {f.label}
                                      {requiredMark}
                                    </p>
                                    <div className="flex flex-wrap gap-2 rounded-md border bg-background/60 p-2">
                                      {f.options?.map((opt) => {
                                        const active = selected.includes(
                                          opt.value
                                        );
                                        return (
                                          <Button
                                            key={opt.value}
                                            type="button"
                                            size="sm"
                                            variant={
                                              active ? "default" : "outline"
                                            }
                                            className="h-7 px-2 text-[11px]"
                                            onClick={() => {
                                              const next = active
                                                ? selected.filter(
                                                    (s) => s !== opt.value
                                                  )
                                                : [...selected, opt.value];
                                              setCustomValue(
                                                f.id,
                                                JSON.stringify(next)
                                              );
                                            }}
                                          >
                                            {opt.label}
                                          </Button>
                                        );
                                      })}
                                      {!f.options?.length && (
                                        <p className="text-[11px] md:text-sm text-muted-foreground">
                                          Belum ada pilihan.
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                              case "TEXT":
                              default:
                                return (
                                  <div key={f.id}>
                                    <p className="text-[11px] md:text-sm text-muted-foreground">
                                      {f.label}
                                      {requiredMark}
                                    </p>
                                    <Input
                                      className="mt-1 h-9 text-xs sm:text-sm"
                                      value={value}
                                      onChange={(e) =>
                                        setCustomValue(f.id, e.target.value)
                                      }
                                    />
                                  </div>
                                );
                            }
                          })}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* AKTIVITAS */}
                  <TabsContent value="activity" className="space-y-3 text-sm">
                    <div className="flex items-center justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActivityModalOpen(true)}
                      >
                        Tambah Aktivitas
                      </Button>
                    </div>

                    {activitiesLoading ? (
                      <p className="text-sm text-muted-foreground">
                        Memuat aktivitas...
                      </p>
                    ) : activities.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Belum ada aktivitas tercatat untuk lead ini.
                      </p>
                    ) : (
                      <div className="max-h-80 space-y-2 overflow-y-auto rounded-md border bg-background/80 p-2">
                        {activities.map((a) => (
                          <div
                            key={a.id}
                            className="flex gap-3 rounded-md border bg-background/80 p-2"
                          >
                            <div className="mt-0.5">
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
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs md:text-sm font-medium">
                                  {a.title}
                                </p>
                                <span className="text-[11px] md:text-sm text-muted-foreground">
                                  {formatDateTime(a.at)}
                                </span>
                              </div>
                              {/* preview foto kecil untuk aktivitas yang punya foto */}
                              {a.kind === "ACTIVITY" && a.photoUrl && (
                                <button
                                  type="button"
                                  className="shrink-0 overflow-hidden rounded-md border bg-muted/40"
                                  onClick={() => handleOpenActivityPreview(a)}
                                >
                                  {/* @ts-ignore */}
                                  <img
                                    src={a.photoUrl}
                                    alt={a.title}
                                    className="h-12 w-12 object-cover"
                                  />
                                </button>
                              )}
                              {a.description && (
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                  {a.description}
                                </p>
                              )}
                              {a.createdByName && (
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                  Dibuat oleh {a.createdByName}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* WHATSAPP */}
                  <TabsContent value="whatsapp" className="space-y-3 text-sm">
                    {/* Info WA header */}
                    <div className="flex flex-col gap-2 rounded-md bg-muted/60 p-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-semibold text-emerald-700">
                          WA
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-sm md:text-lg font-medium">
                            Chat dengan {displayName}
                          </p>
                          <p className="text-[11px] md:text-sm text-muted-foreground">
                            {displayPhone !== "-"
                              ? displayPhone
                              : "Nomor WA belum diisi"}{" "}
                          </p>
                        </div>
                      </div>
                      {/* <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 text-xs"
                        >
                          <Phone className="mr-1 h-3 w-3" />
                          Telepon
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 text-xs"
                        >
                          <Sparkles className="mr-1 h-3 w-3" />
                          Template
                        </Button>
                      </div> */}
                    </div>

                    {/* QUICK ACTIONS DI ATAS CHAT */}
                    <div className="space-y-2 rounded-md border bg-muted/40 p-2">
                      {/* Quick Status */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] md:text-sm text-muted-foreground">
                          Status lead:
                        </span>
                        {statusBadge}
                        <div className="flex flex-wrap gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px] md:text-sm"
                            onClick={() => handleQuickStatus("new")}
                          >
                            New
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px] md:text-sm"
                            onClick={() => handleQuickStatus("cold")}
                          >
                            Cold
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px] md:text-sm"
                            onClick={() => handleQuickStatus("warm")}
                          >
                            Warm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px] md:text-sm"
                            onClick={() => handleQuickStatus("hot")}
                          >
                            Hot
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px] md:text-sm"
                            onClick={() => handleQuickStatus("won")}
                          >
                            Close Won
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px] md:text-sm"
                            onClick={() => handleQuickStatus("lost")}
                          >
                            Close Lost
                          </Button>
                        </div>
                      </div>

                      {/* Quick Tindak Lanjut (buka modal + tandai selesai) */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-[11px] md:text-sm text-muted-foreground">
                          <div>
                            Tindak lanjut:{" "}
                            <span className="font-medium text-foreground">
                              {lastFollowUp
                                ? lastFollowUp.typeName ||
                                  getFollowUpTypeLabel(lastFollowUp.typeCode)
                                : "Belum ada"}
                            </span>
                          </div>

                          {lastFollowUp ? (
                            lastFollowUp.doneAt ? (
                              <div>
                                Terakhir: {formatDateTime(lastFollowUp.doneAt)}{" "}
                                (
                                {followUpChannelLabel(
                                  lastFollowUp.channel.toLowerCase()
                                )}
                                )
                              </div>
                            ) : lastFollowUp.nextActionAt ? (
                              <div>
                                Jadwal:{" "}
                                {formatDateTime(lastFollowUp.nextActionAt)} (
                                {followUpChannelLabel(
                                  lastFollowUp.channel.toLowerCase()
                                )}
                                )
                              </div>
                            ) : (
                              <div>
                                Sudah ada tindak lanjut, tanpa jadwal
                                berikutnya.
                              </div>
                            )
                          ) : (
                            <div>Belum ada jadwal tersimpan.</div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {/* Tombol Tandai selesai → hanya muncul kalau sudah ada follow up & belum done */}
                          {lastFollowUp && !lastFollowUp.doneAt && (
                            <Button
                              size="sm"
                              className="h-8 px-3 text-xs"
                              onClick={() =>
                                handleMarkFollowUpDone(lastFollowUp.id)
                              }
                              disabled={markingFollowUpDone}
                            >
                              {markingFollowUpDone ? (
                                <>
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                  Menyimpan...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  Tandai selesai
                                </>
                              )}
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs"
                            onClick={() => setScheduleModalOpen(true)}
                          >
                            Atur tindak lanjut
                          </Button>
                        </div>
                      </div>

                      {/* Quick Harga */}
                      <div className="flex flex-col gap-2 rounded-md bg-background/60 p-2 border-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="space-y-1">
                            <p className="text-[11px] md:text-sm text-muted-foreground font-semibold">
                              Harga saat ini
                            </p>
                            <div className="grid gap-2 md:gap-4 text-[11px] md:text-sm sm:grid-cols-3">
                              <div>
                                <p className="text-[10px] md:text-xs uppercase tracking-wide text-muted-foreground">
                                  Penawaran
                                </p>
                                <p className="font-medium">
                                  {formatCurrencyIDR(lead?.priceOffering)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] md:text-xs uppercase tracking-wide text-muted-foreground">
                                  Nego
                                </p>
                                <p className="font-medium">
                                  {formatCurrencyIDR(lead?.priceNegotiation)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] md:text-xs uppercase tracking-wide text-muted-foreground">
                                  Closing
                                </p>
                                <p className="font-medium">
                                  {formatCurrencyIDR(lead?.priceClosing)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="default"
                            className="h-8 whitespace-nowrap px-3 text-xs"
                            onClick={handleOpenPriceModal}
                          >
                            Input / update harga
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Chat + Quick Tahapan di kanan */}
                    <div className="flex flex-col gap-3 lg:flex-row">
                      {/* CHAT PANEL */}
                      <div className="flex-1">
                        <Card className="overflow-hidden py-0 gap-0 border-[#202C33] bg-[#111B21]">
                          {/* Header sticky */}
                          <CardHeader className="sticky top-0 z-10 border-b border-[#202C33] bg-[#202C33] p-3">
                            <div className="flex items-center justify-between gap-3 mt-3">
                              {/* Left: avatar + name */}
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-[#005C4B] flex items-center justify-center text-white font-bold">
                                  WA
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-sm md:text-base font-semibold text-[#E9EDEF]">
                                    Chat dengan {displayName}
                                  </p>
                                  <p className="text-xs md:text-sm text-[#8696A0]">
                                    {displayPhone !== "-"
                                      ? displayPhone
                                      : "Nomor WA belum diisi"}
                                  </p>
                                </div>
                              </div>

                              {/* Right: sync button */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 text-sm border-[#2A3942] bg-[#111B21] text-[#E9EDEF] hover:bg-[#1F2C33]"
                                onClick={handleSyncChat}
                                disabled={syncingChat || !lead?.phone}
                                title={
                                  !lead?.phone
                                    ? "Lead belum punya nomor WA"
                                    : "Ambil histori chat dari WhatsApp"
                                }
                              >
                                {syncingChat ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Sparkles className="mr-2 h-4 w-4" />
                                )}
                                {syncingChat ? "Sync..." : "Sync Chat"}
                              </Button>
                            </div>
                          </CardHeader>

                          {/* Body chat (scroll) */}
                          <CardContent className="p-0">
                            <div
                              className="h-[420px] sm:h-[520px]"
                              style={{
                                backgroundColor: "#0B141A",
                                backgroundImage:
                                  `url("data:image/svg+xml,` +
                                  encodeURIComponent(`
              <svg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'>
                <g fill='none' stroke='rgba(255,255,255,0.08)' stroke-width='1.5'>
                  <path d='M28 44c16-10 28-10 44 0' />
                  <path d='M168 44c16-10 28-10 44 0' />
                  <path d='M40 132c18-12 30-12 48 0' />
                  <path d='M150 140c18-12 30-12 48 0' />
                  <circle cx='70' cy='86' r='9' />
                  <circle cx='184' cy='94' r='9' />
                  <path d='M112 76l14 14-14 14-14-14z' />
                  <path d='M120 170c10-8 22-8 32 0' />
                  <path d='M20 200c14-10 26-10 40 0' />
                </g>
              </svg>
            `) +
                                  `")`,
                                backgroundRepeat: "repeat",
                              }}
                            >
                              <div
                                ref={chatWrapRef}
                                className="flex h-full flex-col gap-2 overflow-y-auto px-3 py-3"
                              >
                                {messagesLoading && (
                                  <div className="flex flex-1 items-center justify-center text-sm text-[#8696A0]">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Memuat percakapan...
                                  </div>
                                )}

                                {!messagesLoading &&
                                  chatMessages.length === 0 && (
                                    <div className="flex flex-1 items-center justify-center text-sm text-[#8696A0]">
                                      Belum ada percakapan WhatsApp.
                                    </div>
                                  )}

                                {chatMessages.map((m) => {
                                  const isSales = m.from === "sales";

                                  return (
                                    <div
                                      key={m.id}
                                      className={`flex ${
                                        isSales
                                          ? "justify-end"
                                          : "justify-start"
                                      }`}
                                    >
                                      <div
                                        className={[
                                          "relative max-w-[85%] px-3 py-2 shadow-sm",
                                          "text-sm leading-relaxed",

                                          // bubble color
                                          isSales
                                            ? "bg-[#005C4B] text-[#E9EDEF] rounded-2xl rounded-br-sm"
                                            : "bg-[#202C33] text-[#E9EDEF] rounded-2xl rounded-bl-sm",

                                          // tail
                                          isSales
                                            ? "after:content-[''] after:absolute after:-right-1 after:bottom-2 after:border-y-[7px] after:border-y-transparent after:border-l-[9px] after:border-l-[#005C4B]"
                                            : "after:content-[''] after:absolute after:-left-1 after:bottom-2 after:border-y-[7px] after:border-y-transparent after:border-r-[9px] after:border-r-[#202C33]",
                                        ].join(" ")}
                                      >
                                        {m.type === "MEDIA" && m.mediaUrl ? (
                                          <a
                                            href={m.mediaUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={[
                                              "mb-2 flex items-center gap-2 rounded-lg border px-2 py-2",
                                              isSales
                                                ? "border-white/15 bg-white/10 text-[#E9EDEF]"
                                                : "border-[#2A3942] bg-[#111B21] text-[#E9EDEF]",
                                            ].join(" ")}
                                          >
                                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-black/10">
                                              📄
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <p className="truncate text-sm font-semibold">
                                                {m.mediaName || "Lampiran"}
                                              </p>
                                              <p className="text-xs text-[#8696A0]">
                                                Klik untuk buka
                                              </p>
                                            </div>
                                          </a>
                                        ) : null}

                                        {m.text ? (
                                          <p className="whitespace-pre-line">
                                            {m.text}
                                          </p>
                                        ) : null}

                                        <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-[#8696A0]">
                                          <span>{m.time}</span>
                                          {isSales ? (
                                            <MessageStatusIcon
                                              status={m.waStatus}
                                              className={
                                                m.waStatus === "READ"
                                                  ? "text-[#53BDEB]"
                                                  : "text-[#8696A0]"
                                              }
                                            />
                                          ) : null}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </CardContent>

                          {/* Composer sticky */}
                          <div className="sticky bottom-0 border-t border-[#202C33] bg-[#202C33]">
                            <div className="p-3 space-y-2">
                              {/* Row 1: emoji + input + send */}
                              <div className="flex items-end gap-2">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      className="h-11 w-11 shrink-0 text-[#8696A0] hover:bg-[#1F2C33]"
                                      title="Emoji"
                                    >
                                      <Smile className="h-5 w-5" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    align="start"
                                    className="w-64 p-2"
                                  >
                                    <div className="grid grid-cols-8 gap-1">
                                      {EMOJIS.map((e) => (
                                        <button
                                          key={e}
                                          type="button"
                                          className="rounded-md p-1 text-lg hover:bg-muted"
                                          onClick={() => insertAtCursor(e)}
                                        >
                                          {e}
                                        </button>
                                      ))}
                                    </div>
                                  </PopoverContent>
                                </Popover>

                                <Textarea
                                  ref={chatInputRef}
                                  rows={1}
                                  className="min-h-[44px] resize-none bg-[#2A3942] text-[#E9EDEF] placeholder:text-[#8696A0] border-none focus:ring-0 text-sm rounded-2xl"
                                  placeholder="Ketik pesan"
                                  value={chatInput}
                                  onChange={(e) => setChatInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      if (!sending && chatInput.trim())
                                        void handleSend();
                                    }
                                  }}
                                />

                                <Button
                                  type="button"
                                  size="icon"
                                  className="h-11 w-11 rounded-full bg-[#005C4B] hover:bg-[#006D5B]"
                                  onClick={handleSend}
                                  disabled={!chatInput.trim() || sending}
                                  title="Kirim"
                                >
                                  {sending ? (
                                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                                  ) : (
                                    <SendHorizonal className="h-5 w-5 text-white" />
                                  )}
                                </Button>
                              </div>

                              {/* Row 2: actions (optional) */}
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-3 text-sm border-[#2A3942] bg-[#111B21] text-[#E9EDEF] hover:bg-[#1F2C33]"
                                  onClick={() => setProposalModalOpen(true)}
                                >
                                  <FileText className="mr-2 h-4 w-4" />
                                  Kirim PDF
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-3 text-sm border-[#2A3942] bg-[#111B21] text-[#E9EDEF] hover:bg-[#1F2C33]"
                                  onClick={() => setScheduleModalOpen(true)}
                                >
                                  Follow up
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>

                        {/* ===== AI INSIGHT + REPLIES ===== */}
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
                              Klik <b>Analisis</b> untuk mendapatkan ringkasan
                              percakapan + tindakan yang disarankan.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {/* Summary */}
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
                                <p className="text-[12px]">
                                  {aiData.leadIntent}
                                </p>
                              </div>

                              {/* Next Actions */}
                              <div className="rounded-md border bg-background/70 p-2">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-[11px] text-muted-foreground font-semibold">
                                    Tindakan Disarankan
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px]"
                                  >
                                    {aiData.nextActions?.length ?? 0} items
                                  </Badge>
                                </div>

                                <div className="space-y-2">
                                  {aiData.nextActions
                                    ?.slice(0, 5)
                                    .map((a, idx) => (
                                      <div
                                        key={idx}
                                        className="rounded-md border bg-muted/30 p-2"
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <p className="text-[12px] font-semibold">
                                            {a.title}
                                          </p>
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

                              {/* Reply drafts */}
                              <div className="rounded-md border bg-background/70 p-2">
                                <p className="text-[11px] text-muted-foreground font-semibold mb-2">
                                  Draft Balasan WA
                                </p>

                                <div className="space-y-2">
                                  {aiData.suggestedReplies
                                    ?.slice(0, 3)
                                    .map((r, idx) => (
                                      <div
                                        key={idx}
                                        className="rounded-md border bg-muted/30 p-2"
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <Badge
                                            variant="secondary"
                                            className="text-[10px]"
                                          >
                                            {r.tone}
                                          </Badge>

                                          <div className="flex gap-1">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-7 px-2 text-[11px]"
                                              onClick={() =>
                                                copyToClipboard(r.text)
                                              }
                                            >
                                              Copy
                                            </Button>

                                            {/* opsional: kalau kamu mau tombol "Gunakan" */}
                                            {/* <Button
                    size="sm"
                    className="h-7 px-2 text-[11px]"
                    onClick={() => useAiReply(r.text)}
                  >
                    Gunakan
                  </Button> */}
                                          </div>
                                        </div>

                                        <p className="mt-2 text-[12px] whitespace-pre-line leading-relaxed">
                                          {r.text}
                                        </p>
                                      </div>
                                    ))}
                                </div>
                              </div>

                              {/* Optional: Objections & Missing Info */}
                              {aiData.objections?.length ||
                              aiData.missingInfo?.length ? (
                                <div className="rounded-md border bg-background/70 p-2 space-y-2">
                                  {aiData.objections?.length ? (
                                    <div>
                                      <p className="text-[11px] text-muted-foreground font-semibold">
                                        Keberatan
                                      </p>
                                      <ul className="mt-1 list-disc pl-4 text-[11px] text-muted-foreground">
                                        {aiData.objections
                                          .slice(0, 4)
                                          .map((x, i) => (
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
                                        {aiData.missingInfo
                                          .slice(0, 4)
                                          .map((x, i) => (
                                            <li key={i}>{x}</li>
                                          ))}
                                      </ul>
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* QUICK PANEL DI KANAN */}
                      <div className="w-full space-y-3 lg:w-72">
                        {/* AI ANALYSIS CARD */}
                        <Card className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm md:text-lg flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-violet-500" />
                                AI Analisis Chat
                              </span>
                              {aiData?.statusHint ? (
                                <Badge
                                  className={`rounded-full ${statusHintBadgeClass(
                                    aiData.statusHint
                                  )}`}
                                >
                                  {aiData.statusHint}
                                </Badge>
                              ) : null}
                            </CardTitle>
                          </CardHeader>

                          <CardContent className="space-y-3 text-xs sm:text-sm">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="h-8 px-3 text-xs flex-1"
                                onClick={() => handleAnalyzeChat(60)}
                                disabled={aiLoading || !lead?.phone}
                                title={
                                  !lead?.phone
                                    ? "Lead belum punya nomor WA"
                                    : "Analisis 60 pesan terakhir"
                                }
                              >
                                {aiLoading ? (
                                  <>
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                    Menganalisis...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="mr-2 h-3 w-3" />
                                    Analisis (60)
                                  </>
                                )}
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 text-xs"
                                onClick={() => handleAnalyzeChat(120)}
                                disabled={aiLoading || !lead?.phone}
                                title="Analisis lebih panjang (120 pesan)"
                              >
                                120
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        {/* QUICK TAHAPAN DI KANAN */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm md:text-lg">
                              Quick Tahapan
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-xs sm:text-sm">
                            <div className="space-y-1.5 rounded-md border bg-muted/40 p-2">
                              <p className="text-[11px] md:text-sm">
                                Tahap aktif:{" "}
                                <span className="font-medium">
                                  {currentStage?.label || "-"}
                                </span>
                              </p>
                              {stageUpdating && (
                                <p className="flex items-center gap-1 text-[11px] md:text-sm text-muted-foreground">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Menyimpan tahapan...
                                </p>
                              )}
                              <div className="mt-1 flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  className="h-7 px-2 text-[11px] md:text-sm"
                                  onClick={handleStageDone}
                                  disabled={stageUpdating || !currentStage}
                                >
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  Tandai selesai & lanjut
                                </Button>
                                {/* <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-[11px] md:text-sm"
                                  onClick={handleGoToNextStage}
                                  disabled={stageUpdating || !currentStage}
                                >
                                  Tahap berikutnya
                                </Button> */}
                              </div>
                            </div>

                            <button
                              type="button"
                              className="mt-2 flex w-full items-center justify-between rounded-md border bg-background px-2 py-1.5 text-[11px] md:text-sm text-muted-foreground hover:bg-muted/70"
                              onClick={() =>
                                setTimelineExpanded((prev) => !prev)
                              }
                            >
                              <span>
                                {timelineExpanded
                                  ? "Sembunyikan riwayat tahapan"
                                  : "Lihat riwayat tahapan lengkap"}
                              </span>
                              {timelineExpanded ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </button>

                            {timelineExpanded && (
                              <div className="mt-2 max-h-72 overflow-y-auto rounded-md border bg-background/90 p-2">
                                <StageTimeline
                                  stages={stages}
                                  currentStageId={currentStageId}
                                  onMarkDone={markStageDone}
                                  savingStageId={stageChecklistSaving}
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* MODAL TINDAK LANJUT */}
                    <Dialog
                      open={scheduleModalOpen}
                      onOpenChange={setScheduleModalOpen}
                    >
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Atur tindak lanjut</DialogTitle>
                          <DialogDescription>
                            Tentukan jenis tindak lanjut, jadwal, dan Aksi untuk
                            lead ini.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="mt-3 space-y-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Step / jenis tindak lanjut
                            </p>
                            <Select
                              value={followUpTypeCode}
                              onValueChange={(v) => setFollowUpTypeCode(v)}
                            >
                              <SelectTrigger className="mt-1 h-9">
                                <SelectValue placeholder="Pilih tindak lanjut" />
                              </SelectTrigger>
                              <SelectContent>
                                {followUpTypes.map((t) => (
                                  <SelectItem key={t.id} value={t.code}>
                                    {t.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Tanggal
                              </p>
                              <Input
                                type="date"
                                className="mt-1 h-9"
                                value={followUpDate}
                                onChange={(e) =>
                                  setFollowUpDate(e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Jam
                              </p>
                              <Input
                                type="time"
                                className="mt-1 h-9"
                                value={followUpTime}
                                onChange={(e) =>
                                  setFollowUpTime(e.target.value)
                                }
                              />
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">
                              Aksi
                            </p>
                            <Select
                              value={followUpChannel}
                              onValueChange={(v) =>
                                setFollowUpChannel(
                                  v as "wa" | "call" | "zoom" | "visit"
                                )
                              }
                            >
                              <SelectTrigger className="mt-1 h-9">
                                <SelectValue placeholder="Pilih Aksi" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="wa">WhatsApp</SelectItem>
                                <SelectItem value="call">Telepon</SelectItem>
                                <SelectItem value="zoom">Zoom</SelectItem>
                                <SelectItem value="visit">Kunjungan</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">
                              Catatan tindak lanjut
                            </p>
                            <Textarea
                              rows={3}
                              className="mt-1"
                              placeholder="Contoh: Follow up final sebelum kirim invoice, pastikan sudah oke dengan paket profesional."
                              value={followUpNote}
                              onChange={(e) => setFollowUpNote(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter className="mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setScheduleModalOpen(false)}
                          >
                            Batal
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveFollowUp}
                            disabled={savingFollowUp}
                          >
                            {savingFollowUp ? (
                              <>
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                Menyimpan...
                              </>
                            ) : (
                              "Simpan"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* MODAL KIRIM PROPOSAL (PDF) */}
                    <Dialog
                      open={proposalModalOpen}
                      onOpenChange={(open) => {
                        setProposalModalOpen(open);
                        if (!open) {
                          setProposalFile(null);
                          setProposalCaption("");
                          if (proposalFileInputRef.current) {
                            proposalFileInputRef.current.value = "";
                          }
                        }
                      }}
                    >
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Kirim penawaran (PDF)</DialogTitle>
                          <DialogDescription>
                            Upload file proposal dalam bentuk PDF dan kirim
                            langsung ke WhatsApp lead ini.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="mt-3 space-y-4 text-sm">
                          <div className="space-y-2">
                            <Label className="text-xs">
                              File penawaran (PDF)
                            </Label>

                            <input
                              ref={proposalFileInputRef}
                              type="file"
                              accept="application/pdf"
                              className="hidden"
                              onChange={handleProposalFileChange}
                            />

                            {proposalFile ? (
                              <div className="flex items-start gap-3 rounded-xl border border-dashed border-muted bg-muted/40 p-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                  <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1 space-y-1">
                                  <p className="text-sm font-medium">
                                    {proposalFile.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatFileSize(proposalFile.size)} • PDF
                                  </p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        proposalFileInputRef.current?.click()
                                      }
                                      disabled={proposalUploading}
                                    >
                                      Ganti file
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 hover:bg-red-50"
                                      onClick={handleClearProposalFile}
                                      disabled={proposalUploading}
                                    >
                                      Hapus
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div
                                className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed border-muted bg-muted/30 p-4 text-center hover:border-primary/60 hover:bg-primary/5 md:flex-row md:text-left"
                                onClick={() =>
                                  proposalFileInputRef.current?.click()
                                }
                                onDragOver={handleProposalDragOver}
                                onDrop={handleProposalDrop}
                              >
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                                  <FileText className="h-7 w-7 text-primary" />
                                </div>
                                <div className="flex-1 space-y-1">
                                  <p className="text-sm font-medium">
                                    {proposalUploading
                                      ? "Mengupload file..."
                                      : "Upload file proposal (PDF)"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Klik atau seret & lepas file ke sini. Format
                                    PDF, ukuran maksimal 5MB.
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    proposalFileInputRef.current?.click();
                                  }}
                                  disabled={proposalUploading}
                                >
                                  Pilih file
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">
                              Pesan pendamping (opsional)
                            </Label>
                            <Textarea
                              rows={3}
                              className="mt-1 text-sm"
                              placeholder="Contoh: Berikut kami lampirkan penawaran paket profesional Agile Store untuk bisnis Anda."
                              value={proposalCaption}
                              onChange={(e) =>
                                setProposalCaption(e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <DialogFooter className="mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setProposalModalOpen(false)}
                            disabled={proposalUploading}
                          >
                            Batal
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSendProposal}
                            disabled={proposalUploading || !proposalFile}
                          >
                            {proposalUploading ? (
                              <>
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                Mengirim...
                              </>
                            ) : (
                              "Kirim ke WhatsApp"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TabsContent>

                  {/* MODAL TAMBAH AKTIVITAS MANUAL */}
                  <Dialog
                    open={activityModalOpen}
                    onOpenChange={(open) => {
                      setActivityModalOpen(open);
                      if (!open) {
                        setActivityTitle("");
                        setActivityDate("");
                        setActivityTime("");
                        setActivityDescription("");
                        setActivityPhoto(null);
                        setActivityPhotoPreview(null);
                        if (activityFileInputRef.current) {
                          activityFileInputRef.current.value = "";
                        }
                      }
                    }}
                  >
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Tambah Aktivitas Lead</DialogTitle>
                        <DialogDescription>
                          Catat aktivitas penting (kunjungan, meeting, demo,
                          dsb) dan lampirkan foto bila perlu.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="mt-3 space-y-3 text-sm">
                        <div>
                          <Label className="text-xs">Judul aktivitas</Label>
                          <Input
                            className="mt-1 h-9"
                            placeholder="Contoh: Kunjungan ke toko cabang A"
                            value={activityTitle}
                            onChange={(e) => setActivityTitle(e.target.value)}
                          />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <Label className="text-xs">Tanggal</Label>
                            <Input
                              type="date"
                              className="mt-1 h-9"
                              value={activityDate}
                              onChange={(e) => setActivityDate(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Jam</Label>
                            <Input
                              type="time"
                              className="mt-1 h-9"
                              value={activityTime}
                              onChange={(e) => setActivityTime(e.target.value)}
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs">Deskripsi</Label>
                          <Textarea
                            rows={3}
                            className="mt-1 text-sm"
                            placeholder="Contoh: Menjelaskan paket profesional, calon pelanggan tertarik untuk trial 7 hari."
                            value={activityDescription}
                            onChange={(e) =>
                              setActivityDescription(e.target.value)
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">
                            Foto aktivitas (opsional)
                          </Label>

                          <input
                            ref={activityFileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleActivityPhotoChange}
                          />

                          {activityPhotoPreview ? (
                            <div className="flex items-start gap-3 rounded-xl border border-dashed border-muted bg-muted/40 p-3">
                              <button
                                type="button"
                                className="overflow-hidden rounded-lg border bg-background"
                                onClick={() => {
                                  setSelectedActivity({
                                    id: "new",
                                    kind: "ACTIVITY",
                                    title: activityTitle || "Preview foto",
                                    description:
                                      activityDescription || "Preview foto",
                                    at: new Date().toISOString(),
                                    photoUrl: activityPhotoPreview,
                                  });
                                  setActivityPreviewOpen(true);
                                }}
                              >
                                {/* @ts-ignore */}
                                <img
                                  src={activityPhotoPreview}
                                  alt="Foto aktivitas"
                                  className="h-20 w-20 object-cover"
                                />
                              </button>
                              <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium">
                                  {activityPhoto?.name || "Foto aktivitas"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {activityPhoto
                                    ? formatFileSize(activityPhoto.size)
                                    : ""}{" "}
                                  • Gambar
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      activityFileInputRef.current?.click()
                                    }
                                    disabled={activitySaving}
                                  >
                                    Ganti foto
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:bg-red-50"
                                    onClick={handleClearActivityPhoto}
                                    disabled={activitySaving}
                                  >
                                    Hapus
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed border-muted bg-muted/30 p-4 text-center hover:border-primary/60 hover:bg-primary/5 md:flex-row md:text-left"
                              onClick={() =>
                                activityFileInputRef.current?.click()
                              }
                              onDragOver={handleActivityDragOver}
                              onDrop={handleActivityDrop}
                            >
                              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                                <Sparkles className="h-7 w-7 text-primary" />
                              </div>
                              <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium">
                                  Upload foto aktivitas (opsional)
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Klik atau seret & lepas foto ke sini. Format
                                  JPG/PNG, ukuran maksimal 2MB.
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  activityFileInputRef.current?.click();
                                }}
                                disabled={activitySaving}
                              >
                                Pilih foto
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      <DialogFooter className="mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActivityModalOpen(false)}
                          disabled={activitySaving}
                        >
                          Batal
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveActivity}
                          disabled={activitySaving}
                        >
                          {activitySaving ? (
                            <>
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                              Menyimpan...
                            </>
                          ) : (
                            "Simpan Aktivitas"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* MODAL PREVIEW FOTO AKTIVITAS */}
                  <Dialog
                    open={activityPreviewOpen}
                    onOpenChange={setActivityPreviewOpen}
                  >
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>
                          {selectedActivity?.title || "Detail Aktivitas"}
                        </DialogTitle>
                        <DialogDescription>
                          {selectedActivity
                            ? formatDateTime(selectedActivity.at)
                            : ""}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        {selectedActivity?.photoUrl && (
                          <div className="overflow-hidden rounded-xl border bg-black/5">
                            {/* @ts-ignore */}
                            <img
                              src={selectedActivity.photoUrl}
                              alt={selectedActivity.title}
                              className="max-h-[400px] w-full object-contain"
                            />
                          </div>
                        )}
                        {selectedActivity?.description && (
                          <p className="text-sm whitespace-pre-line">
                            {selectedActivity.description}
                          </p>
                        )}
                        {selectedActivity?.createdByName && (
                          <p className="text-xs text-muted-foreground">
                            Dibuat oleh {selectedActivity.createdByName}
                          </p>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* MODAL ATUR HARGA (STEP BY STEP) */}
                  <Dialog
                    open={priceModalOpen}
                    onOpenChange={setPriceModalOpen}
                  >
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Input / Update Harga</DialogTitle>
                        <DialogDescription>
                          Pilih jenis harga yang ingin diupdate, lalu isi
                          nominalnya
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        {/* Segmented button: Penawaran / Nego / Closing */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              priceKind === "OFFERING" ? "default" : "outline"
                            }
                            className="h-8 px-3 text-xs md:text-sm"
                            onClick={() => handleChangePriceKind("OFFERING")}
                          >
                            Penawaran
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              priceKind === "NEGOTIATION"
                                ? "default"
                                : "outline"
                            }
                            className="h-8 px-3 text-xs md:text-sm"
                            onClick={() => handleChangePriceKind("NEGOTIATION")}
                          >
                            Negosiasi
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              priceKind === "CLOSING" ? "default" : "outline"
                            }
                            className="h-8 px-3 text-xs md:text-sm"
                            onClick={() => handleChangePriceKind("CLOSING")}
                          >
                            Closing
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[11px] md:text-sm text-muted-foreground">
                            {priceKind === "OFFERING" &&
                              "Nominal penawaran awal yang kamu ajukan ke lead"}
                            {priceKind === "NEGOTIATION" &&
                              "Nominal hasil negosiasi terbaru dengan lead"}
                            {priceKind === "CLOSING" &&
                              "Nominal deal akhir saat lead benar-benar closing"}
                          </p>
                          <Input
                            type="text"
                            inputMode="numeric"
                            className="h-9 text-xs md:text-sm"
                            value={priceInput}
                            onChange={(e) =>
                              setPriceInput(formatRupiahInput(e.target.value))
                            }
                            placeholder="Masukkan harga disini.."
                          />
                        </div>
                      </div>

                      <DialogFooter className="mt-4 flex items-center justify-between gap-2">
                        <p className="text-[10px] md:text-xs text-muted-foreground">
                          Simpan satu per satu: mulai dari penawaran, lalu
                          negosiasi, kemudian closing
                        </p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-xs md:text-sm"
                            onClick={() => setPriceModalOpen(false)}
                            disabled={savingPrice}
                          >
                            Batal
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 px-3 text-xs md:text-sm"
                            onClick={handleSavePrice}
                            disabled={savingPrice}
                          >
                            {savingPrice ? (
                              <>
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                Menyimpan...
                              </>
                            ) : (
                              "Simpan harga"
                            )}
                          </Button>
                        </div>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </Tabs>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </DashboardLayout>
  );
}

/* ==== helper components & functions ==== */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-xs sm:text-sm">{value}</p>
    </div>
  );
}

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

function StageTimeline({
  stages,
  currentStageId,
  onMarkDone,
  savingStageId,
}: {
  stages: StageWithMeta[];
  currentStageId?: number;
  onMarkDone: (stageId: number, mode?: "NORMAL" | "SKIPPED") => void;
  savingStageId: number | null;
}) {
  if (!stages.length) {
    return (
      <p className="text-[11px] text-muted-foreground">
        Belum ada definisi tahapan.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {stages.map((s) => {
        const isDone = !!s.doneAt;
        const isSkipped = isDone && s.mode === "SKIPPED";
        const isActive = s.id === currentStageId;

        return (
          <button
            key={s.id}
            type="button"
            className="flex w-full items-center justify-between rounded-md border bg-background px-2 py-2 hover:bg-muted/60"
            onClick={() => {
              if (isDone) return;
              onMarkDone(s.id, "NORMAL");
            }}
            disabled={savingStageId === s.id}
          >
            <div className="flex items-center gap-2">
              {isDone ? (
                <CheckCircle2
                  className={`h-4 w-4 ${
                    isSkipped ? "text-slate-400" : "text-emerald-500"
                  }`}
                />
              ) : (
                <Circle
                  className={`h-4 w-4 ${
                    isActive ? "text-blue-500" : "text-muted-foreground"
                  }`}
                />
              )}

              <div className="text-left">
                <p className="text-sm font-medium">
                  {s.label}{" "}
                  {isActive ? (
                    <span className="text-xs text-blue-500">(aktif)</span>
                  ) : null}
                </p>

                <p className="text-[11px] text-muted-foreground">
                  {isDone
                    ? `Selesai: ${formatDateTime(s.doneAt!)}`
                    : s.startedAt
                    ? `Mulai: ${formatDateTime(s.startedAt)}`
                    : "Belum dimulai"}
                  {isSkipped ? " • SKIPPED" : ""}
                </p>
              </div>
            </div>

            {savingStageId === s.id ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}