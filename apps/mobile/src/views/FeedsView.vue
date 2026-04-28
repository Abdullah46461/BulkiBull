<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-title>Корма</ion-title>
        <ion-buttons slot="end">
          <theme-toggle-button />
          <account-menu-button />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen>
      <main class="screen">
        <section v-if="loading" class="state">
          <ion-spinner name="crescent" />
          <p>Загружаем корма</p>
        </section>

        <section v-else-if="error" class="state">
          <p>{{ error }}</p>
          <ion-button fill="outline" @click="loadFeeds">Повторить</ion-button>
        </section>

        <section v-else-if="feeds.length === 0" class="state">
          <p>Корма пока не настроены</p>
          <ion-button fill="outline" @click="loadFeeds">Обновить</ion-button>
        </section>

        <template v-else>
          <section class="feed-grid">
            <article
              v-for="feed in feeds"
              :key="feed.type"
              class="feed-card"
              :class="`feed-card--${feed.type}`"
            >
              <header class="feed-card__header">
                <div class="feed-card__title-wrap">
                  <span class="feed-card__eyebrow">{{ feedHints[feed.type] }}</span>
                  <h2>{{ feedLabels[feed.type] }}</h2>
                </div>
                <ion-button
                  fill="outline"
                  size="small"
                  :disabled="savingType === feed.type"
                  @click="openEditModal(feed)"
                >
                  <ion-icon slot="start" :icon="createOutline" />
                  Изменить
                </ion-button>
              </header>

              <dl class="metric-grid">
                <div class="metric">
                  <dt>Остаток</dt>
                  <dd>{{ formatStock(feed.currentStockKg) }}</dd>
                </div>
                <div class="metric">
                  <dt>На голову</dt>
                  <dd>{{ formatPerBull(feed.consumptionPerBullPerDayKg) }}</dd>
                </div>
                <div class="metric">
                  <dt>Бычков</dt>
                  <dd>{{ feed.bullsCount }}</dd>
                </div>
                <div class="metric">
                  <dt>В день</dt>
                  <dd>{{ formatDailyConsumption(feed.dailyConsumptionKg) }}</dd>
                </div>
              </dl>

              <section class="summary-banner" :class="getSummaryBannerClass(feed)">
                <div class="summary-banner__copy">
                  <span>Период запаса</span>
                  <small v-if="hasEnoughData(feed)">
                    {{ getFeedPeriodCaption(feed) }}
                  </small>
                </div>
                <strong>{{ formatFeedPeriod(feed) }}</strong>
              </section>

              <p v-if="!hasEnoughData(feed)" class="feed-card__note">
                {{ getFeedNote(feed) }}
              </p>
            </article>
          </section>
        </template>
      </main>
    </ion-content>

    <ion-modal
      :is-open="isEditModalOpen"
      :initial-breakpoint="0.82"
      :breakpoints="[0, 0.82, 1]"
      :backdrop-dismiss="!isEditingFeedSaving"
      :handle="true"
      @did-dismiss="handleEditModalDismiss"
    >
      <ion-header translucent>
        <ion-toolbar>
          <ion-title>{{ editingFeedTitle }}</ion-title>
          <ion-buttons slot="end">
            <ion-button :disabled="isEditingFeedSaving" @click="closeEditModal">Закрыть</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content class="modal-content">
        <form v-if="editingFeed" class="modal-form" @submit.prevent="saveEditingFeed">
          <section class="modal-summary">
            <div
              class="modal-summary__item"
              :class="{
                'modal-summary__item--warning': isAvailabilityWarning(editingFeed.daysLeft),
              }"
            >
              <span>Сейчас</span>
              <strong
                :class="{
                  'modal-summary__value--warning': isAvailabilityWarning(editingFeed.daysLeft),
                }"
              >
                {{ formatFeedPeriod(editingFeed) }}
              </strong>
              <small>{{ formatDailyConsumption(editingFeed.dailyConsumptionKg) }} в день</small>
            </div>
            <div
              class="modal-summary__item modal-summary__item--accent"
              :class="{
                'modal-summary__item--warning': isAvailabilityWarning(editingFeedPreview.daysLeft),
              }"
            >
              <span>После сохранения</span>
              <strong
                :class="{
                  'modal-summary__value--warning': isAvailabilityWarning(
                    editingFeedPreview.daysLeft,
                  ),
                }"
              >
                {{ formatPreviewPeriod(editingFeedPreview) }}
              </strong>
              <small>
                {{ formatDailyConsumption(editingFeedPreview.dailyConsumptionKg) }} в день
              </small>
            </div>
          </section>

          <p class="modal-state" :class="{ 'modal-state--muted': !isEditingFeedDirty }">
            {{ editingFeedModalHint }}
          </p>

          <section v-if="formErrors[editingFeed.type]" class="error-block">
            <p>{{ formErrors[editingFeed.type] }}</p>
          </section>

          <section class="modal-fields">
            <section class="modal-section">
              <div class="modal-section__head">
                <span class="modal-section__eyebrow">Остаток</span>
                <strong>{{ formatStock(editingFeedPreview.currentStockKg) }}</strong>
              </div>
              <p class="modal-section__text">
                Сколько килограммов этого корма есть сейчас в наличии.
              </p>
            </section>
            <ion-item>
              <ion-input
                v-model="drafts[editingFeed.type].currentStockKg"
                type="text"
                inputmode="decimal"
                label="Остаток, кг"
                label-placement="stacked"
                placeholder="Например, 1200 или 1200,5"
                required
              />
            </ion-item>

            <section class="modal-section">
              <div class="modal-section__head">
                <span class="modal-section__eyebrow">Расход на голову</span>
                <strong>{{ formatPerBull(editingFeedPreview.consumptionPerBullPerDayKg) }}</strong>
              </div>
              <p class="modal-section__text">Средний дневной расход на одного бычка.</p>
            </section>
            <ion-item>
              <ion-input
                v-model="drafts[editingFeed.type].consumptionPerBullPerDayKg"
                type="text"
                inputmode="decimal"
                label="Расход на голову в день, кг"
                label-placement="stacked"
                placeholder="Например, 2,2"
                required
              />
            </ion-item>
          </section>

          <p class="edit-form__hint">Дробные значения можно вводить через точку или запятую.</p>
        </form>
      </ion-content>

      <ion-footer class="modal-footer">
        <ion-toolbar>
          <div class="modal-actions">
            <ion-button
              expand="block"
              fill="outline"
              type="button"
              :disabled="isEditingFeedSaving"
              @click="closeEditModal"
            >
              Отмена
            </ion-button>
            <ion-button
              expand="block"
              type="button"
              :disabled="isEditingFeedSaveDisabled"
              @click="saveEditingFeed"
            >
              <ion-spinner v-if="isEditingFeedSaving" slot="start" name="crescent" />
              <ion-icon v-else slot="start" :icon="saveOutline" />
              Сохранить изменения
            </ion-button>
          </div>
        </ion-toolbar>
      </ion-footer>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonModal,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter,
  toastController,
} from '@ionic/vue';
import { createOutline, saveOutline } from 'ionicons/icons';
import { computed, reactive, ref } from 'vue';
import type { FeedResponse, FeedType } from '@bulki-bull/shared';

import AccountMenuButton from '../components/AccountMenuButton.vue';
import ThemeToggleButton from '../components/ThemeToggleButton.vue';
import { api } from '../services/api';
import { syncFeedNotifications } from '../services/feedNotifications';
import {
  buildFeedAvailabilityPreview,
  getFeedAvailability,
  hasFeedPeriod,
  isFeedExpired,
  isFeedWarning,
} from '../utils/feedAvailability';
import {
  feedHints,
  feedLabels,
  formatDateRu,
  formatFeedPeriodRu,
  formatKg,
  formatNumber,
} from '../utils/formatters';

type FeedDraft = {
  currentStockKg: string;
  consumptionPerBullPerDayKg: string;
};

const FEEDS_UPDATED_EVENT = 'feeds-updated';
const feedTypes: FeedType[] = ['hay', 'compound_feed'];

const createEmptyDraft = (): FeedDraft => ({
  currentStockKg: '',
  consumptionPerBullPerDayKg: '',
});

const feeds = ref<FeedResponse[]>([]);
const loading = ref(true);
const error = ref('');
const editingType = ref<FeedType | null>(null);
const savingType = ref<FeedType | null>(null);
const drafts = reactive<Record<FeedType, FeedDraft>>({
  hay: createEmptyDraft(),
  compound_feed: createEmptyDraft(),
});
const formErrors = reactive<Record<FeedType, string>>({
  hay: '',
  compound_feed: '',
});

const syncDraft = (feed: FeedResponse): void => {
  drafts[feed.type].currentStockKg =
    feed.currentStockKg === null ? '' : String(feed.currentStockKg);
  drafts[feed.type].consumptionPerBullPerDayKg =
    feed.consumptionPerBullPerDayKg === null ? '' : String(feed.consumptionPerBullPerDayKg);
};

const syncDrafts = (items: FeedResponse[]): void => {
  for (const type of feedTypes) {
    const feed = items.find((item) => item.type === type);

    if (feed) {
      syncDraft(feed);
      continue;
    }

    Object.assign(drafts[type], createEmptyDraft());
  }
};

const loadFeeds = async (): Promise<void> => {
  loading.value = true;
  error.value = '';

  try {
    const response = await api.listFeeds();
    feeds.value = response;
    syncDrafts(response);
    void syncFeedNotifications(response);
  } catch (requestError) {
    error.value =
      requestError instanceof Error ? requestError.message : 'Не удалось загрузить корма';
  } finally {
    loading.value = false;
  }
};

const replaceFeed = (nextFeed: FeedResponse): void => {
  feeds.value = feeds.value.map((feed) => (feed.type === nextFeed.type ? nextFeed : feed));
};

const editingFeed = computed<FeedResponse | null>(
  () => feeds.value.find((feed) => feed.type === editingType.value) ?? null,
);

const isEditModalOpen = computed(() => editingFeed.value !== null);

const isEditingFeedSaving = computed(
  () => editingFeed.value !== null && savingType.value === editingFeed.value.type,
);

const editingFeedTitle = computed(() =>
  editingFeed.value ? `Изменить: ${feedLabels[editingFeed.value.type]}` : 'Изменить корм',
);

const resetFormError = (type: FeedType): void => {
  formErrors[type] = '';
};

const openEditModal = (feed: FeedResponse): void => {
  editingType.value = feed.type;
  resetFormError(feed.type);
  syncDraft(feed);
};

const closeEditModal = (): void => {
  if (isEditingFeedSaving.value) {
    return;
  }

  if (editingFeed.value) {
    resetFormError(editingFeed.value.type);
    syncDraft(editingFeed.value);
  }

  editingType.value = null;
};

const handleEditModalDismiss = (): void => {
  if (isEditingFeedSaving.value) {
    return;
  }

  editingType.value = null;
};

const normalizeDecimalInput = (value: string): string =>
  value.trim().replace(',', '.').replace(/\s+/g, '');

const parseDraftNumber = (value: string): number | null => {
  const trimmed = normalizeDecimalInput(value);

  if (!trimmed.length) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

const editingFeedPreview = computed(() => {
  if (!editingFeed.value) {
    return {
      currentStockKg: null,
      consumptionPerBullPerDayKg: null,
      dailyConsumptionKg: null,
      daysLeft: null,
      periodStartDate: null,
      depletionDate: null,
    };
  }

  const type = editingFeed.value.type;
  const currentStockKg = parseDraftNumber(drafts[type].currentStockKg);
  const consumptionPerBullPerDayKg = parseDraftNumber(drafts[type].consumptionPerBullPerDayKg);
  const availability = buildFeedAvailabilityPreview({
    bullsCount: editingFeed.value.bullsCount,
    currentStockKg,
    consumptionPerBullPerDayKg,
  });

  return {
    currentStockKg,
    consumptionPerBullPerDayKg,
    ...availability,
  };
});

const areNumbersEqual = (left: number | null, right: number | null): boolean =>
  left === right || (left !== null && right !== null && Math.abs(left - right) < 0.000001);

const isEditingFeedDirty = computed(() => {
  if (!editingFeed.value) {
    return false;
  }

  return (
    !areNumbersEqual(editingFeedPreview.value.currentStockKg, editingFeed.value.currentStockKg) ||
    !areNumbersEqual(
      editingFeedPreview.value.consumptionPerBullPerDayKg,
      editingFeed.value.consumptionPerBullPerDayKg,
    )
  );
});

const isEditingFeedDraftValid = computed(
  () =>
    editingFeedPreview.value.currentStockKg !== null &&
    editingFeedPreview.value.consumptionPerBullPerDayKg !== null,
);

const isEditingFeedSaveDisabled = computed(
  () =>
    !editingFeed.value ||
    isEditingFeedSaving.value ||
    !isEditingFeedDraftValid.value ||
    !isEditingFeedDirty.value,
);

const editingFeedModalHint = computed(() => {
  if (!editingFeed.value) {
    return '';
  }

  if (!isEditingFeedDirty.value) {
    return 'Измените одно из полей, чтобы сохранить новые значения.';
  }

  if (!isEditingFeedDraftValid.value) {
    return 'Заполните оба поля, чтобы пересчитать расход и дату окончания запаса.';
  }

  if (editingFeed.value.bullsCount === 0) {
    return 'Сейчас в учете нет бычков, поэтому предпросмотр периода запаса будет недоступен.';
  }

  if (editingFeedPreview.value.consumptionPerBullPerDayKg === 0) {
    return 'При нулевом расходе расход в день и дата окончания запаса не рассчитываются.';
  }

  return 'Предпросмотр справа обновляется по мере ввода, чтобы можно было сразу увидеть новый период запаса.';
});

const presentSavedToast = async (type: FeedType): Promise<void> => {
  const toast = await toastController.create({
    message: `${feedLabels[type]} сохранено`,
    duration: 1600,
    position: 'bottom',
    color: 'success',
  });

  await toast.present();
};

const saveEditingFeed = async (): Promise<void> => {
  if (!editingFeed.value) {
    return;
  }

  const type = editingFeed.value.type;
  const draft = drafts[type];
  const currentStockKg = parseDraftNumber(draft.currentStockKg);
  const consumptionPerBullPerDayKg = parseDraftNumber(draft.consumptionPerBullPerDayKg);

  if (currentStockKg === null || consumptionPerBullPerDayKg === null) {
    formErrors[type] = 'Заполните остаток и расход на голову.';
    return;
  }

  savingType.value = type;
  formErrors[type] = '';

  try {
    const updatedFeed = await api.updateFeed(type, {
      currentStockKg,
      consumptionPerBullPerDayKg,
    });

    replaceFeed(updatedFeed);
    syncDraft(updatedFeed);
    editingType.value = null;
    window.dispatchEvent(new CustomEvent(FEEDS_UPDATED_EVENT));
    void syncFeedNotifications(feeds.value);
    await presentSavedToast(type);
  } catch (requestError) {
    formErrors[type] =
      requestError instanceof Error ? requestError.message : 'Не удалось сохранить корм';
  } finally {
    savingType.value = null;
  }
};

type FeedPeriodSource = {
  periodStartDate: string | null;
  depletionDate: string | null;
};

const hasEnoughData = (feed: FeedResponse): boolean => hasFeedPeriod(getFeedAvailability(feed));

const isAvailabilityWarning = (daysLeft: number | null): boolean => isFeedWarning(daysLeft);

const formatPeriod = (source: FeedPeriodSource): string => {
  if (!source.periodStartDate || !source.depletionDate) {
    return 'Недостаточно данных';
  }

  return formatFeedPeriodRu(source.periodStartDate, source.depletionDate);
};

const formatStock = (value: number | null): string =>
  value === null ? '—' : `${formatKg(value)} кг`;

const formatPerBull = (value: number | null): string =>
  value === null ? '—' : `${formatNumber(value, 2)} кг`;

const formatDailyConsumption = (value: number | null): string =>
  value === null ? 'Недостаточно данных' : `${formatNumber(value, 2)} кг`;

const formatFeedPeriod = (feed: FeedResponse): string => formatPeriod(getFeedAvailability(feed));

const formatPreviewPeriod = (preview: FeedPeriodSource): string => formatPeriod(preview);

const getSummaryBannerClass = (feed: FeedResponse): Record<string, boolean> => {
  const availability = getFeedAvailability(feed);

  return {
    'summary-banner--empty': !hasFeedPeriod(availability),
    'summary-banner--warning':
      hasFeedPeriod(availability) && isAvailabilityWarning(availability.daysLeft),
  };
};

const getFeedPeriodCaption = (feed: FeedResponse): string => {
  const availability = getFeedAvailability(feed);

  if (!hasFeedPeriod(availability)) {
    return 'Период пока недоступен';
  }

  if (isFeedExpired(availability.daysLeft)) {
    return `Запас закончился ${formatDateRu(availability.depletionDate)}`;
  }

  if (isAvailabilityWarning(availability.daysLeft)) {
    return `До окончания меньше 10 дней: ${formatDateRu(availability.depletionDate)}`;
  }

  return `До ${formatDateRu(availability.depletionDate)}`;
};

const getFeedNote = (feed: FeedResponse): string => {
  if (feed.bullsCount === 0) {
    return 'Нет бычков в учете: расход и период запаса появятся после добавления животных.';
  }

  if (feed.currentStockKg === null || feed.consumptionPerBullPerDayKg === null) {
    return 'Заполните остаток и расход на голову, чтобы увидеть период запаса.';
  }

  if (feed.consumptionPerBullPerDayKg <= 0) {
    return 'Укажите расход на голову больше 0, чтобы посчитать дату окончания запаса.';
  }

  return 'Недостаточно данных для расчета периода. Проверьте остаток и расход на голову.';
};

onIonViewWillEnter(() => {
  void loadFeeds();
});
</script>

<style scoped>
.screen {
  min-height: 100%;
  padding: 16px 16px calc(16px + var(--app-bottom-nav-space, 0px));
  background: var(--app-feeds-background);
}

.state {
  display: grid;
  min-height: 50vh;
  place-items: center;
  align-content: center;
  gap: 14px;
  color: var(--app-text-muted);
  text-align: center;
}

.intro-card,
.feed-card {
  border: 1px solid var(--app-border-color);
  border-radius: 18px;
  background: var(--app-surface-raised);
  box-shadow: var(--app-shadow-card);
  backdrop-filter: blur(6px);
}

.intro-card {
  padding: 16px;
  margin-bottom: 14px;
}

.intro-card__title {
  margin: 0 0 6px;
  color: var(--app-text-strong);
  font-size: 15px;
  font-weight: 800;
}

.intro-card__text {
  margin: 0;
  color: var(--app-text-muted);
  line-height: 1.45;
}

.feed-grid {
  display: grid;
  gap: 14px;
}

.feed-card {
  padding: 16px;
}

.feed-card--hay {
  background: var(--app-feed-card-hay-background);
}

.feed-card--compound_feed {
  background: var(--app-feed-card-compound-background);
}

.feed-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.feed-card__title-wrap {
  min-width: 0;
}

.feed-card__eyebrow {
  display: block;
  margin-bottom: 4px;
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.feed-card__header h2 {
  margin: 0;
  color: var(--app-text-strong);
  font-size: 24px;
  line-height: 1.1;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 0 0 12px;
}

.metric {
  padding: 12px;
  border: 1px solid var(--app-border-subtle);
  border-radius: 14px;
  background: var(--app-metric-surface);
}

.metric dt {
  margin: 0 0 6px;
  color: var(--app-text-muted);
  font-size: 12px;
}

.metric dd {
  margin: 0;
  color: var(--app-text-strong);
  font-size: 16px;
  font-weight: 800;
}

.summary-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border-radius: 16px;
  background: var(--app-summary-banner-background);
  color: #ffffff;
}

.summary-banner__copy {
  display: grid;
  gap: 4px;
}

.summary-banner span {
  font-size: 14px;
}

.summary-banner__copy small {
  font-size: 12px;
  line-height: 1.35;
  opacity: 0.88;
}

.summary-banner strong {
  font-size: 22px;
  line-height: 1.25;
  text-align: right;
  white-space: normal;
}

.summary-banner--empty {
  background: var(--app-summary-banner-muted-background);
}

.summary-banner--warning {
  border: 1px solid var(--app-danger-soft-border);
  background: var(--app-danger-soft-background);
  color: var(--app-danger-soft-text);
}

.summary-banner--warning strong,
.summary-banner--warning .summary-banner__copy small {
  color: var(--app-danger-soft-text);
  opacity: 1;
}

.feed-card__note {
  margin: 10px 0 0;
  color: var(--app-text-muted);
  font-size: 13px;
  line-height: 1.45;
}

.modal-form {
  display: grid;
  gap: 14px;
  padding: 16px;
}

.modal-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.modal-summary__item {
  padding: 12px;
  border: 1px solid var(--app-border-subtle);
  border-radius: 14px;
  background: var(--app-surface-subtle);
}

.modal-summary__item--accent {
  border-color: var(--app-accent-soft-border);
  background: var(--app-accent-soft-background);
}

.modal-summary__item--warning {
  border-color: var(--app-danger-soft-border);
  background: var(--app-danger-soft-background);
}

.modal-summary__item span {
  display: block;
  margin-bottom: 6px;
  color: var(--app-text-muted);
  font-size: 12px;
}

.modal-summary__item strong {
  color: var(--app-text-strong);
  font-size: 17px;
}

.modal-summary__item small {
  display: block;
  margin-top: 6px;
  color: var(--app-text-muted);
  font-size: 12px;
}

.modal-summary__value--warning {
  color: var(--app-danger-soft-text);
}

.modal-copy {
  margin: 0;
  color: var(--app-text-muted);
  line-height: 1.45;
}

.modal-state {
  margin: -4px 0 0;
  color: var(--app-accent-soft-text);
  font-size: 13px;
  line-height: 1.45;
}

.modal-state--muted {
  color: var(--app-text-muted);
}

.modal-fields {
  display: grid;
  gap: 10px;
}

.modal-section {
  margin-top: 4px;
}

.modal-section__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.modal-section__eyebrow {
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.modal-section__head strong {
  color: var(--app-text-strong);
  font-size: 15px;
}

.modal-section__text {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 13px;
  line-height: 1.4;
}

ion-item {
  --background: var(--app-surface-raised);
  --border-radius: 12px;
  --padding-start: 12px;
  --inner-padding-end: 12px;
  --min-height: 64px;
  border: 1px solid var(--app-border-color);
  border-radius: 12px;
}

.edit-form__hint {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 12px;
  line-height: 1.4;
}

.modal-footer ion-toolbar {
  --background: var(--app-modal-footer-background);
  --border-color: var(--app-border-subtle);
  padding: 8px 12px 18px;
}

.modal-actions {
  display: grid;
  gap: 8px;
}

.error-block {
  padding: 12px;
  border: 1px solid var(--app-danger-soft-border);
  border-radius: 12px;
  background: var(--app-danger-soft-background);
  color: var(--app-danger-soft-text);
  white-space: pre-line;
}

.error-block p {
  margin: 0;
}

@media (min-width: 640px) {
  .metric-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .modal-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
