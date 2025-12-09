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
import type { FollowUpType } from "./lead-followup-type-list";

interface Props {
  items: FollowUpType[];
  onEdit: (item: FollowUpType) => void;
  onDelete: (item: FollowUpType) => void;
}

export function FollowUpTypeTable({ items, onEdit, onDelete }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-subtle hover:bg-gradient-subtle">
            <TableHead className="font-semibold text-gray-900">
              Nama Tindak Lanjut
            </TableHead>
            <TableHead className="font-semibold text-gray-900">Kode</TableHead>
            <TableHead className="font-semibold text-gray-900">
              Keterangan
            </TableHead>
            <TableHead className="font-semibold text-gray-900">
              Status
            </TableHead>
            <TableHead className="font-semibold text-gray-900 text-right">
              Aksi
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              className="hover:bg-gray-50 transition-colors"
            >
              <TableCell>
                <p className="font-semibold text-gray-900">{item.name}</p>
                {item.isNurturingStep && (
                  <p className="text-xs text-primary mt-1">
                    Nurturing step #{item.nurturingOrder ?? "-"}
                  </p>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className="text-primary border-primary/30 bg-primary/5"
                >
                  {item.code}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs">
                <p className="text-sm text-gray-700">
                  {item.description || "-"}
                </p>
              </TableCell>
              <TableCell>
                {item.isActive ? (
                  <Badge className="bg-green-500 text-white">Aktif</Badge>
                ) : (
                  <Badge className="bg-gray-400 text-white">Nonaktif</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-black hover:bg-black/10"
                    onClick={() => onEdit(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
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
