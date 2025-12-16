"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Pencil, SendHorizonal } from "lucide-react";
import { renderWaTemplate } from "./template-utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type TemplateItem = {
  id: number;
  title: string;
  body: string;
  mediaUrl?: string | null;
  category?: string | null;
  source: "GLOBAL" | "MY_TEMPLATE";
  globalId?: number | null;
  parentId?: number | null;
};

export function QuickMessageDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  lead: any;
  currentUser?: any;
  settings?: any;

  tplVersion?: number; // buat trigger refresh dari luar

  onUse: (text: string) => void;
  onEditRequest: (tpl: TemplateItem) => void;
}) {
  const {
    open,
    onOpenChange,
    lead,
    currentUser,
    settings,
    tplVersion,
    onUse,
    onEditRequest,
  } = props;

  const { data, isLoading, mutate } = useSWR<{
    ok: boolean;
    data?: TemplateItem[];
  }>(
    open ? `/api/whatsapp/templates?mode=picker&v=${tplVersion}` : null,
    fetcher
  );

  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"global" | "mine">("global");

  const list = (data?.ok ? data.data : []) ?? [];

  const globalList = useMemo(
    () => list.filter((t) => t.source === "GLOBAL"),
    [list]
  );
  const mineList = useMemo(
    () => list.filter((t) => t.source === "MY_TEMPLATE"),
    [list]
  );

  function categoryLabel(c?: string | null) {
    return c?.trim() ? c : "Umum";
  }

  function previewText(t: TemplateItem) {
    return renderWaTemplate(t.body, { lead, user: currentUser, settings });
  }

  function filterList(base: TemplateItem[]) {
    const qq = q.trim().toLowerCase();
    if (!qq) return base;
    return base.filter((t) => {
      const hay = `${t.title} ${t.body} ${t.category || ""}`.toLowerCase();
      return hay.includes(qq);
    });
  }

  function TemplateListView(base: TemplateItem[]) {
    const filtered = filterList(base);

    if (isLoading) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Memuat template…
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <div className="text-sm text-muted-foreground">
          Template tidak ditemukan.
        </div>
      );
    }

    return (
      <div className="max-h-[380px] overflow-y-auto space-y-2 rounded-md border p-2">
        {filtered.map((t) => {
          const preview = previewText(t);
          const isGlobal = t.source === "GLOBAL";
          const isOverride = !isGlobal && Boolean(t.parentId);

          return (
            <div key={`${t.source}-${t.id}`} className="rounded-md border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{t.title}</p>

                    <Badge variant="outline" className="text-[11px]">
                      {categoryLabel(t.category)}
                    </Badge>

                    {isGlobal ? (
                      <Badge className="bg-slate-200 text-slate-900 text-[11px]">
                        Global
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500 text-white text-[11px]">
                        Template Saya
                      </Badge>
                    )}

                    {!isGlobal && isOverride && (
                      <Badge variant="outline" className="text-[11px]">
                        Override
                      </Badge>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line line-clamp-3">
                    {preview}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col gap-2">
                  <Button
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={() => onUse(preview)}
                  >
                    <SendHorizonal className="mr-2 h-4 w-4" />
                    Pakai
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-xs"
                    onClick={() => onEditRequest(t)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    {isGlobal ? "Edit versi saya" : "Edit"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (v) {
          setQ("");
          setTab("global");
          void mutate();
        }
      }}
    >
      <DialogContent className="sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle>Pesan Cepat</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v === "mine" ? "mine" : "global")}
          >
            <TabsList className="w-full justify-start">
              <TabsTrigger value="global">Global</TabsTrigger>
              <TabsTrigger value="mine">Template Saya</TabsTrigger>
            </TabsList>

            <div className="mt-3 flex flex-col gap-2">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari template… (judul/isi/kategori)"
              />

              <TabsContent value="global" className="m-0">
                {TemplateListView(globalList)}
              </TabsContent>

              <TabsContent value="mine" className="m-0">
                {TemplateListView(mineList)}
              </TabsContent>

              <p className="text-xs text-muted-foreground">
                Placeholder: {"{lead_name}"}, {"{product_name}"},{" "}
                {"{company_name}"}, {"{sales_name}"}, {"{price_offering}"} dll.
              </p>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
