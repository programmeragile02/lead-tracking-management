// report by kota (city)
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

// report by summber leat (source)
export type SourceData = {
  sourceId: number;
  sourceName: string;
  count: number;
  percentage: number;
};

export type RowTableSource = {
  sourceName: string;
  count: number;
  percentage: number;
};
