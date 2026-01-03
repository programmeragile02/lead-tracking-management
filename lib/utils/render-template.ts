export function renderTemplate(
  template: string,
  data: Record<string, any>
): string {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
    const value = data[key];
    return value !== undefined && value !== null ? String(value) : "";
  });
}
