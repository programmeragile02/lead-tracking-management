"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";
import Image from "next/image";
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
    ? "bg-green-500 text-white shadow-sm"
    : "bg-gray-300 text-gray-700";
}

export function EmployeeCard({
  employee,
  onEdit,
  onDelete,
}: {
  employee: Employee;
  onEdit?: (emp: Employee) => void;
  onDelete?: (emp: Employee) => void;
}) {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-gray-200 bg-white group">
      <div className="relative h-40 bg-gradient-to-br from-primary/5 via-white to-secondary/10 flex items-center justify-center">
        <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-primary/20 to-secondary/20">
          <Image
            src={employee.photo || "/avatar-placeholder.png"}
            alt={employee.name}
            fill
            className="object-cover"
          />
        </div>

        <div className="absolute top-3 right-3">
          <Badge className={statusBadgeClass(employee.status)}>
            {employee.status === "AKTIF" ? "Aktif" : "Nonaktif"}
          </Badge>
        </div>
      </div>

      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-gray-900 leading-tight">
              {employee.name}
            </h3>
            <Badge
              variant="outline"
              className={`text-xs font-semibold border ${roleBadgeClass(
                employee.roleCode
              )}`}
            >
              <ShieldCheck className="h-3 w-3 mr-1" />
              {getRoleLabel(employee.roleCode)}
            </Badge>
          </div>
        </div>

        <div className="space-y-1 text-xs text-gray-600">
          {employee.managerName && (
            <p className="flex items-center gap-1">
              <Users className="h-3 w-3 text-gray-400" />
              <span className="font-medium text-gray-700">Manager:</span>{" "}
              <span>{employee.managerName}</span>
            </p>
          )}
          {employee.teamLeaderName && (
            <p className="flex items-center gap-1">
              <Users className="h-3 w-3 text-gray-400" />
              <span className="font-medium text-gray-700">
                Team Leader:
              </span>{" "}
              <span>{employee.teamLeaderName}</span>
            </p>
          )}
        </div>

        <div className="space-y-1 text-xs text-gray-600">
          <p className="flex items-center gap-1">
            <Mail className="h-3 w-3 text-gray-400" />
            <span className="truncate">{employee.email}</span>
          </p>
          {employee.phone && (
            <p className="flex items-center gap-1">
              <Phone className="h-3 w-3 text-gray-400" />
              <span>{employee.phone}</span>
            </p>
          )}
          {employee.address && (
            <p className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-gray-400" />
              <span className="truncate">{employee.address}</span>
            </p>
          )}
        </div>

        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-primary text-primary hover:bg-primary/5 bg-transparent"
            onClick={() => onEdit?.(employee)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
            onClick={() => onDelete?.(employee)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Hapus
          </Button>
        </div>
      </div>
    </Card>
  );
}
