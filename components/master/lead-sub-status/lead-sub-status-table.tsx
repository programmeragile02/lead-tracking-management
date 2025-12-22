"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import type { LeadSubStatus } from "./lead-sub-status-list";

export function LeadSubStatusTable({
  items,
  onEdit,
  onDelete,
}: {
  items: LeadSubStatus[];
  onEdit: (s: LeadSubStatus) => void;
  onDelete: (s: LeadSubStatus) => void;
}) {
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-secondary">
      <Table>
        <TableHeader>
          <TableRow className="bg-primary">
            <TableHead>Sub Status</TableHead>
            <TableHead>Kode</TableHead>
            <TableHead>Status Utama</TableHead>
            <TableHead>Urutan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-semibold">{item.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{item.code}</Badge>
              </TableCell>
              <TableCell>
                <Badge className="bg-primary text-white">
                  {item.status.name}
                </Badge>
              </TableCell>
              <TableCell>{item.order}</TableCell>
              <TableCell>
                {item.isActive ? (
                  <Badge className="bg-green-500 text-white">Aktif</Badge>
                ) : (
                  <Badge variant="secondary">Nonaktif</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="ghost" onClick={() => onEdit(item)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(item)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
