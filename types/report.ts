export type CityStat = {
  cityId: number | null; // null hanya untuk OTHERS
  cityName: string;
  cityType?: "KOTA" | "KABUPATEN";
  provinceName?: string;
  count: number;
  percent: number;
};


export type CityReportResponse = {
  ok: boolean;
  totalLeads: number;
  data: CityStat[];
};