export const SOURCE_COLORS = [
  "#6366F1", // indigo
  "#22C55E", // green
  "#F97316", // orange
  "#06B6D4", // cyan
  "#A855F7", // purple
  "#EF4444", // red
  "#EAB308", // yellow
  "#14B8A6", // teal
  "#3B82F6", // blue
  "#EC4899", // pink
  "#84CC16", // lime
  "#0EA5E9", // sky
  "#F43F5E", // rose
  "#8B5CF6", // violet
  "#64748B", // slate
];

// helper
export const getColorByIndex = (index: number) =>
  SOURCE_COLORS[index % SOURCE_COLORS.length];
