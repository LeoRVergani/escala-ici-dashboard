function toBr(dateIso: string): string {
  const [year, month, day] = dateIso.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

export function formatPeriod(periodStart: string, periodEnd: string): string {
  return `${toBr(periodStart)} a ${toBr(periodEnd)}`;
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
