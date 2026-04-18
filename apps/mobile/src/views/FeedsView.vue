<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/bulls" />
        </ion-buttons>
        <ion-title>Корма</ion-title>
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
          <section class="intro-card">
            <p class="intro-card__title">Учет кормов</p>
            <p class="intro-card__text">
              Расчеты пока идут по всем бычкам в учете. Когда в модели появятся статусы,
              переключим формулу на активных.
            </p>
          </section>

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

              <section class="summary-banner" :class="{ 'summary-banner--empty': !hasEnoughData(feed) }">
                <span>Хватит на</span>
                <strong>{{ formatDaysLeft(feed.daysLeft) }}</strong>
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
        <form
          v-if="editingFeed"
          class="modal-form"
          @submit.prevent="saveEditingFeed"
        >
          <section class="modal-summary">
            <div class="modal-summary__item">
              <span>Сейчас</span>
              <strong>{{ formatDaysLeft(editingFeed.daysLeft) }}</strong>
              <small>{{ formatDailyConsumption(editingFeed.dailyConsumptionKg) }} в день</small>
            </div>
            <div class="modal-summary__item modal-summary__item--accent">
              <span>После сохранения</span>
              <strong>{{ formatDaysLeft(editingFeedPreview.daysLeft) }}</strong>
              <small>{{ formatDailyConsumption(editingFeedPreview.dailyConsumptionKg) }} в день</small>
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
              <p class="modal-section__text">Сколько килограммов этого корма есть сейчас в наличии.</p>
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
  IonBackButton,
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

import { api } from '../services/api';
import { feedHints, feedLabels, formatKg, formatNumber } from '../utils/formatters';

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
  drafts[feed.type].currentStockKg = feed.currentStockKg === null ? '' : String(feed.currentStockKg);
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

const roundTo = (value: number, digits: number): number => Number(value.toFixed(digits));

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
    };
  }

  const type = editingFeed.value.type;
  const currentStockKg = parseDraftNumber(drafts[type].currentStockKg);
  const consumptionPerBullPerDayKg = parseDraftNumber(drafts[type].consumptionPerBullPerDayKg);
  const dailyConsumptionKg =
    editingFeed.value.bullsCount > 0 &&
    consumptionPerBullPerDayKg !== null &&
    consumptionPerBullPerDayKg > 0
      ? roundTo(editingFeed.value.bullsCount * consumptionPerBullPerDayKg, 2)
      : null;
  const daysLeft =
    currentStockKg === null || dailyConsumptionKg === null
      ? null
      : roundTo(currentStockKg / dailyConsumptionKg, 2);

  return {
    currentStockKg,
    consumptionPerBullPerDayKg,
    dailyConsumptionKg,
    daysLeft,
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
  () => !editingFeed.value || isEditingFeedSaving.value || !isEditingFeedDraftValid.value || !isEditingFeedDirty.value,
);

const editingFeedModalHint = computed(() => {
  if (!editingFeed.value) {
    return '';
  }

  if (!isEditingFeedDirty.value) {
    return 'Измените одно из полей, чтобы сохранить новые значения.';
  }

  if (!isEditingFeedDraftValid.value) {
    return 'Заполните оба поля, чтобы пересчитать расход и дни остатка.';
  }

  if (editingFeed.value.bullsCount === 0) {
    return 'Сейчас в учете нет бычков, поэтому предпросмотр дней остатка будет недоступен.';
  }

  if (editingFeedPreview.value.consumptionPerBullPerDayKg === 0) {
    return 'При нулевом расходе расход в день и дни остатка не рассчитываются.';
  }

  return 'Предпросмотр справа обновляется по мере ввода, так что можно быстро проверить сценарий до сохранения.';
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
    await presentSavedToast(type);
  } catch (requestError) {
    formErrors[type] =
      requestError instanceof Error ? requestError.message : 'Не удалось сохранить корм';
  } finally {
    savingType.value = null;
  }
};

const hasEnoughData = (feed: FeedResponse): boolean =>
  feed.dailyConsumptionKg !== null && feed.daysLeft !== null;

const formatStock = (value: number | null): string => (value === null ? '—' : `${formatKg(value)} кг`);

const formatPerBull = (value: number | null): string =>
  value === null ? '—' : `${formatNumber(value, 2)} кг`;

const formatDailyConsumption = (value: number | null): string =>
  value === null ? 'Недостаточно данных' : `${formatNumber(value, 2)} кг`;

const formatDaysLeft = (value: number | null): string =>
  value === null ? 'Недостаточно данных' : `${formatNumber(value, 1)} дн.`;

const getFeedNote = (feed: FeedResponse): string => {
  if (feed.bullsCount === 0) {
    return 'Нет бычков в учете: расход и дни остатка появятся после добавления животных.';
  }

  if (feed.currentStockKg === null || feed.consumptionPerBullPerDayKg === null) {
    return 'Заполните остаток и расход на голову, чтобы увидеть расчет.';
  }

  if (feed.consumptionPerBullPerDayKg <= 0) {
    return 'Укажите расход на голову больше 0, чтобы посчитать дни остатка.';
  }

  return 'Недостаточно данных для расчета. Проверьте остаток и расход на голову.';
};

onIonViewWillEnter(() => {
  void loadFeeds();
});
</script>

<style scoped>
.screen {
  min-height: 100%;
  padding: 16px;
  background:
    radial-gradient(circle at top left, rgba(123, 160, 109, 0.12), transparent 35%),
    linear-gradient(180deg, #f6f8f3 0%, #eef3ed 100%);
}

.state {
  display: grid;
  min-height: 50vh;
  place-items: center;
  align-content: center;
  gap: 14px;
  color: #607067;
  text-align: center;
}

.intro-card,
.feed-card {
  border: 1px solid #dfe8df;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 34px rgba(40, 69, 52, 0.08);
  backdrop-filter: blur(6px);
}

.intro-card {
  padding: 16px;
  margin-bottom: 14px;
}

.intro-card__title {
  margin: 0 0 6px;
  color: #1f2d24;
  font-size: 15px;
  font-weight: 800;
}

.intro-card__text {
  margin: 0;
  color: #607067;
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
  background:
    linear-gradient(180deg, rgba(243, 236, 209, 0.55), rgba(255, 255, 255, 0.95)),
    rgba(255, 255, 255, 0.92);
}

.feed-card--compound_feed {
  background:
    linear-gradient(180deg, rgba(222, 233, 221, 0.7), rgba(255, 255, 255, 0.95)),
    rgba(255, 255, 255, 0.92);
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
  color: #607067;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.feed-card__header h2 {
  margin: 0;
  color: #1f2d24;
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
  border: 1px solid rgba(95, 112, 103, 0.12);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.72);
}

.metric dt {
  margin: 0 0 6px;
  color: #607067;
  font-size: 12px;
}

.metric dd {
  margin: 0;
  color: #1f2d24;
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
  background: #2f6f4e;
  color: #ffffff;
}

.summary-banner span {
  font-size: 14px;
}

.summary-banner strong {
  font-size: 22px;
  line-height: 1.1;
  text-align: right;
}

.summary-banner--empty {
  background: #708076;
}

.feed-card__note {
  margin: 10px 0 0;
  color: #607067;
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
  border: 1px solid rgba(95, 112, 103, 0.12);
  border-radius: 14px;
  background: rgba(244, 247, 243, 0.88);
}

.modal-summary__item--accent {
  border-color: rgba(47, 111, 78, 0.24);
  background: rgba(227, 239, 232, 0.92);
}

.modal-summary__item span {
  display: block;
  margin-bottom: 6px;
  color: #607067;
  font-size: 12px;
}

.modal-summary__item strong {
  color: #1f2d24;
  font-size: 17px;
}

.modal-summary__item small {
  display: block;
  margin-top: 6px;
  color: #607067;
  font-size: 12px;
}

.modal-copy {
  margin: 0;
  color: #607067;
  line-height: 1.45;
}

.modal-state {
  margin: -4px 0 0;
  color: #1f5c3f;
  font-size: 13px;
  line-height: 1.45;
}

.modal-state--muted {
  color: #607067;
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
  color: #607067;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.modal-section__head strong {
  color: #1f2d24;
  font-size: 15px;
}

.modal-section__text {
  margin: 0;
  color: #607067;
  font-size: 13px;
  line-height: 1.4;
}

ion-item {
  --background: rgba(255, 255, 255, 0.92);
  --border-radius: 12px;
  --padding-start: 12px;
  --inner-padding-end: 12px;
  --min-height: 64px;
  border: 1px solid #dfe8df;
  border-radius: 12px;
}

.edit-form__hint {
  margin: 0;
  color: #607067;
  font-size: 12px;
  line-height: 1.4;
}

.modal-footer ion-toolbar {
  --background: rgba(255, 255, 255, 0.98);
  --border-color: rgba(95, 112, 103, 0.12);
  padding: 8px 12px 18px;
}

.modal-actions {
  display: grid;
  gap: 8px;
}

.error-block {
  padding: 12px;
  border: 1px solid #e7b3a9;
  border-radius: 12px;
  background: #fff2ee;
  color: #8a321f;
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
