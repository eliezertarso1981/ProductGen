export function cycleFilterValue<T extends string>(
  current: "all" | T,
  values: readonly T[],
): "all" | T {
  if (current === "all") return values[0] ?? "all";
  const index = values.indexOf(current);
  if (index < 0 || index + 1 >= values.length) return "all";
  return values[index + 1];
}

export function normalizeDiscoverySearch(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
