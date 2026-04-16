import type { BullSex } from '@bulki-bull/shared';

export const sexLabels: Record<BullSex, string> = {
  MALE: 'Бычок',
  FEMALE: 'Телка',
  UNKNOWN: 'Не указан',
};

export const formatKg = (value: number): string =>
  new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 1,
  }).format(value);

export const formatDateRu = (value: string): string =>
  new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));

export const todayIsoDate = (): string => new Date().toISOString().slice(0, 10);
