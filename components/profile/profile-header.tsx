"use client";

import { useMemo, useRef, useState } from "react";
import { Camera, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { ProfileUser } from "@/app/profile/page";

type ProfileHeaderProps = {
  user: ProfileUser;
  isEditing: boolean;
  onEditClick: () => void;
  onPhotoUpdated?: (user: ProfileUser) => void;
};

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[parts.length - 1].charAt(0).toUpperCase()
  );
}

export function ProfileHeader({
  user,
  isEditing,
  onEditClick,
  onPhotoUpdated,
}: ProfileHeaderProps) {
  const initials = getInitials(user.name);
  const position = user.roleName || "—";
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentPreview = useMemo(() => {
    if (previewUrl) return previewUrl;
    if (user.photo) return user.photo;
    return null;
  }, [previewUrl, user.photo]);

  const handleOpenDialog = () => {
    setOpen(true);
    setPreviewUrl(null);
    setSelectedFile(null);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    // bersihkan URL object kalau ada
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setIsUploading(false);
  };

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      toast({
        title: "File terlalu besar",
        description: "Ukuran foto maksimal 2MB.",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast({
        title: "Tipe file tidak didukung",
        description: "Gunakan JPG, PNG, atau WEBP.",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    // bersihkan preview lama
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", selectedFile);

      const res = await fetch("/api/profile/photo", {
        method: "POST",
        body: formData,
      });

      const json = (await res.json()) as {
        ok: boolean;
        data?: ProfileUser;
        error?: string;
      };

      if (!res.ok || !json.ok || !json.data) {
        toast({
          title: "Gagal mengunggah foto",
          description: json.error || "Terjadi kesalahan saat mengunggah foto.",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      onPhotoUpdated?.(json.data);
      handleCloseDialog();
    } catch (err) {
      toast({
        title: "Gagal mengunggah foto",
        description: "Periksa koneksi internet Anda dan coba lagi.",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="bg-primary rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            {user.photo ? (
              <div className="w-24 h-24 rounded-full bg-primary overflow-hidden shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.photo}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-3xl font-bold text-primary shadow-lg">
                {initials}
              </div>
            )}

            {/* tombol kamera buka modal */}
            <button
              type="button"
              className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-muted-foreground transition-colors"
              onClick={handleOpenDialog}
            >
              <Camera className="w-4 h-4 text-primary" />
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-white mb-1">{user.name}</h2>
            <p className="text-white/90 font-medium mb-2">{position}</p>
            <p className="text-white/80 text-sm">{user.email}</p>
          </div>

          <Button
            variant="secondary"
            className="bg-white text-primary hover:bg-muted-foreground cursor-pointer font-semibold shadow-md"
            onClick={onEditClick}
          >
            {isEditing ? "Selesai" : "Edit Profil"}
          </Button>
        </div>
      </div>

      {/* Modal preview & upload foto */}
      <Dialog
        open={open}
        onOpenChange={(open) =>
          open ? handleOpenDialog() : handleCloseDialog()
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Foto Profil</DialogTitle>
            <DialogDescription>
              Unggah foto profil baru dengan ukuran maksimal 2MB.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-2">
            <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden border">
              {currentPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentPreview}
                  alt="Preview foto profil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-primary">
                  {initials}
                </span>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleSelectFile}
            />

            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Pencil className="w-4 h-4" />
              {selectedFile ? "Ganti Foto Profil" : "Unggah Foto Profil"}
            </Button>

            {selectedFile && (
              <p className="text-xs text-muted-foreground text-center">
                {selectedFile.name} &middot;{" "}
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>

          <DialogFooter className="flex justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isUploading}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? "Menyimpan..." : "Simpan Foto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
