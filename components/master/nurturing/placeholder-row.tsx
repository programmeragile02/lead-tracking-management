import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export function PlaceholderRow(props: {
  code: string;
  label: string;
  missingProducts?: { id: number; name: string }[];
  emptyText: string;
}) {
  const list = props.missingProducts ?? [];
  const missingCount = list.length;

  return (
    <div className="flex items-start justify-between gap-3">
      <code className="font-bold bg-muted-foreground text-card px-1 rounded">{props.code}</code>

      <div className="flex items-center gap-2">
        {missingCount === 0 ? (
          <Badge variant="secondary">OK</Badge>
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 px-0 cursor-pointer hover:shadow-lg">
                <Badge variant="destructive" className="pointer-events-none">
                  Missing {missingCount}
                </Badge>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <div className="text-sm font-medium mb-1">
                {props.label} belum diisi
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                {props.emptyText}
              </div>

              <div className="max-h-44 overflow-auto space-y-1">
                {list.slice(0, 30).map((p) => (
                  <div key={p.id} className="text-sm">
                    • {p.name}
                  </div>
                ))}
                {missingCount > 30 ? (
                  <div className="text-xs text-muted-foreground">
                    +{missingCount - 30} lainnya...
                  </div>
                ) : null}
              </div>

              {/* opsional: arahkan ke halaman master product */}
              {/* <div className="mt-3">
                <Button size="sm" className="w-full" onClick={() => router.push("/master/products")}>
                  Buka Master Produk
                </Button>
              </div> */}
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}
