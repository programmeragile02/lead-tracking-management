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
import { Edit, Trash2, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Employee } from "./pegawai-list";

function getRoleLabel(role: Employee["roleCode"]) {
  switch (role) {
    case "MANAGER":
      return "Manager";
    case "TEAM_LEADER":
      return "Team Leader";
    case "SALES":
      return "Sales";
    default:
      return "-";
  }
}

function roleBadgeClass(role: Employee["roleCode"]) {
  switch (role) {
    case "MANAGER":
      return "bg-primary/10 text-primary border-primary/30";
    case "TEAM_LEADER":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "SALES":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function statusBadgeClass(status: Employee["status"]) {
  return status === "AKTIF"
    ? "bg-green-500 text-white"
    : "bg-gray-300 text-gray-700";
}

export function EmployeeTable({
  employees,
  onEdit,
  onDelete,
}: {
  employees: Employee[];
  onEdit?: (emp: Employee) => void;
  onDelete?: (emp: Employee) => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-subtle hover:bg-gradient-subtle">
            <TableHead className="font-semibold text-gray-900">
              Nama Pegawai
            </TableHead>
            <TableHead className="font-semibold text-gray-900">
              Jabatan
            </TableHead>
            <TableHead className="font-semibold text-gray-900">
              Atasan
            </TableHead>
            <TableHead className="font-semibold text-gray-900">
              Kontak
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
          {employees.map((employee) => (
            <TableRow
              key={employee.id}
              className="hover:bg-gray-50 transition-colors"
            >
              <TableCell>
                <div>
                  <p className="font-semibold text-gray-900">{employee.name}</p>
                  <p className="text-xs text-gray-500">{employee.email}</p>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`text-xs font-semibold border ${roleBadgeClass(
                    employee.roleCode
                  )}`}
                >
                  {getRoleLabel(employee.roleCode)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-xs text-gray-700 space-y-0.5">
                  {employee.managerName && (
                    <p>
                      <span className="text-gray-500">Manager: </span>
                      {employee.managerName}
                    </p>
                  )}
                  {employee.teamLeaderName && (
                    <p>
                      <span className="text-gray-500">Team Leader: </span>
                      {employee.teamLeaderName}
                    </p>
                  )}
                  {!employee.managerName && !employee.teamLeaderName && (
                    <p className="text-gray-400 italic text-xs">-</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-xs text-gray-700 space-y-0.5">
                  {employee.phone && (
                    <p className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <span>{employee.phone}</span>
                    </p>
                  )}
                  <p className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-gray-400" />
                    <span className="truncate">{employee.email}</span>
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={statusBadgeClass(employee.status)}>
                  {employee.status === "AKTIF" ? "Aktif" : "Nonaktif"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:bg-primary/10"
                    onClick={() => onEdit?.(employee)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => onDelete?.(employee)}
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
