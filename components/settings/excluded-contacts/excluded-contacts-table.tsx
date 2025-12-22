"use client";

import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export function ExcludedContactTable({
  items,
  onEdit,
  onChanged,
}: {
  items: any[];
  onEdit: (row: any) => void;
  onChanged: () => void;
}) {
  const { toast } = useToast();

  async function toggleActive(row: any) {
    await fetch(`/api/settings/wa-excluded-contacts/${row.id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !row.isActive }),
    });
    onChanged();
  }

  async function remove(row: any) {
    await fetch(`/api/settings/wa-excluded-contacts/${row.id}`, {
      method: "DELETE",
      credentials: "include",
    });

    toast({
      title: "Kontak dinonaktifkan",
      description: row.phone,
    });

    onChanged();
  }

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left">Nama</th>
            <th className="px-4 py-3 text-left">Nomor WhatsApp</th>
            <th className="px-4 py-3 text-left">Catatan</th>
            <th className="px-4 py-3 text-center">Aktif</th>
            <th className="px-4 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.id} className="border-t hover:bg-muted-foreground/5 transition">
              <td className="px-4 py-3 font-medium">{row.name ?? "-"}</td>
              <td className="px-4 py-3">{row.phone}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {row.note ?? "-"}
              </td>
              <td className="px-4 py-3 text-center">
                <Switch
                  checked={row.isActive}
                  onCheckedChange={() => toggleActive(row)}
                />
              </td>
              <td className="px-4 py-3 text-right space-x-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(row)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => remove(row)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
