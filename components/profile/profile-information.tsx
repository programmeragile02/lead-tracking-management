"use client";

import { useEffect, useState } from "react";
import { User, Mail, Phone, MapPin, Briefcase, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { ProfileUser } from "@/app/profile/page";

type ProfileInformationProps = {
  user: ProfileUser;
  isEditing: boolean;
  onCancel: () => void;
  onUpdated: (user: ProfileUser) => void;
  onError: (message: string) => void;
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

export function ProfileInformation({
  user,
  isEditing,
  onCancel,
  onUpdated,
  onError,
}: ProfileInformationProps) {
  const [form, setForm] = useState<FormState>({
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    address: user.address || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // sinkron kalau data user berubah (misal setelah mutate)
  useEffect(() => {
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      address: user.address || "",
    });
  }, [user]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          address: form.address || null,
        }),
      });

      const json = (await res.json()) as {
        ok: boolean;
        data?: ProfileUser;
        error?: string;
      };

      if (!res.ok || !json.ok || !json.data) {
        onError(json.error || "Gagal menyimpan profil");
      } else {
        onUpdated(json.data);
      }
    } catch (err) {
      onError("Terjadi kesalahan jaringan");
    } finally {
      setIsSaving(false);
    }
  };

  const joinedDate = new Date(user.createdAt).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  if (!isEditing) {
    const fields = [
      { label: "Nama Lengkap", value: user.name, icon: User },
      { label: "Email", value: user.email, icon: Mail },
      {
        label: "Nomor Telepon",
        value: user.phone || "Belum diisi",
        icon: Phone,
      },
      {
        label: "Alamat",
        value: user.address || "Belum diisi",
        icon: MapPin,
      },
      {
        label: "Posisi",
        value: user.roleName || "Belum diatur",
        icon: Briefcase,
      },
      {
        label: "Bergabung Sejak",
        value: joinedDate,
        icon: Calendar,
      },
    ];

    return (
      <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Informasi Pribadi
        </h3>
        <div className="space-y-4">
          {fields.map((field) => (
            <div
              key={field.label}
              className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0"
            >
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                <field.icon className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">
                  {field.label}
                </p>
                <p className="text-base font-semibold text-gray-900">
                  {field.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // MODE EDIT
  return (
    <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Ubah Informasi Pribadi
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Nama Lengkap
            </label>
            <Input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Nomor Telepon
            </label>
            <Input
              placeholder="cth: 0812xxxx"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Alamat</label>
            <Textarea
              rows={3}
              placeholder="Alamat domisili"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
          >
            Batal
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </div>
  );
}
