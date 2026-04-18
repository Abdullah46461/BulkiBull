<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-title>Бычки</ion-title>
        <ion-buttons slot="end">
          <ion-button router-link="/feeds" aria-label="Открыть корма">
            <ion-icon slot="icon-only" :icon="leafOutline" />
          </ion-button>
          <ion-button
            :aria-label="isSearchOpen ? 'Закрыть поиск' : 'Открыть поиск'"
            @click="toggleSearch"
          >
            <ion-icon slot="icon-only" :icon="isSearchOpen ? closeOutline : searchOutline" />
          </ion-button>
          <ion-button router-link="/bulls/new" aria-label="Добавить бычка">
            <ion-icon slot="icon-only" :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar class="summary-toolbar">
        <div class="feed-summary" aria-label="Остаток кормов по дням">
          <div
            v-for="item in feedSummaryItems"
            :key="item.type"
            class="feed-summary__pill"
            :class="{ 'feed-summary__pill--muted': item.isMuted }"
          >
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
      </ion-toolbar>
      <ion-toolbar v-if="isSearchOpen" class="search-toolbar">
        <div class="search-panel">
          <ion-icon :icon="searchOutline" class="search-panel__icon" />
          <input
            ref="searchInput"
            :value="search"
            class="search-panel__input"
            type="search"
            inputmode="search"
            placeholder="Поиск по бирке"
            @input="onSearchInput"
            @keydown.escape="closeSearch"
          />
          <button
            v-if="search"
            type="button"
            class="search-panel__clear"
            aria-label="Очистить поиск"
            @click="clearSearch"
          >
            <ion-icon :icon="closeCircleOutline" />
          </button>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen>
      <main class="screen">
        <section v-if="loading" class="state">
          <ion-spinner name="crescent" />
          <p>Загружаем список</p>
        </section>

        <section v-else-if="error" class="state">
          <p>{{ error }}</p>
          <ion-button fill="outline" @click="loadBulls">Повторить</ion-button>
        </section>

        <section v-else-if="bulls.length === 0" class="state">
          <p>{{ search ? 'По этой бирке ничего не найдено' : 'Список бычков пуст' }}</p>
          <ion-button router-link="/bulls/new">
            <ion-icon slot="start" :icon="addOutline" />
            Добавить
          </ion-button>
        </section>

        <ion-list v-else lines="none" class="bull-list">
          <ion-item
            v-for="bull in bulls"
            :key="bull.id"
            button
            detail
            :router-link="`/bulls/${bull.id}`"
            class="bull-item"
          >
            <img
              v-if="shouldShowPhoto(bull.id, bull.photoUrl)"
              slot="start"
              class="photo-thumb"
              :src="getPhotoSrc(bull.photoUrl)"
              :alt="`Фото ${bull.tagNumber}`"
              @error="markPhotoBroken(bull.id)"
            />
            <div v-else slot="start" class="tag-badge">{{ bull.tagNumber }}</div>
            <ion-label>
              <h2>{{ bull.name || `Бирка ${bull.tagNumber}` }}</h2>
              <p>{{ bull.ageLabel }} · {{ sexLabels[bull.sex] }}</p>
              <p v-if="bull.breed">{{ bull.breed }}</p>
            </ion-label>
            <div slot="end" class="weight">
              <strong>{{ formatKg(bull.currentWeight) }}</strong>
              <span>кг</span>
            </div>
          </ion-item>
        </ion-list>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter,
} from '@ionic/vue';
import {
  addOutline,
  closeCircleOutline,
  closeOutline,
  leafOutline,
  searchOutline,
} from 'ionicons/icons';
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import type { BullResponse, FeedResponse, FeedType } from '@bulki-bull/shared';

import { api } from '../services/api';
import { feedLabels, formatKg, formatNumber, sexLabels } from '../utils/formatters';
import { normalizePhotoUrl } from '../utils/photo';

const FEEDS_UPDATED_EVENT = 'feeds-updated';

const bulls = ref<BullResponse[]>([]);
const feedSummary = ref<FeedResponse[]>([]);
const brokenPhotoIds = ref<Set<string>>(new Set());
const loading = ref(true);
const error = ref('');
const search = ref('');
const isSearchOpen = ref(false);
const searchInput = ref<HTMLInputElement | null>(null);
let searchDebounceId: number | undefined;

const formatHeaderDaysLeft = (value: number | null): string =>
  value === null ? '—' : `${formatNumber(value, 1)} дн.`;

const feedSummaryItems = computed<
  Array<{
    type: FeedType;
    label: string;
    value: string;
    isMuted: boolean;
  }>
>(() => {
  const summaryMap = new Map(feedSummary.value.map((item) => [item.type, item]));

  return (['hay', 'compound_feed'] as FeedType[]).map((type) => {
    const item = summaryMap.get(type) ?? null;
    const value = formatHeaderDaysLeft(item?.daysLeft ?? null);

    return {
      type,
      label: feedLabels[type],
      value,
      isMuted: item?.daysLeft === null,
    };
  });
});

const loadBulls = async (): Promise<void> => {
  loading.value = true;
  error.value = '';

  try {
    bulls.value = await api.listBulls(search.value);
  } catch (requestError) {
    error.value =
      requestError instanceof Error ? requestError.message : 'Не удалось загрузить список';
  } finally {
    loading.value = false;
  }
};

const loadFeedSummary = async (): Promise<void> => {
  try {
    feedSummary.value = await api.listFeeds();
  } catch {
    feedSummary.value = [];
  }
};

const scheduleSearch = (): void => {
  if (searchDebounceId) {
    window.clearTimeout(searchDebounceId);
  }

  searchDebounceId = window.setTimeout(() => {
    void loadBulls();
  }, 350);
};

const focusSearch = async (): Promise<void> => {
  await nextTick();
  searchInput.value?.focus();
};

const openSearch = (): void => {
  if (isSearchOpen.value) {
    return;
  }

  isSearchOpen.value = true;
  void focusSearch();
};

const clearSearch = (): void => {
  search.value = '';
  scheduleSearch();
  void focusSearch();
};

const closeSearch = (): void => {
  if (searchDebounceId) {
    window.clearTimeout(searchDebounceId);
  }

  search.value = '';
  isSearchOpen.value = false;
  void loadBulls();
};

const toggleSearch = (): void => {
  if (isSearchOpen.value) {
    closeSearch();
    return;
  }

  openSearch();
};

const onSearchInput = (event: Event): void => {
  search.value = (event.target as HTMLInputElement).value;
  scheduleSearch();
};

const shouldShowPhoto = (bullId: string, photoUrl: string | null): boolean =>
  Boolean(photoUrl) && !brokenPhotoIds.value.has(bullId);

const getPhotoSrc = (photoUrl: string | null): string => normalizePhotoUrl(photoUrl) ?? '';

const markPhotoBroken = (bullId: string): void => {
  brokenPhotoIds.value = new Set([...brokenPhotoIds.value, bullId]);
};

const handleFeedsUpdated = (): void => {
  void loadFeedSummary();
};

onIonViewWillEnter(() => {
  void loadBulls();
  void loadFeedSummary();
});

onMounted(() => {
  window.addEventListener(FEEDS_UPDATED_EVENT, handleFeedsUpdated);
});

onBeforeUnmount(() => {
  if (searchDebounceId) {
    window.clearTimeout(searchDebounceId);
  }

  window.removeEventListener(FEEDS_UPDATED_EVENT, handleFeedsUpdated);
});
</script>

<style scoped>
.screen {
  min-height: 100%;
  padding: 16px;
  background: #f4f6f2;
}

.bull-list {
  display: grid;
  gap: 10px;
  background: transparent;
}

.bull-item {
  --background: #ffffff;
  --border-radius: 8px;
  --inner-padding-end: 12px;
  --padding-start: 12px;
  border: 1px solid #dfe8df;
  border-radius: 8px;
}

.summary-toolbar {
  --background: transparent;
  --border-style: none;
  padding: 0 16px 10px;
}

.feed-summary {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.feed-summary__pill {
  display: grid;
  flex: 1 0 0;
  min-width: 120px;
  gap: 2px;
  padding: 10px 12px;
  border: 1px solid #dfe8df;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 8px 18px rgba(40, 69, 52, 0.05);
}

.feed-summary__pill span {
  color: #607067;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.feed-summary__pill strong {
  color: #1f2d24;
  font-size: 15px;
  line-height: 1.2;
}

.feed-summary__pill--muted strong {
  color: #708076;
}

.search-toolbar {
  --background: transparent;
  --border-style: none;
  padding: 0 16px 12px;
}

.search-panel {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid #dfe8df;
  border-radius: 14px;
  background: #ffffff;
}

.search-panel__icon,
.search-panel__clear {
  color: #607067;
  font-size: 20px;
}

.search-panel__input {
  flex: 1;
  min-width: 0;
  height: 44px;
  border: 0;
  outline: none;
  background: transparent;
  color: #1f2d24;
  font: inherit;
}

.search-panel__input::placeholder {
  color: #8c9a92;
}

.search-panel__clear {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  background: transparent;
}

.tag-badge {
  display: grid;
  width: 58px;
  height: 52px;
  place-items: center;
  padding: 6px 8px;
  border-radius: 8px;
  background: #e4efe7;
  color: #1f5c3f;
  font-weight: 800;
}

.photo-thumb {
  width: 58px;
  height: 52px;
  border-radius: 8px;
  object-fit: cover;
}

h2 {
  margin: 0 0 4px;
  color: #1f2d24;
  font-size: 17px;
  font-weight: 800;
}

p {
  margin: 0;
  color: #607067;
  font-size: 14px;
}

.weight {
  display: grid;
  min-width: 64px;
  justify-items: end;
  color: #1f2d24;
}

.weight strong {
  font-size: 18px;
}

.weight span {
  color: #607067;
  font-size: 12px;
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
</style>
