import { Capacitor } from '@capacitor/core';
import { LocalNotifications, type LocalNotificationSchema } from '@capacitor/local-notifications';
import type { FeedResponse, FeedType } from '@bulki-bull/shared';

import { feedLabels, formatDateRu, toLocalIsoDate } from '../utils/formatters';
import { FEED_WARNING_DAYS, getFeedAvailability, isFeedExpired } from '../utils/feedAvailability';

const FEED_NOTIFICATION_BASE_IDS: Record<FeedType, number> = {
  hay: 4_100,
  compound_feed: 4_200,
};

const FEED_NOTIFICATION_HOUR = 9;
const FEED_NOTIFICATION_MINUTE = 0;
const IMMEDIATE_NOTIFICATION_DELAY_MS = 60_000;
const STORAGE_PREFIX = 'bulki-bull:feed-warning:';

type StoredNotificationState = {
  feedKey: string;
  lastImmediateDate: string | null;
};

type FeedNotificationPlan = {
  feedKey: string;
  lastImmediateDate: string | null;
  notifications: LocalNotificationSchema[];
  retainedIds: number[];
};

const isNativePlatform = (): boolean => Capacitor.getPlatform() !== 'web';

const getStorageKey = (type: FeedType): string => `${STORAGE_PREFIX}${type}`;

const parseIsoDate = (value: string): Date => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number): Date => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const differenceInCalendarDays = (left: Date, right: Date): number =>
  Math.round((startOfDay(left).getTime() - startOfDay(right).getTime()) / (24 * 60 * 60 * 1000));

const setNotificationTime = (date: Date, hour: number, minute: number): Date => {
  const nextDate = new Date(date);
  nextDate.setHours(hour, minute, 0, 0);
  return nextDate;
};

const readState = (type: FeedType): StoredNotificationState | null => {
  const rawValue = window.localStorage.getItem(getStorageKey(type));

  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as StoredNotificationState;

    if (
      typeof parsedValue.feedKey === 'string' &&
      (typeof parsedValue.lastImmediateDate === 'string' || parsedValue.lastImmediateDate === null)
    ) {
      return parsedValue;
    }
  } catch {
    // Ignore corrupted local state and overwrite it on the next sync.
  }

  window.localStorage.removeItem(getStorageKey(type));
  return null;
};

const writeState = (type: FeedType, state: StoredNotificationState): void => {
  window.localStorage.setItem(getStorageKey(type), JSON.stringify(state));
};

const clearState = (type: FeedType): void => {
  window.localStorage.removeItem(getStorageKey(type));
};

const buildFeedStateKey = (feed: FeedResponse, depletionDate: string): string =>
  [
    depletionDate,
    String(feed.currentStockKg),
    String(feed.consumptionPerBullPerDayKg),
    String(feed.bullsCount),
  ].join('|');

const getFeedNotificationIds = (type: FeedType): number[] =>
  Array.from({ length: FEED_WARNING_DAYS }, (_, index) => FEED_NOTIFICATION_BASE_IDS[type] + index);

const cancelFeedNotifications = async (type: FeedType, ids?: number[]): Promise<void> => {
  const notificationIds = ids ?? getFeedNotificationIds(type);

  if (!notificationIds.length) {
    return;
  }

  await LocalNotifications.cancel({
    notifications: notificationIds.map((id) => ({ id })),
  });
};

const ensureNotificationPermissions = async (): Promise<boolean> => {
  const permissionStatus = await LocalNotifications.checkPermissions();

  if (permissionStatus.display === 'granted') {
    return true;
  }

  const requestedPermissionStatus = await LocalNotifications.requestPermissions();
  return requestedPermissionStatus.display === 'granted';
};

const buildNotificationBody = (
  feed: FeedResponse,
  depletionDate: string,
  notificationDate: string,
  expiredToday: boolean,
): string => {
  if (expiredToday) {
    return `${feedLabels[feed.type]} уже закончился. Обновите остаток корма в приложении.`;
  }

  if (notificationDate === depletionDate) {
    return `${feedLabels[feed.type]} заканчивается сегодня. Пополните запас корма.`;
  }

  return `${feedLabels[feed.type]} заканчивается ${formatDateRu(depletionDate)}. Это ежедневное напоминание за последние ${FEED_WARNING_DAYS} дней запаса.`;
};

const buildFeedNotificationPlan = (
  feed: FeedResponse,
  state: StoredNotificationState | null,
  now: Date,
): FeedNotificationPlan => {
  const availability = getFeedAvailability(feed);

  if (availability.daysLeft === null || availability.depletionDate === null) {
    return {
      feedKey: '',
      lastImmediateDate: null,
      notifications: [],
      retainedIds: [],
    };
  }

  const today = startOfDay(now);
  const todayIso = toLocalIsoDate(today);
  const depletionDate = parseIsoDate(availability.depletionDate);
  const warningStartDate = addDays(depletionDate, -(FEED_WARNING_DAYS - 1));
  const firstNotificationDate =
    today.getTime() > warningStartDate.getTime() ? today : warningStartDate;
  const feedKey = buildFeedStateKey(feed, availability.depletionDate);
  const notifications: LocalNotificationSchema[] = [];
  const retainedIds: number[] = [];
  let lastImmediateDate = state?.lastImmediateDate ?? null;

  for (
    let cursor = firstNotificationDate;
    cursor.getTime() <= depletionDate.getTime();
    cursor = addDays(cursor, 1)
  ) {
    const notificationDateIso = toLocalIsoDate(cursor);
    const offset = differenceInCalendarDays(cursor, warningStartDate);
    const notificationId = FEED_NOTIFICATION_BASE_IDS[feed.type] + offset;
    let scheduledAt = setNotificationTime(cursor, FEED_NOTIFICATION_HOUR, FEED_NOTIFICATION_MINUTE);

    if (notificationDateIso === todayIso && now.getTime() >= scheduledAt.getTime()) {
      if (state?.lastImmediateDate === todayIso) {
        retainedIds.push(notificationId);
        continue;
      }

      scheduledAt = new Date(now.getTime() + IMMEDIATE_NOTIFICATION_DELAY_MS);
      lastImmediateDate = todayIso;
    }

    notifications.push({
      id: notificationId,
      title: `${feedLabels[feed.type]} требует внимания`,
      body: buildNotificationBody(
        feed,
        availability.depletionDate,
        notificationDateIso,
        notificationDateIso === todayIso && isFeedExpired(availability.daysLeft),
      ),
      schedule: {
        at: scheduledAt,
        allowWhileIdle: true,
      },
      autoCancel: true,
      threadIdentifier: 'feed-stock-warning',
      group: 'feed-stock-warning',
    });
  }

  return {
    feedKey,
    lastImmediateDate,
    notifications,
    retainedIds,
  };
};

const syncSingleFeedNotification = async (
  feed: FeedResponse,
  pendingIds: Set<number>,
  now: Date,
): Promise<void> => {
  const state = readState(feed.type);
  const plan = buildFeedNotificationPlan(feed, state, now);
  const currentFeedPendingIds = getFeedNotificationIds(feed.type).filter((id) =>
    pendingIds.has(id),
  );

  if (!plan.feedKey) {
    if (currentFeedPendingIds.length) {
      await cancelFeedNotifications(feed.type, currentFeedPendingIds);
      for (const id of currentFeedPendingIds) {
        pendingIds.delete(id);
      }
    }

    clearState(feed.type);
    return;
  }

  const effectiveRetainedIds = plan.retainedIds.filter((id) => pendingIds.has(id));
  const desiredIds = new Set([
    ...effectiveRetainedIds,
    ...plan.notifications.map((notification) => notification.id),
  ]);
  const hasAllDesiredPending =
    effectiveRetainedIds.length === plan.retainedIds.length &&
    plan.notifications.every((notification) => pendingIds.has(notification.id));
  const hasStalePending = currentFeedPendingIds.some((id) => !desiredIds.has(id));
  const stateChanged =
    state?.feedKey !== plan.feedKey || state?.lastImmediateDate !== plan.lastImmediateDate;

  if (!stateChanged && !hasStalePending && hasAllDesiredPending) {
    return;
  }

  if (currentFeedPendingIds.length) {
    await cancelFeedNotifications(feed.type, currentFeedPendingIds);
    for (const id of currentFeedPendingIds) {
      pendingIds.delete(id);
    }
  }

  if (plan.notifications.length) {
    await LocalNotifications.schedule({
      notifications: plan.notifications,
    });

    for (const notification of plan.notifications) {
      pendingIds.add(notification.id);
    }
  }

  writeState(feed.type, {
    feedKey: plan.feedKey,
    lastImmediateDate: plan.lastImmediateDate,
  });
};

export const syncFeedNotifications = async (feeds: FeedResponse[]): Promise<void> => {
  if (!isNativePlatform() || feeds.length === 0) {
    return;
  }

  try {
    const permissionsGranted = await ensureNotificationPermissions();

    if (!permissionsGranted) {
      return;
    }

    const pendingNotifications = await LocalNotifications.getPending();
    const pendingIds = new Set(
      pendingNotifications.notifications.map((notification) => notification.id),
    );
    const now = new Date();

    for (const feed of feeds) {
      await syncSingleFeedNotification(feed, pendingIds, now);
    }
  } catch {
    // Notifications are a secondary enhancement. Feed calculations should still work without them.
  }
};
