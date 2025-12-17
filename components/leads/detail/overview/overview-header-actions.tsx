"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Pencil, X } from "lucide-react";

export function OverviewHeaderActions(props: {
  overviewEditing: boolean;
  setOverviewEditing: (v: boolean) => void;
  detailLoading: boolean;
  savingOverview: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  const {
    overviewEditing,
    setOverviewEditing,
    detailLoading,
    savingOverview,
    onCancel,
    onSave,
  } = props;

  if (!overviewEditing) {
    return (
      <Button
        size="sm"
        variant="default"
        className="h-8 px-2 text-xs"
        onClick={() => setOverviewEditing(true)}
        disabled={detailLoading}
      >
        <Pencil className="mr-1 h-3 w-3" />
        Edit
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        className="h-8 px-2 text-xs"
        onClick={onCancel}
        disabled={savingOverview}
      >
        <X className="mr-1 h-3 w-3" />
        Batal
      </Button>
      <Button
        size="sm"
        className="h-8 px-3 text-xs"
        onClick={onSave}
        disabled={savingOverview}
      >
        {savingOverview ? (
          <>
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Menyimpan...
          </>
        ) : (
          "Simpan perubahan"
        )}
      </Button>
    </div>
  );
}
