// role
export interface Role {
  id: number;
  code: string; // SUPERADMIN | MANAGER | TEAM_LEADER | SALES | dst
  name: string; // Super Admin, Manager, dst
  description?: string | null;
  isActive: boolean;
}

// employee
export type EmployeeRole = string;

export interface Employee {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  photo?: string | null;
  address?: string | null;
  roleCode: EmployeeRole | null;
  status: "AKTIF" | "NONAKTIF";
  managerName?: string | null;
  teamLeaderName?: string | null;
  managerId?: number | null;
  teamLeaderId?: number | null;
}

// untuk dropdown atasan
export interface SimpleUser {
  id: number;
  name: string;
}

// state form
export interface EmployeeFormState {
  id?: number;
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  roleCode: EmployeeRole | "";
  managerId: string;
  teamLeaderId: string;
  photoPath: string; // path di DB
}
