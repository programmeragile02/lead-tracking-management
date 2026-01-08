"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProvinceList } from "@/components/region/province/province-list";
import { CityList } from "@/components/region/city/city-list";
import { Upload } from "lucide-react";
import { RegionImportDialog } from "@/components/region/import-dialog";

type Tab = "province" | "city";

export default function MasterWilayahPage() {
  const [openImport, setOpenImport] = useState(false);
  const [tab, setTab] = useState<Tab>("province");

  return (
    <DashboardLayout title="Master Wilayah">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">Master Wilayah</h2>
          <p className="text-sm text-muted-foreground">
            Kelola provinsi serta kota / kabupaten yang digunakan pada data lead
          </p>
        </div>

        <div className="flex justify-between">
          {/* Tabs */}
          <div className="flex gap-2">
            <Button
              variant={tab === "province" ? "default" : "outline"}
              onClick={() => setTab("province")}
            >
              Provinsi
            </Button>
            <Button
              variant={tab === "city" ? "default" : "outline"}
              onClick={() => setTab("city")}
            >
              Kota / Kabupaten
            </Button>
          </div>

          <div className="flex gap-2">
            {/* IMPORT BUTTON */}
            <Button variant="outline" onClick={() => setOpenImport(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import Excel
            </Button>
          </div>
        </div>

        {/* Content */}
        {tab === "province" ? <ProvinceList /> : <CityList />}
        {/* IMPORT DIALOG */}
        <RegionImportDialog open={openImport} onOpenChange={setOpenImport} />
      </div>
    </DashboardLayout>
  );
}
