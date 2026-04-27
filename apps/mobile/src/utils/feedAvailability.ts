import {
  calculateFeedAvailability as calculateSharedFeedAvailability,
  type FeedAvailability,
  type FeedResponse,
} from '@bulki-bull/shared';

export const FEED_WARNING_DAYS = 10;

export type FeedAvailabilityWithPeriod = FeedAvailability & {
  daysLeft: number;
  periodStartDate: string;
  depletionDate: string;
};

type FeedAvailabilityInput = {
  bullsCount: number;
  currentStockKg: number | null;
  consumptionPerBullPerDayKg: number | null;
};

export const buildFeedAvailabilityPreview = (
  input: FeedAvailabilityInput,
  now = new Date(),
): FeedAvailability => calculateSharedFeedAvailability(input, now);

export const getFeedAvailability = (feed: FeedResponse): FeedAvailability => ({
  dailyConsumptionKg: feed.dailyConsumptionKg,
  daysLeft: feed.daysLeft,
  periodStartDate: feed.periodStartDate,
  depletionDate: feed.depletionDate,
});

export const hasFeedPeriod = (
  availability: FeedAvailability,
): availability is FeedAvailabilityWithPeriod =>
  availability.daysLeft !== null &&
  availability.periodStartDate !== null &&
  availability.depletionDate !== null;

export const isFeedExpired = (daysLeft: number | null): boolean =>
  daysLeft !== null && daysLeft <= 0;

export const isFeedExpiringSoon = (daysLeft: number | null): boolean =>
  daysLeft !== null && daysLeft > 0 && daysLeft < FEED_WARNING_DAYS;

export const isFeedWarning = (daysLeft: number | null): boolean =>
  isFeedExpired(daysLeft) || isFeedExpiringSoon(daysLeft);
