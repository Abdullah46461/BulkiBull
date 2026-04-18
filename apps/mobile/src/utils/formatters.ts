import type { BullSex, FeedType } from '@bulki-bull/shared';

export const sexLabels: Record<BullSex, string> = {
  MALE: 'Бычок',
  FEMALE: 'Телка',
  UNKNOWN: 'Не указан',
};

export const feedLabels: Record<FeedType, string> = {
  hay: 'Сено',
  compound_feed: 'Комбикорм',
};

export const feedHints: Record<FeedType, string> = {
  hay: 'Грубый корм на каждый день',
  compound_feed: 'Концентрат для рациона',
};

export const formatNumber = (value: number, maximumFractionDigits = 1): string =>
  new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits,
  }).format(value);

export const formatKg = (value: number): string =>
  formatNumber(value, 1);

export const formatDateRu = (value: string): string =>
  new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));

export const todayIsoDate = (): string => new Date().toISOString().slice(0, 10);
