export function formatTime(s: number | null | undefined) {
  if (s == null || !Number.isFinite(s)) return "Time not supplied";
  const seconds = Math.floor(s);
  return Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
}
export function formatDate(iso: string) {
  const date = new Date(iso.length === 10 ? iso + "T00:00:00Z" : iso);
  return Number.isNaN(date.getTime())
    ? "Date not supplied"
    : date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
}

export function formatTimeRange(start: number | null, end: number | null) {
  if (start == null && end == null) return "Timing not supplied";
  if (end == null) return "At " + formatTime(start);
  if (start == null) return "Until " + formatTime(end);
  return formatTime(start) + "–" + formatTime(end);
}
