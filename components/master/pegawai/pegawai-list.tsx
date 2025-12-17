"use client";

import { useEffect, useState, ChangeEvent, FormEvent, useRef } from "react";
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
  managerId?: number | null;
  teamLeaderId?: number | null;
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

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

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
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // modal hapus
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [managers, setManagers] = useState<SimpleUser[]>([]);
  const [teamLeaders, setTeamLeaders] = useState<SimpleUser[]>([]);

  async function fetchEmployees(pageParam = 1, q?: string) {
    try {
      setLoading(true);
      setError(null);

      const url = new URL("/api/employees", window.location.origin);

      url.searchParams.set("page", String(pageParam));
      url.searchParams.set("pageSize", String(pageSize));

      const term = q ?? search;
      if (term && term.trim()) url.searchParams.set("q", term.trim());

      const res = await fetch(url.toString());
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || "Gagal memuat data pegawai");
      }

      setEmployees(json.data as Employee[]);

      if (json.meta) {
        setPage(json.meta.page);
        setTotal(json.meta.total);
        setTotalPages(json.meta.totalPages);
      } else {
        // fallback jika API belum support meta
        setPage(1);
        const count = (json.data as Employee[]).length || 0;
        setTotal(count);
        setTotalPages(1);
      }
    } catch (err: any) {
      setError(err?.message || "Gagal memuat data pegawai");
    } finally {
      setLoading(false);
    }
  }

  // ambil list manager & TL untuk dropdown atasan (onlyActive=true, tanpa paging)
  async function fetchSuperiors() {
    try {
      const url = new URL("/api/employees", window.location.origin);
      url.searchParams.set("onlyActive", "true");
      const res = await fetch(url.toString());
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
    fetchEmployees(1);
    fetchSuperiors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setPhotoPreview(null);
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
      managerId: emp.managerId ? String(emp.managerId) : "",
      teamLeaderId: emp.teamLeaderId ? String(emp.teamLeaderId) : "",
      photoPath: emp.photo || "",
    });
    setPhotoFile(null);
    setPhotoPreview(emp.photo || null);
    setIsFormOpen(true);
  }

  function handleFormChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  }

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    // validasi tipe
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Format tidak didukung",
        description: "Silakan upload file gambar (JPG, PNG, dll).",
      });
      e.target.value = "";
      return;
    }

    // validasi ukuran 2MB
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast({
        variant: "destructive",
        title: "Ukuran terlalu besar",
        description: "Ukuran foto maksimal 2MB.",
      });
      setPhotoFile(null);
      setPhotoPreview(null);
      e.target.value = "";
      return;
    }

    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
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
          throw new Error(jsonUpload.message || "Gagal upload foto");
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
          throw new Error(json.message || "Gagal menambah pegawai");
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
          throw new Error(json.message || "Gagal mengupdate pegawai");
        }
      }

      toast({
        title: "Berhasil",
        description:
          formMode === "create"
            ? "Pegawai berhasil ditambahkan."
            : "Pegawai berhasil diperbarui.",
      });

      setIsFormOpen(false);
      // setelah simpan, refresh list (kembali ke page 1 saat create)
      if (formMode === "create") {
        await fetchEmployees(1, search);
      } else {
        await fetchEmployees(page, search);
      }
      await fetchSuperiors();
    } catch (err: any) {
      toast({
        title: "Gagal",
        description: err?.message || "Gagal menyimpan pegawai",
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
      await fetchEmployees(page, search);
      await fetchSuperiors();
      toast({
        title: "Berhasil",
        description: "Pegawai berhasil dihapus.",
      });
    } catch (err: any) {
      toast({
        title: "Gagal",
        description: err?.message || "Gagal menghapus pegawai",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }

  async function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    await fetchEmployees(1, search);
  }

  async function handlePageChange(newPage: number) {
    if (newPage < 1 || newPage > totalPages) return;
    await fetchEmployees(newPage);
  }

  return (
    <>
      {/* Toolbar: Search + Add + View toggle */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <form
          onSubmit={handleSearchSubmit}
          className="w-full md:max-w-md relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama pegawai, email, atau jabatan..."
            className="pl-10 h-11 border-muted-foreground focus:border-primary"
          />
        </form>

        <div className="flex items-center gap-2 justify-between md:justify-end">
          <div className="hidden md:flex gap-2">
            <Button
              variant={viewMode === "card" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("card")}
              className={
                viewMode === "card" ? "bg-primary text-white" : ""
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
                viewMode === "table" ? "bg-primary text-white" : ""
              }
            >
              <List className="h-4 w-4 mr-2" />
              Tabel
            </Button>
          </div>

          <Button
            className="bg-primary text-white shadow-lg hover:shadow-xl"
            onClick={openCreateForm}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Pegawai
          </Button>
        </div>
      </div>

      {/* List */}
      {loading && (
        <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Memuat data pegawai...</span>
        </div>
      )}

      {error && !loading && (
        <div className="text-center text-sm text-primary py-4">{error}</div>
      )}

      {!loading && !error && employees.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-10">
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

          {/* Pagination */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 mt-6 text-sm">
            <div className="text-muted-foreground">
              {total > 0 && (
                <>
                  Menampilkan{" "}
                  <span className="font-semibold">
                    {(page - 1) * pageSize + 1}
                  </span>{" "}
                  -{" "}
                  <span className="font-semibold">
                    {Math.min(page * pageSize, total)}
                  </span>{" "}
                  dari <span className="font-semibold">{total}</span> pegawai
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                Sebelumnya
              </Button>

              <span className="text-muted-foreground">
                Halaman <span className="font-semibold">{page}</span> /{" "}
                {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                Berikutnya
              </Button>
            </div>
          </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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

            {/* Upload foto pegawai - style sama seperti produk */}
            <div className="space-y-2">
              <Label>Foto Pegawai</Label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />

              {photoPreview || formState.photoPath ? (
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="relative w-full md:w-32 h-32 rounded-xl overflow-hidden border border-border bg-muted-foreground">
                    <img
                      src={photoPreview || formState.photoPath || ""}
                      alt={formState.name || "Foto pegawai"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground">
                      {photoPreview
                        ? "Foto baru siap disimpan."
                        : "Foto pegawai saat ini. Kamu bisa mengganti atau menghapus foto."}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Ganti Foto
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:bg-red-50"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                          setFormState((prev) => ({
                            ...prev,
                            photoPath: "",
                          }));
                        }}
                      >
                        Hapus Foto
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="w-full border border-dashed border-muted-foreground rounded-xl p-4 md:p-5 flex flex-col md:flex-row items-center gap-4 cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                    <svg
                      className="w-6 h-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v1.125C3 18.66 4.343 20 6 20h12c1.657 0 3-1.34 3-2.375V16.5M16.5 9 12 4.5 7.5 9M12 4.5V15"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 text-center md:text-left space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Upload foto pegawai
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Klik di sini untuk memilih file gambar. Format JPG/PNG,
                      ukuran maksimal 2MB.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Pilih File
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password{" "}
                {formMode === "edit" && (
                  <span className="text-xs text-muted-foreground">
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
                className="bg-primary text-white"
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
              Pegawai akan dihapus tidak permanen dan dipindahkan ke sampah
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
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
