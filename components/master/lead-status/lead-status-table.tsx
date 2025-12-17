"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LeadStatus } from "./lead-status-list";

interface Props {
  statuses: LeadStatus[];
  onEdit: (status: LeadStatus) => void;
  onDelete: (status: LeadStatus) => void;
}

export function LeadStatusTable({ statuses, onEdit, onDelete }: Props) {
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-secondary shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-primary hover:bg-primary">
            <TableHead className="font-semibold text-gray-foreground">
              Nama Status
            </TableHead>
            <TableHead className="font-semibold text-gray-foreground">Kode</TableHead>
            <TableHead className="font-semibold text-gray-foreground">
              Urutan
            </TableHead>
            <TableHead className="font-semibold text-gray-foreground">
              Status
            </TableHead>
            <TableHead className="font-semibold text-gray-foreground text-right">
              Aksi
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {statuses.map((item) => (
            <TableRow
              key={item.id}
              className="hover:bg-muted-foreground/5 transition-colors"
            >
              <TableCell>
                <p className="font-semibold text-gray-foreground">{item.name}</p>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className="text-primary border-primary/30 bg-primary/5"
                >
                  {item.code}
                </Badge>
              </TableCell>
              <TableCell>{item.order}</TableCell>
              <TableCell>
                {item.isActive ? (
                  <Badge className="bg-green-500 text-white">Aktif</Badge>
                ) : (
                  <Badge className="bg-muted-foreground text-white">Nonaktif</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:bg-muted-foreground/10"
                    onClick={() => onEdit(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:bg-primary/50"
                    onClick={() => onDelete(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
