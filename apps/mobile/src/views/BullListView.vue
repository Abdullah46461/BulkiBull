<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-title>Бычки</ion-title>
        <ion-buttons slot="end">
          <ion-button router-link="/bulls/new" aria-label="Добавить бычка">
            <ion-icon slot="icon-only" :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          :value="search"
          :debounce="350"
          placeholder="Поиск по бирке"
          @ion-input="onSearchInput"
        />
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
  IonSearchbar,
  IonSpinner,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter,
} from '@ionic/vue';
import { addOutline } from 'ionicons/icons';
import { ref } from 'vue';
import type { BullResponse } from '@bulki-bull/shared';

import { api } from '../services/api';
import { formatKg, sexLabels } from '../utils/formatters';
import { normalizePhotoUrl } from '../utils/photo';

const bulls = ref<BullResponse[]>([]);
const brokenPhotoIds = ref<Set<string>>(new Set());
const loading = ref(true);
const error = ref('');
const search = ref('');

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

const onSearchInput = (event: CustomEvent<{ value?: string | null }>): void => {
  search.value = event.detail.value ?? '';
  void loadBulls();
};

const shouldShowPhoto = (bullId: string, photoUrl: string | null): boolean =>
  Boolean(photoUrl) && !brokenPhotoIds.value.has(bullId);

const getPhotoSrc = (photoUrl: string | null): string => normalizePhotoUrl(photoUrl) ?? '';

const markPhotoBroken = (bullId: string): void => {
  brokenPhotoIds.value = new Set([...brokenPhotoIds.value, bullId]);
};

onIonViewWillEnter(() => {
  void loadBulls();
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
