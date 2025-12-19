"use client";

import type { LucideIcon } from "lucide-react";
import {
  Home,
  Users,
  CheckSquare,
  BarChart3,
  Settings,
  Package,
  BookUser,
  Network,
  BriefcaseBusiness,
  Footprints,
  FileChartColumn,
  Target,
  Phone,
  ChartColumnIncreasing,
  ChartBarIncreasing,
} from "lucide-react";

export type AppRole = "sales" | "team-leader" | "manager";

export type NavItem = {
  id: string;
  label: string;
  href?: string; // kalau group tanpa href
  icon?: LucideIcon;
  children?: NavItem[]; // submenu
};

export const NAV_ITEMS: Record<AppRole, NavItem[]> = {
  sales: [
    {
      id: "dashboard",
      label: "Dashboard",
      href: "/dashboard/sales",
      icon: Home,
    },
    { id: "leads", label: "Lead", href: "/leads", icon: Users },
    { id: "tasks", label: "Tugas", href: "/tasks", icon: CheckSquare },
    {
      id: "wa-me",
      label: "WhatsApp Synchronise",
      href: "/whatsapp/me",
      icon: Phone,
    },
  ],

  "team-leader": [
    {
      id: "dashboard",
      label: "Dashboard",
      href: "/dashboard/team-leader",
      icon: Home,
    },
    { id: "team", label: "Tim", href: "/team", icon: BarChart3 },
    {
      id: "laporan",
      label: "Laporan",
      icon: ChartColumnIncreasing,
      children: [
        {
          id: "laporan-tahapan",
          label: "Laporan Tahapan",
          href: "/reports/stages",
          icon: ChartBarIncreasing,
        },
        {
          id: "laporan-status",
          label: "Laporan Status Lead",
          href: "/reports/statuses",
          icon: ChartBarIncreasing,
        },
        {
          id: "laporan-followup",
          label: "Laporan Tindak Lanjut",
          href: "/reports/followups",
          icon: ChartBarIncreasing,
        },
      ],
    },
    // { id: "leads", label: "Lead", href: "/leads", icon: Users },
    // { id: "tasks", label: "Tugas", href: "/tasks", icon: CheckSquare },
  ],

  manager: [
    {
      id: "dashboard",
      label: "Dashboard",
      href: "/dashboard/manager",
      icon: Home,
    },

    // === Group MASTER ===
    {
      id: "master",
      label: "Master",
      icon: Package,
      children: [
        {
          id: "master-jabatan",
          label: "Jabatan",
          href: "/master/jabatan",
          icon: BriefcaseBusiness,
        },
        {
          id: "master-pegawai",
          label: "Pegawai",
          href: "/master/pegawai",
          icon: BookUser,
        },
        {
          id: "master-products",
          label: "Produk",
          href: "/master/products",
          icon: Package,
        },
        {
          id: "master-tahap",
          label: "Tahap",
          href: "/master/tahap",
          icon: Footprints,
        },
        {
          id: "master-status",
          label: "Status Lead",
          href: "/master/status",
          icon: FileChartColumn,
        },
        {
          id: "master-sumber-lead",
          label: "Sumber Lead",
          href: "/master/lead-sources",
          icon: FileChartColumn,
        },
        {
          id: "master-followup-types",
          label: "Tindak Lanjut",
          href: "/master/lead-followup-types",
          icon: FileChartColumn,
        },
        {
          id: "master-nurturing",
          label: "Nurturing",
          href: "/master/nurturing",
          icon: FileChartColumn,
        },
      ],
    },

    {
      id: "organisasi",
      label: "Struktur Organisasi",
      href: "/organisasi",
      icon: Network,
    },
    {
      id: "laporan",
      label: "Laporan",
      icon: ChartColumnIncreasing,
      children: [
        {
          id: "laporan-tahapan",
          label: "Laporan Tahapan",
          href: "/reports/stages",
          icon: ChartBarIncreasing,
        },
        {
          id: "laporan-status",
          label: "Laporan Status Lead",
          href: "/reports/statuses",
          icon: ChartBarIncreasing,
        },
        {
          id: "laporan-followup",
          label: "Laporan Tindak Lanjut",
          href: "/reports/followups",
          icon: ChartBarIncreasing,
        },
        { id: "reports", label: "Laporan", href: "/reports", icon: BarChart3 },
      ],
    },

    // === Group PENGATURAN ===
    {
      id: "settings-group",
      label: "Pengaturan",
      icon: Settings,
      children: [
        {
          id: "settings-general",
          label: "Pengaturan Umum",
          href: "/settings/general",
          icon: Settings,
        },
        {
          id: "settings-target-lead",
          label: "Target Lead",
          href: "/settings/target-lead",
          icon: Target,
        },
        {
          id: "settings-lead-fields",
          label: "Konfigurasi Data Lead",
          href: "/settings/lead-fields",
          icon: Settings,
        },
        {
          id: "settings-quick-messages",
          label: "Konfigurasi Pesan Cepat",
          href: "/settings/template-quick-messages",
          icon: Settings,
        },
      ],
    },
  ],
};
