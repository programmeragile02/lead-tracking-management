export function PriceItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="font-semibold leading-tight">{value}</p>
    </div>
  );
}
