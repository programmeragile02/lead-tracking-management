// Province
export type Province = {
  id: number;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

// City
export type City = {
  id: number;
  code: string;
  name: string;
  type: "KOTA" | "KABUPATEN";
  province: {
    id: number;
    name: string;
  };
};