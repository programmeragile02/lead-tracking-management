export function renderDynamicFieldValue(field: any, value: string) {
  if (!value) return "—";

  if (field.type === "MULTI_SELECT") {
    try {
      const arr: string[] = JSON.parse(value);

      if (!Array.isArray(arr) || !arr.length) return "—";

      return arr
        .map((v) => {
          const opt = field.options?.find((o: any) => o.value === v);
          return opt?.label || v;
        })
        .join(", ");
    } catch {
      return "—";
    }
  }

  if (field.type === "SINGLE_SELECT") {
    const opt = field.options?.find((o: any) => o.value === value);
    return opt?.label || value;
  }

  return value;
}
