const TZ = 'Asia/Jakarta';

const dayKey = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);

const daysBetween = (a: Date, b: Date) =>
  Math.round((Date.parse(dayKey(a)) - Date.parse(dayKey(b))) / 86_400_000);

export const formatClock = (iso: string) =>
  new Intl.DateTimeFormat('id-ID', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso)).replace(':', '.');

export function formatListTime(iso: string, now = new Date()) {
  const d = new Date(iso);
  const diff = daysBetween(now, d);
  if (diff <= 0) return formatClock(iso);
  if (diff === 1) return 'Kemarin';
  if (diff < 7)
    return new Intl.DateTimeFormat('id-ID', { timeZone: TZ, weekday: 'long' }).format(d);
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(d);
}

export function formatDayLabel(iso: string, now = new Date()) {
  const d = new Date(iso);
  const diff = daysBetween(now, d);
  if (diff <= 0) return 'Hari ini';
  if (diff === 1) return 'Kemarin';
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: TZ,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export function isSameDay(a: string, b: string): boolean {
  return dayKey(new Date(a)) === dayKey(new Date(b));
}

export function isWithin5Min(a: string, b: string): boolean {
  return Math.abs(Date.parse(a) - Date.parse(b)) < 5 * 60_000;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
