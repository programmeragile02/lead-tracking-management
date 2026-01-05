export function PriceItem({
  label,
  value,
  subValue,
}: {
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div>
      <p className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="font-semibold leading-tight">{value}</p>
      {subValue && (
        <p className="text-[11px] text-muted-foreground leading-tight mt-1">
          {subValue}
        </p>
      )}
    </div>
  );
}
