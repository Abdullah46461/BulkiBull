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

export const formatKg = (value: number): string => formatNumber(value, 1);

const parseDateValue = (value: string): Date => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(value);
};

export const toLocalIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const formatDateRu = (value: string): string =>
  new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parseDateValue(value));

export const formatDateShortRu = (value: string): string =>
  new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  }).format(parseDateValue(value));

export const formatFeedPeriodRu = (startDate: string, endDate: string): string => {
  if (startDate === endDate) {
    return formatDateRu(endDate);
  }

  const startYear = startDate.slice(0, 4);
  const endYear = endDate.slice(0, 4);
  const formattedStart =
    startYear === endYear ? formatDateShortRu(startDate) : formatDateRu(startDate);

  return `${formattedStart} - ${formatDateRu(endDate)}`;
};

export const formatFeedPeriodCompactRu = (startDate: string, endDate: string): string => {
  if (startDate === endDate) {
    return formatDateShortRu(endDate);
  }

  return `${formatDateShortRu(startDate)} - ${formatDateShortRu(endDate)}`;
};

export const todayIsoDate = (): string => toLocalIsoDate(new Date());
