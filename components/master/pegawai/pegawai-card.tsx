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
import { Employee } from "@/types/employee-types";
import { formatRoleLabel, roleBadgeClass } from "./role-utils";

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
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-border bg-secondary group">
      <div className="relative h-40 flex items-center justify-center">
        <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-border shadow-lg bg-primary/50">
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
            <h3 className="font-bold text-lg text-foreground leading-tight">
              {employee.name}
            </h3>
            <Badge
              variant="outline"
              className={`text-xs font-semibold border ${roleBadgeClass(
                employee.roleCode
              )}`}
            >
              <ShieldCheck className="h-3 w-3 mr-1" />
              {formatRoleLabel(employee.roleCode)}
            </Badge>
          </div>
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          {employee.managerName && (
            <p className="flex items-center gap-1">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium text-muted-foreground">
                Manager:
              </span>{" "}
              <span className="text-foreground">{employee.managerName}</span>
            </p>
          )}
          {employee.teamLeaderName && (
            <p className="flex items-center gap-1">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium text-muted-foreground">
                Team Leader:
              </span>{" "}
              <span className="text-foreground">{employee.teamLeaderName}</span>
            </p>
          )}
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          <p className="flex items-center gap-1">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span className="truncate">{employee.email}</span>
          </p>
          {employee.phone && (
            <p className="flex items-center gap-1">
              <Phone className="h-3 w-3 text-muted-foreground" />
              <span>{employee.phone}</span>
            </p>
          )}
          {employee.address && (
            <p className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="truncate">{employee.address}</span>
            </p>
          )}
        </div>

        <div className="flex gap-2 pt-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-muted-foreground text-foreground hover:bg-black/5 bg-transparent"
            onClick={() => onEdit?.(employee)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-primary text-foreground hover:bg-primary/50"
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
