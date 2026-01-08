"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type CityItem = {
  id: number;
  name: string;
  type: "KOTA" | "KABUPATEN";
  province: {
    id: number;
    name: string;
  };
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function CitySearchSelect(props: {
  value?: CityItem | null;
  onSelect: (city: CityItem) => void;
}) {
  const { value, onSelect } = props;

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const { data, isLoading } = useSWR(
    q ? `/api/public/cities?q=${encodeURIComponent(q)}` : null,
    fetcher
  );

  const items: CityItem[] = data?.data ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="h-9 w-full justify-between text-xs sm:text-sm"
        >
          {value
            ? `${value.type === "KABUPATEN" ? "Kab." : ""} ${value.name}`
            : "Pilih kota / kabupaten"}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[320px] p-0">
        <Command>
          <CommandInput
            placeholder="Cari kota / kabupaten..."
            value={q}
            onValueChange={setQ}
          />
          <CommandList>
            {isLoading && <CommandItem disabled>Memuat data...</CommandItem>}

            {!isLoading && items.length === 0 && (
              <CommandEmpty>Tidak ditemukan</CommandEmpty>
            )}

            {items.map((c) => (
              <CommandItem
                key={c.id}
                value={`${c.name}-${c.province.name}`}
                onSelect={() => {
                  onSelect(c);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value?.id === c.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span className="text-sm">
                    {c.type === "KABUPATEN" ? "Kab." : ""} {c.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {c.province.name}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}