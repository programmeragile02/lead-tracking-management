"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mutate } from "swr";
import {
  LeadSubStatusList,
  LEAD_SUB_STATUSES_KEY,
  LeadSubStatus,
} from "@/components/master/lead-sub-status/lead-sub-status-list";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import useSWR from "swr";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function LeadSubStatusMasterPage() {
  const { toast } = useToast();

  const { data: statusData } = useSWR("/api/lead-statuses", fetcher);
  const statuses = statusData?.data ?? [];

  const [editing, setEditing] = useState<LeadSubStatus | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    statusId: "",
    isActive: true,
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", code: "", statusId: "", isActive: true });
    setOpen(true);
  };

  const openEdit = (s: LeadSubStatus) => {
    setEditing(s);
    setForm({
      name: s.name,
      code: s.code,
      statusId: String(s.status.id),
      isActive: s.isActive,
    });
    setOpen(true);
  };

  const submit = async () => {
    try {
      const payload = {
        ...form,
        statusId: Number(form.statusId),
      };

      const url = editing
        ? `/api/lead-sub-statuses/${editing.id}`
        : "/api/lead-sub-statuses";

      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message);

      toast({ title: "Berhasil", description: "Sub status tersimpan." });
      setOpen(false);

      await mutate(LEAD_SUB_STATUSES_KEY);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err?.message,
      });
    }
  };

  return (
    <DashboardLayout title="Master Sub Status Lead">
      <div className="space-y-6">
        <div className="flex justify-between">
          <div>
            <h2 className="text-2xl font-bold">Sub Status Lead</h2>
            <p className="text-sm text-muted-foreground">
              Sub status untuk segmentasi marketing & filter lead
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Sub Status
          </Button>
        </div>

        <LeadSubStatusList onEdit={openEdit} onDelete={(s) => setEditing(s)} />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Sub Status" : "Tambah Sub Status"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label className="mb-2">Nama Sub Status</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label className="mb-2">Kode</Label>
                <Input
                  value={form.code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, code: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label className="mb-2">Status Utama</Label>
                <Select
                  value={form.statusId}
                  onValueChange={(v) => setForm((f) => ({ ...f, statusId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status utama" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between items-center">
                <Label>Status Aktif</Label>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, isActive: v }))
                  }
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Batal
                </Button>
                <Button onClick={submit}>
                  {editing ? "Simpan" : "Tambah"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
