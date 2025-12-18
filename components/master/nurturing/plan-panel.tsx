"use client";

import useSWR from "swr";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

type Plan = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
};

type Topic = {
  id: number;
  title: string;
  category?: { name: string };
};

type Step = {
  id: number;
  order: number;
  delayHours: number;
  slot: "A" | "B";
  isActive: boolean;
  topic: Topic;
};

function SortableStepRow({
  step,
  onDelete,
}: {
  step: Step;
  onDelete: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start justify-between gap-3 rounded-xl border p-3"
    >
      <div className="flex items-start gap-3 min-w-0">
        <button
          className="mt-1 rounded-md border p-2 text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
          aria-label="Drag"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">
            {step.order}. {step.topic.title}
          </div>
          <div className="text-xs text-muted-foreground">
            {step.topic.category?.name ?? "Kategori"} • Template {step.slot} • Delay{" "}
            {step.delayHours} jam
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(step.id)}
        className="shrink-0"
        aria-label="Hapus step"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function PlanPanel() {
  const { toast } = useToast();

  // data master
  const plans = useSWR("/api/master/nurturing/plans", fetcher);
  const topics = useSWR("/api/master/nurturing/topics", fetcher);

  const planItems: Plan[] = useMemo(() => plans.data?.data ?? [], [plans.data]);
  const topicItems: any[] = useMemo(
    () => topics.data?.data ?? [],
    [topics.data]
  );

  // pilih plan
  const [planId, setPlanId] = useState<string>("");

  // detail plan (include steps)
  const planDetailUrl = planId ? `/api/master/nurturing/plans/${planId}` : null;
  const planDetail = useSWR(planDetailUrl, fetcher);

  const steps: Step[] = useMemo(
    () => planDetail.data?.data?.steps ?? [],
    [planDetail.data]
  );

  // create plan form
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [planActive, setPlanActive] = useState(true);
  const [savingPlan, setSavingPlan] = useState(false);

  // add step form
  const [topicId, setTopicId] = useState<string>("");
  const [slot, setSlot] = useState<"A" | "B">("A");
  const [delayHours, setDelayHours] = useState<string>("24");
  const [addingStep, setAddingStep] = useState(false);

  // dnd sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    // auto select plan pertama kalau ada
    if (!planId && planItems.length > 0) setPlanId(String(planItems[0].id));
  }, [planItems, planId]);

  async function createPlan() {
    setSavingPlan(true);
    try {
      const res = await fetch("/api/master/nurturing/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          name,
          description: desc ? desc : null,
          isActive: planActive,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Gagal");

      toast({ title: "Urutan dibuat", description: json.data.name });
      setCode("");
      setName("");
      setDesc("");
      setPlanActive(true);
      await plans.mutate();
      setPlanId(String(json.data.id));
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" });
    } finally {
      setSavingPlan(false);
    }
  }

  async function addStep() {
    if (!planId)
      return toast({ title: "Pilih urutan dulu", variant: "destructive" });
    if (!topicId)
      return toast({ title: "Pilih topik dulu", variant: "destructive" });

    setAddingStep(true);
    try {
      const res = await fetch("/api/master/nurturing/plan-steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: Number(planId),
          topicId: Number(topicId),
          slot,
          delayHours: Number(delayHours || 24),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok)
        throw new Error(json.error || "Gagal tambah step");
      toast({ title: "Step ditambahkan", description: json.data.topic.title });

      setTopicId("");
      setSlot("A");
      setDelayHours("24");

      planDetail.mutate();
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" });
    } finally {
      setAddingStep(false);
    }
  }

  async function deleteStep(stepId: number) {
    if (!planId) return;
    try {
      const res = await fetch(`/api/master/nurturing/plan-steps/${stepId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.ok)
        throw new Error(json.error || "Gagal hapus step");
      toast({ title: "Step dihapus" });
      planDetail.mutate();
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" });
    }
  }

  async function persistReorder(nextStepIds: number[]) {
    if (!planId) return;
    const res = await fetch("/api/master/nurturing/plan-steps/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: Number(planId), stepIds: nextStepIds }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok)
      throw new Error(json.error || "Gagal menyimpan urutan");
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = steps.findIndex((s) => s.id === active.id);
    const newIndex = steps.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(steps, oldIndex, newIndex).map((s, idx) => ({
      ...s,
      order: idx + 1,
    }));

    // optimistic update
    planDetail.mutate((prev: any) => {
      if (!prev?.data) return prev;
      return { ...prev, data: { ...prev.data, steps: next } };
    }, false);

    try {
      await persistReorder(next.map((s) => s.id));
      toast({ title: "Urutan tersimpan" });
      planDetail.mutate();
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" });
      planDetail.mutate(); // refresh dari server
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* LEFT: create + select plan */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Master Urutan Nurturing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">Pilih Urutan</div>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Urutan" />
              </SelectTrigger>
              <SelectContent>
                {planItems.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name} ({p.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border p-3 space-y-3">
            <div className="text-sm font-semibold">Buat Urutan Baru</div>

            <div className="space-y-1">
              <div className="text-sm font-medium">Code</div>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="NURTURING_A"
              />
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">Nama</div>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nurturing A"
              />
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">Deskripsi</div>
              <Input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Opsional"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="text-sm">
                <div className="font-medium">Aktif</div>
                <div className="text-xs text-muted-foreground">
                  Urutan aktif bisa dipakai
                </div>
              </div>
              <Switch checked={planActive} onCheckedChange={setPlanActive} />
            </div>

            <Button
              className="w-full"
              onClick={createPlan}
              disabled={savingPlan || !code.trim() || !name.trim()}
            >
              {savingPlan ? "Menyimpan..." : "Simpan Urutan"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* RIGHT: steps + dnd */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Step Urutan Nurturing</CardTitle>
          <CardDescription>
                Anda bisa mengurutkan step nurturing dengan drag & drop
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!planId ? (
            <div className="text-sm text-muted-foreground">
              Pilih plan dulu.
            </div>
          ) : (
            <>
              {/* Add step */}
              <div className="grid gap-3 rounded-xl border p-3 md:grid-cols-4">
                <div className="md:col-span-2 space-y-1">
                  <div className="text-sm font-medium">Topik</div>
                  <Select value={topicId} onValueChange={setTopicId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih topik" />
                    </SelectTrigger>
                    <SelectContent>
                      {topicItems.map((t: any) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-medium">Slot template</div>
                  <Select value={slot} onValueChange={(v: any) => setSlot(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-medium">Delay (jam)</div>
                  <Input
                    value={delayHours}
                    onChange={(e) => setDelayHours(e.target.value)}
                    placeholder="24"
                  />
                </div>

                <div className="md:col-span-4">
                  <Button
                    className="w-full"
                    onClick={addStep}
                    disabled={addingStep || !topicId}
                  >
                    {addingStep ? "Menambah..." : "Tambah Step"}
                  </Button>
                </div>
              </div>

              {/* DnD list */}
              {planDetail.isLoading ? (
                <div className="text-sm text-muted-foreground">
                  Memuat steps...
                </div>
              ) : steps.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Belum ada step. Tambahkan topik di atas.
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={onDragEnd}
                >
                  <SortableContext
                    items={steps.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {steps.map((s) => (
                        <SortableStepRow
                          key={s.id}
                          step={s}
                          onDelete={deleteStep}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
