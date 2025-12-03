"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Loader2, Plus, Search } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmployeeCard } from "./pegawai-card";
import { EmployeeTable } from "./pegawai-table";
import { useToast } from "@/hooks/use-toast";

export type EmployeeRole = "MANAGER" | "TEAM_LEADER" | "SALES";

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
}

// untuk dropdown atasan
interface SimpleUser {
  id: number;
  name: string;
}

// state form
interface EmployeeFormState {
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

export function EmployeeList() {
  const { toast } = useToast();
  const isMobile = !useMediaQuery("(min-width: 768px)");
  const [viewMode, setViewMode] = useState<"card" | "table">(
    isMobile ? "card" : "table"
  );

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // modal form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formState, setFormState] = useState<EmployeeFormState>({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    roleCode: "",
    managerId: "",
    teamLeaderId: "",
    photoPath: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // modal hapus
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [managers, setManagers] = useState<SimpleUser[]>([]);
  const [teamLeaders, setTeamLeaders] = useState<SimpleUser[]>([]);

  async function fetchEmployees(q?: string) {
    try {
      setLoading(true);
      setError(null);

      const url = new URL("/api/employees", window.location.origin);
      if (q && q.trim()) url.searchParams.set("q", q.trim());

      const res = await fetch(url.toString());
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || "Gagal memuat data pegawai");
      }
      setEmployees(json.data as Employee[]);
    } catch (err: any) {
      setError(err?.message || "Gagal memuat data pegawai");
    } finally {
      setLoading(false);
    }
  }

  // ambil list manager & TL untuk dropdown atasan
  async function fetchSuperiors() {
    try {
      const res = await fetch("/api/employees?onlyActive=true");
      const json = await res.json();
      if (!res.ok || !json.ok) return;

      const all = json.data as Employee[];
      setManagers(
        all
          .filter((u) => u.roleCode === "MANAGER")
          .map((u) => ({ id: u.id, name: u.name }))
      );
      setTeamLeaders(
        all
          .filter((u) => u.roleCode === "TEAM_LEADER")
          .map((u) => ({ id: u.id, name: u.name }))
      );
    } catch {
      // optional, ga fatal
    }
  }

  useEffect(() => {
    fetchEmployees();
    fetchSuperiors();
  }, []);

  function openCreateForm() {
    setFormMode("create");
    setFormState({
      id: undefined,
      name: "",
      email: "",
      password: "",
      phone: "",
      address: "",
      roleCode: "",
      managerId: "",
      teamLeaderId: "",
      photoPath: "",
    });
    setPhotoFile(null);
    setIsFormOpen(true);
  }

  function openEditForm(emp: Employee) {
    setFormMode("edit");
    setFormState({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      password: "", // kosong, hanya diisi kalau mau ganti
      phone: emp.phone || "",
      address: emp.address || "",
      roleCode: emp.roleCode || "",
      managerId: "", // bisa diisi kalau kamu expose data managerId dari API
      teamLeaderId: "", // sama
      photoPath: emp.photo || "",
    });
    setPhotoFile(null);
    setIsFormOpen(true);
  }

  function handleFormChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!formState.name || !formState.email || !formState.roleCode) {
      toast({
        title: "Gagal",
        description: "Nama, email, dan jabatan wajib diisi",
        variant: "destructive",
      });
      return;
    }
    if (formMode === "create" && !formState.password) {
      toast({
        title: "Gagal",
        description: "Password wajib diisi untuk pegawai baru",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // 1. upload foto dulu (jika ada file baru)
      let photoPath = formState.photoPath;
      if (photoFile) {
        const fd = new FormData();
        fd.append("file", photoFile);
        const resUpload = await fetch("/api/uploads/employee-photo", {
          method: "POST",
          body: fd,
        });
        const jsonUpload = await resUpload.json();
        if (!resUpload.ok || !jsonUpload.ok) {
          toast({
            title: "Gagal",
            description: "Gagal upload foto",
            variant: "destructive",
          });
        }
        photoPath = jsonUpload.path as string;
      }

      // 2. panggil API create/update
      if (formMode === "create") {
        const res = await fetch("/api/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formState.name,
            email: formState.email,
            password: formState.password,
            phone: formState.phone || null,
            address: formState.address || null,
            roleCode: formState.roleCode,
            managerId:
              formState.roleCode === "TEAM_LEADER"
                ? Number(formState.managerId || 0) || undefined
                : undefined,
            teamLeaderId:
              formState.roleCode === "SALES"
                ? Number(formState.teamLeaderId || 0) || undefined
                : undefined,
            photo: photoPath || null,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          toast({
            title: "Gagal",
            description: "Gagal menambah pegawai",
            variant: "destructive",
          });
        }
      } else {
        const res = await fetch(`/api/employees/${formState.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formState.name,
            email: formState.email,
            password: formState.password || undefined,
            phone: formState.phone || null,
            address: formState.address || null,
            roleCode: formState.roleCode,
            managerId:
              formState.roleCode === "TEAM_LEADER"
                ? Number(formState.managerId || 0) || undefined
                : undefined,
            teamLeaderId:
              formState.roleCode === "SALES"
                ? Number(formState.teamLeaderId || 0) || undefined
                : undefined,
            photo: photoPath || null,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          toast({
            title: "Gagal",
            description: "Gagal mengupdate pegawai",
            variant: "destructive",
          });
        }
      }

      setIsFormOpen(false);
      await fetchEmployees(search);
      await fetchSuperiors();
    } catch (err: any) {
      toast({
        title: "Gagal",
        description: "Gagal menyimpan pegawai",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function openDeleteConfirm(emp: Employee) {
    setDeleteTarget(emp);
    setIsDeleteOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/employees/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || "Gagal menghapus pegawai");
      }
      setIsDeleteOpen(false);
      setDeleteTarget(null);
      await fetchEmployees(search);
      await fetchSuperiors();
    } catch (err: any) {
      alert(err?.message || "Gagal menghapus pegawai");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    await fetchEmployees(search);
  }

  return (
    <>
      {/* Toolbar: Search + Add + View toggle */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <form
          onSubmit={handleSearchSubmit}
          className="w-full md:max-w-md relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama pegawai, email, atau jabatan..."
            className="pl-10 h-11 border-gray-300 focus:border-primary"
          />
        </form>

        <div className="flex items-center gap-2 justify-between md:justify-end">
          <div className="hidden md:flex gap-2">
            <Button
              variant={viewMode === "card" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("card")}
              className={
                viewMode === "card" ? "gradient-primary text-white" : ""
              }
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Kartu
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
              className={
                viewMode === "table" ? "gradient-primary text-white" : ""
              }
            >
              <List className="h-4 w-4 mr-2" />
              Tabel
            </Button>
          </div>

          <Button
            className="gradient-primary text-white shadow-lg hover:shadow-xl"
            onClick={openCreateForm}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Pegawai
          </Button>
        </div>
      </div>

      {/* List */}
      {loading && (
        <div className="flex items-center justify-center py-10 text-gray-500 gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Memuat data pegawai...</span>
        </div>
      )}

      {error && !loading && (
        <div className="text-center text-sm text-red-600 py-4">{error}</div>
      )}

      {!loading && !error && employees.length === 0 && (
        <div className="text-center text-sm text-gray-500 py-10">
          Belum ada data pegawai.
        </div>
      )}

      {!loading && !error && employees.length > 0 && (
        <>
          {viewMode === "card" || isMobile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {employees.map((employee) => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  onEdit={openEditForm}
                  onDelete={openDeleteConfirm}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmployeeTable
                employees={employees}
                onEdit={openEditForm}
                onDelete={openDeleteConfirm}
              />
            </div>
          )}
        </>
      )}

      {/* Modal Tambah/Edit Pegawai */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formMode === "create" ? "Tambah Pegawai" : "Edit Pegawai"}
            </DialogTitle>
            <DialogDescription>
              Isi data pegawai, jabatan, atasan, serta foto dan alamat
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Nama Pegawai</Label>
              <Input
                id="name"
                name="name"
                value={formState.name}
                onChange={handleFormChange}
                placeholder="Masukkan nama lengkap"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formState.email}
                  onChange={handleFormChange}
                  placeholder="Masukkan email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">No. HP</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formState.phone}
                  onChange={handleFormChange}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <Textarea
                id="address"
                name="address"
                value={formState.address}
                onChange={handleFormChange}
                placeholder="Alamat domisili pegawai"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Jabatan</Label>
                <Select
                  value={formState.roleCode}
                  onValueChange={(val: EmployeeRole) =>
                    setFormState((p) => ({ ...p, roleCode: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jabatan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="TEAM_LEADER">Team Leader</SelectItem>
                    <SelectItem value="SALES">Sales</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dropdown atasan (dinamis tergantung role) */}
              {formState.roleCode === "TEAM_LEADER" && (
                <div className="space-y-2">
                  <Label>Manager</Label>
                  <Select
                    value={formState.managerId}
                    onValueChange={(v) =>
                      setFormState((p) => ({ ...p, managerId: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formState.roleCode === "SALES" && (
                <div className="space-y-2">
                  <Label>Team Leader</Label>
                  <Select
                    value={formState.teamLeaderId}
                    onValueChange={(v) =>
                      setFormState((p) => ({ ...p, teamLeaderId: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih team leader" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamLeaders.map((tl) => (
                        <SelectItem key={tl.id} value={String(tl.id)}>
                          {tl.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Foto Pegawai</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setPhotoFile(file);
                }}
              />
              {formState.photoPath && !photoFile && (
                <p className="text-xs text-gray-500">
                  Foto saat ini:{" "}
                  <span className="font-mono">{formState.photoPath}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password{" "}
                {formMode === "edit" && (
                  <span className="text-xs text-gray-400">
                    (kosongkan jika tidak ingin mengubah)
                  </span>
                )}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formState.password}
                onChange={handleFormChange}
                placeholder={
                  formMode === "create"
                    ? "Minimal 8 karakter"
                    : "Biarkan kosong jika tidak diubah"
                }
                required={formMode === "create"}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="gradient-primary text-white"
                disabled={submitting}
              >
                {submitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {formMode === "create" ? "Simpan Pegawai" : "Update Pegawai"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Konfirmasi Hapus */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Pegawai</DialogTitle>
            <DialogDescription>
              Pegawai akan dihapus <strong>tidak permanen</strong>, sehingga
              dipindahkan ke sampah.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm text-gray-700">
            {deleteTarget ? (
              <>
                Apakah Anda yakin ingin menghapus pegawai{" "}
                <span className="font-semibold">{deleteTarget.name}</span> (
                {deleteTarget.email})?
              </>
            ) : (
              "Tidak ada pegawai terpilih."
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={deleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
