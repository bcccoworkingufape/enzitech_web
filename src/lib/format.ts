const numberFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 5 });
const dateFormat = new Intl.DateTimeFormat('pt-BR');

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  return numberFormat.format(value);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '-' : dateFormat.format(date);
}

export function toPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function parseDecimal(text: string): number {
  const normalized = text.trim().replace(',', '.');
  if (normalized === '') return NaN;
  return Number(normalized);
}

export function sanitizeDecimal(text: string): string {
  const cleaned = text.replace(/[^\d.,]/g, '');
  const match = cleaned.match(/^\d*([.,]\d{0,5})?/);
  return match ? match[0] : '';
}

export function sanitizeInteger(text: string): string {
  return text.replace(/\D/g, '');
}
