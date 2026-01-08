"use client";

import { useState } from "react";
import useSWR from "swr";

import { CityDonutChart } from "./city-donut-chart";
import { CityBarChart } from "./city-bar-chart";
import { CityTable } from "./city-table";
import { CityLeadDrawer } from "./city-lead-drawer";

import { CityReportResponse } from "@/types/report";
import { Card } from "@/components/ui/card";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function LeadsByCityCard() {
  const { data, isLoading } = useSWR<CityReportResponse>(
    "/api/reports/leads/by-city",
    fetcher
  );

  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);

  /* ================= LOADING ================= */
  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-6 animate-pulse space-y-4">
        <div className="h-4 w-64 bg-muted rounded" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-[280px] bg-muted rounded" />
          <div className="h-[280px] bg-muted rounded" />
        </div>
        <div className="h-32 bg-muted rounded" />
      </div>
    );
  }

  /* ================= ERROR ================= */
  if (!data?.ok) {
    return (
      <div className="rounded-lg border p-6 text-sm text-primary">
        Gagal memuat statistik kota
      </div>
    );
  }

  /* ================= DATA ================= */
  const chartData = data.data
    .filter((d) => d.cityId !== null)
    .map((d) => ({
      cityId: d.cityId!,
      city: d.cityName,
      count: d.count,
    }));

  /* ================= UI ================= */
  return (
    <>
      {/* CHARTS */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="px-4">
          <p className="font-medium text-lg text-muted-foreground text-center">
            Jumlah Lead Per Kota
          </p>
          <CityDonutChart data={chartData} />
        </Card>

        <Card className="px-4">
          <p className="text-lg font-medium text-muted-foreground text-center">
            Kota Terbanyak
          </p>
          <CityBarChart data={chartData} onSelectCity={setSelectedCityId} />
        </Card>
      </div>

      {/* TABLE */}
      <div className="space-y-2">
        <CityTable data={data.data} onSelectCity={setSelectedCityId} />
      </div>

      {/* DRAWER DETAIL LEAD */}
      {/* <CityLeadDrawer
        cityId={selectedCityId}
        open={selectedCityId !== null}
        onClose={() => setSelectedCityId(null)}
      /> */}
    </>
  );
}
