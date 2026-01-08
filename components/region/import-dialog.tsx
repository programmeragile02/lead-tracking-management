"use client";

import { useCallback, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, FileSpreadsheet, Download } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function RegionImportDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const onDrop = useCallback(
    (files: FileList | null) => {
      if (!files || !files[0]) return;
      const f = files[0];
      if (!f.name.endsWith(".xlsx")) {
        toast({
          variant: "destructive",
          title: "Format tidak valid",
          description: "Gunakan file .xlsx",
        });
        return;
      }
      setFile(f);
    },
    [toast]
  );

  const handleImport = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "File belum dipilih",
      });
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/master/import-region", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal import");
      }

      setResult(json);

      toast({
        title: "Import selesai",
        description: `Berhasil ${json.summary.success}, Skip ${json.summary.skipped}, Gagal ${json.summary.failed}`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Import gagal",
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Provinsi & Kota</DialogTitle>
        </DialogHeader>

        {/* INFO */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p>📌 Format kolom wajib:</p>
          <ul className="list-disc ml-4">
            <li>province_code (text)</li>
            <li>province_name</li>
            <li>city_code (contoh: 32.73)</li>
            <li>city_name</li>
            <li>city_type: KOTA / KABUPATEN</li>
          </ul>
        </div>

        {/* DROPZONE */}
        <div
          className="mt-4 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary transition"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onDrop(e.dataTransfer.files);
          }}
          onClick={() => document.getElementById("region-file-input")?.click()}
        >
          <input
            id="region-file-input"
            type="file"
            accept=".xlsx"
            hidden
            onChange={(e) => onDrop(e.target.files)}
          />

          {file ? (
            <div className="flex flex-col items-center gap-2">
              <FileSpreadsheet className="h-8 w-8 text-green-600" />
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                Klik untuk ganti file
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <UploadCloud className="h-8 w-8" />
              <p className="text-sm">
                Drag & drop file Excel di sini <br />
                atau klik untuk pilih file
              </p>
            </div>
          )}
        </div>

        {/* download template */}
        <a
          href="/api/master/import-region/template"
          className="flex items-center justify-center gap-2 text-xs hover:text-primary transition"
        >
          <Download className="h-4 w-4" />
          Unduh Template Excel
        </a>

        {/* ACTION */}
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => setFile(null)}
            disabled={loading}
          >
            Reset
          </Button>
          <Button
            className="bg-primary text-white"
            onClick={handleImport}
            disabled={loading}
          >
            {loading ? "Mengimpor..." : "Mulai Import"}
          </Button>
        </div>

        {/* RESULT */}
        {result && (
          <div className="mt-4 text-xs bg-muted p-3 rounded">
            <p>Total: {result.summary.total}</p>
            <p className="text-green-600">Berhasil: {result.summary.success}</p>
            <p className="text-yellow-600">Skip: {result.summary.skipped}</p>
            <p className="text-red-600">Gagal: {result.summary.failed}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
