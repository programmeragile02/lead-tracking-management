"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { OverviewInfoItem } from "./overview-info-item";
import { Info } from "lucide-react";
import { renderDynamicFieldValue } from "./render-dynamic-field";

export function OverviewDynamicFieldsSection(props: {
  overviewEditing: boolean;
  dynamicFields: any[];
  overviewCustomValues: Record<number, string>;
  setCustomValue: (fieldId: number, value: string) => void;
}) {
  const {
    overviewEditing,
    dynamicFields,
    overviewCustomValues,
    setCustomValue,
  } = props;

  if (!dynamicFields.length) return null;

  return (
    <div>
      <p className="mb-1 text-sm md:text-lg font-medium text-muted-foreground">
        Informasi Tambahan
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        {dynamicFields.map((f) => {
          const value = overviewCustomValues[f.id] ?? "";
          const requiredMark = f.isRequired ? " *" : "";

          if (!overviewEditing) {
            return (
              <OverviewInfoItem key={f.id} icon={Info} label={f.label}>
                {renderDynamicFieldValue(f, value)}
              </OverviewInfoItem>
            );
          }

          switch (f.type) {
            case "TEXTAREA":
              return (
                <div key={f.id}>
                  <p className="text-[11px] md:text-sm text-muted-foreground">
                    {f.label}
                    {requiredMark}
                  </p>
                  <Textarea
                    rows={3}
                    className="mt-1 text-xs sm:text-sm"
                    value={value}
                    onChange={(e) => setCustomValue(f.id, e.target.value)}
                  />
                </div>
              );

            case "NUMBER":
              return (
                <div key={f.id}>
                  <p className="text-[11px] md:text-sm text-muted-foreground">
                    {f.label}
                    {requiredMark}
                  </p>
                  <Input
                    type="number"
                    className="mt-1 h-9 text-xs sm:text-sm"
                    value={value}
                    onChange={(e) => setCustomValue(f.id, e.target.value)}
                  />
                </div>
              );

            case "DATE":
              return (
                <div key={f.id}>
                  <p className="text-[11px] md:text-sm text-muted-foreground">
                    {f.label}
                    {requiredMark}
                  </p>
                  <Input
                    type="date"
                    className="mt-1 h-9 text-xs sm:text-sm"
                    value={value}
                    onChange={(e) => setCustomValue(f.id, e.target.value)}
                  />
                </div>
              );

            case "SINGLE_SELECT":
              return (
                <div key={f.id}>
                  <p className="text-[11px] md:text-sm text-muted-foreground">
                    {f.label}
                    {requiredMark}
                  </p>
                  <Select
                    value={value}
                    onValueChange={(v) => setCustomValue(f.id, v)}
                  >
                    <SelectTrigger className="mt-1 h-9 text-xs sm:text-sm">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options?.map((opt: any) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );

            case "MULTI_SELECT": {
              let selected: string[] = [];
              try {
                selected = value ? JSON.parse(value) : [];
              } catch {
                selected = [];
              }

              return (
                <div key={f.id} className="space-y-1">
                  <p className="text-[11px] md:text-sm text-muted-foreground">
                    {f.label}
                    {requiredMark}
                  </p>
                  <div className="flex flex-wrap gap-2 rounded-md border bg-background/60 p-2">
                    {f.options?.map((opt: any) => {
                      const active = selected.includes(opt.value);
                      return (
                        <Button
                          key={opt.value}
                          type="button"
                          size="sm"
                          variant={active ? "default" : "outline"}
                          className="h-7 px-2 text-[11px]"
                          onClick={() => {
                            const next = active
                              ? selected.filter((s) => s !== opt.value)
                              : [...selected, opt.value];

                            setCustomValue(f.id, JSON.stringify(next));
                          }}
                        >
                          {opt.label}
                        </Button>
                      );
                    })}

                    {!f.options?.length && (
                      <p className="text-[11px] md:text-sm text-muted-foreground">
                        Belum ada pilihan.
                      </p>
                    )}
                  </div>
                </div>
              );
            }

            case "TEXT":
            default:
              return (
                <div key={f.id}>
                  <p className="text-[11px] md:text-sm text-muted-foreground">
                    {f.label}
                    {requiredMark}
                  </p>
                  <Input
                    className="mt-1 h-9 text-xs sm:text-sm"
                    value={value}
                    onChange={(e) => setCustomValue(f.id, e.target.value)}
                  />
                </div>
              );
          }
        })}
      </div>
    </div>
  );
}
