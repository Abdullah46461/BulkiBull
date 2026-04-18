<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/bulls" />
        </ion-buttons>
        <ion-title>{{ bull?.tagNumber ?? 'Карточка' }}</ion-title>
        <ion-buttons v-if="bull" slot="end">
          <ion-button :router-link="`/bulls/${bull.id}/edit`" aria-label="Редактировать">
            <ion-icon slot="icon-only" :icon="createOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen>
      <main class="screen">
        <section v-if="loading" class="state">
          <ion-spinner name="crescent" />
          <p>Загружаем карточку</p>
        </section>

        <section v-else-if="error" class="state">
          <p>{{ error }}</p>
          <ion-button fill="outline" @click="loadBull">Повторить</ion-button>
        </section>

        <template v-else-if="bull">
          <section v-if="actionError" class="error-block">
            <p>{{ actionError }}</p>
          </section>

          <section class="hero">
            <button
              v-if="shouldShowPhoto"
              type="button"
              class="hero-photo-button"
              :aria-label="`Открыть фото ${bull.tagNumber}`"
              @click="openPhotoViewer"
            >
              <img
                class="hero-photo"
                :src="photoSrc"
                :alt="`Фото ${bull.tagNumber}`"
                @error="photoBroken = true"
              />
            </button>
            <div v-else class="avatar">{{ bull.tagNumber }}</div>
            <div>
              <p class="eyebrow">{{ sexLabels[bull.sex] }}</p>
              <h1>{{ bull.name || `Бирка ${bull.tagNumber}` }}</h1>
              <p v-if="bull.breed" class="muted">{{ bull.breed }}</p>
            </div>
          </section>

          <section class="stats-grid" aria-label="Основные показатели">
            <div class="stat">
              <span>Возраст</span>
              <strong>{{ bull.ageLabel }}</strong>
            </div>
            <div class="stat">
              <span>Текущий вес</span>
              <strong>{{ formatKg(bull.currentWeight) }} кг</strong>
            </div>
            <div class="stat">
              <span>Стартовый вес</span>
              <strong>{{ formatKg(bull.initialWeight) }} кг</strong>
            </div>
            <div class="stat">
              <span>Поступил</span>
              <strong>{{ formatDateRu(bull.arrivalDate) }}</strong>
            </div>
          </section>

          <section class="info-block">
            <h2>Характеристики</h2>
            <dl>
              <div>
                <dt>Дата рождения</dt>
                <dd>{{ formatDateRu(bull.birthDate) }}</dd>
              </div>
              <div>
                <dt>Бирка</dt>
                <dd>{{ bull.tagNumber }}</dd>
              </div>
              <div>
                <dt>Заметки</dt>
                <dd>{{ bull.notes || 'Нет заметок' }}</dd>
              </div>
            </dl>
          </section>

          <section class="section-title">
            <h2>История веса</h2>
            <ion-button size="small" :router-link="`/bulls/${bull.id}/weights/new`">
              <ion-icon slot="start" :icon="scaleOutline" />
              Вес
            </ion-button>
          </section>

          <section v-if="bull.weightRecords.length === 0" class="empty-history">
            <p>Записей веса пока нет</p>
          </section>

          <ion-list v-else lines="none" class="weight-list">
            <ion-item v-for="record in bull.weightRecords" :key="record.id" class="weight-item">
              <ion-label>
                <h3>{{ formatDateRu(record.date) }}</h3>
                <p v-if="record.comment">{{ record.comment }}</p>
              </ion-label>
              <div slot="end" class="weight-value">
                <strong>{{ formatKg(record.weight) }}</strong>
                <span>кг</span>
              </div>
            </ion-item>
          </ion-list>

          <div class="danger-zone__actions">
            <ion-button
              class="danger-zone__button"
              fill="solid"
              shape="round"
              :disabled="deleting"
              @click="confirmDelete"
            >
              <ion-spinner v-if="deleting" slot="start" name="crescent" />
              <ion-icon v-else slot="start" :icon="trashOutline" />
              {{ deleting ? 'Удаляем' : 'Удалить карточку' }}
            </ion-button>
          </div>
        </template>
      </main>
    </ion-content>

    <div
      v-if="isPhotoViewerOpen && shouldShowPhoto"
      class="photo-viewer"
      role="dialog"
      aria-modal="true"
      :aria-label="`Увеличенное фото ${bull?.tagNumber ?? ''}`"
      @click="closePhotoViewer"
    >
      <button
        type="button"
        class="photo-viewer__close"
        aria-label="Закрыть фото"
        @click.stop="closePhotoViewer"
      >
        <ion-icon :icon="closeOutline" />
      </button>

      <div class="photo-viewer__body">
        <img
          class="photo-viewer__image"
          :src="photoSrc"
          :alt="`Фото ${bull?.tagNumber ?? ''}`"
          @click.stop
        />
      </div>
    </div>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBackButton,
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
  alertController,
  onIonViewWillEnter,
} from '@ionic/vue';
import { closeOutline, createOutline, scaleOutline, trashOutline } from 'ionicons/icons';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { BullDetailResponse } from '@bulki-bull/shared';

import { api } from '../services/api';
import { formatDateRu, formatKg, sexLabels } from '../utils/formatters';
import { normalizePhotoUrl } from '../utils/photo';

const props = defineProps<{
  id: string;
}>();

const router = useRouter();
const bull = ref<BullDetailResponse | null>(null);
const loading = ref(true);
const error = ref('');
const actionError = ref('');
const deleting = ref(false);
const photoBroken = ref(false);
const isPhotoViewerOpen = ref(false);

const shouldShowPhoto = computed(() => Boolean(bull.value?.photoUrl) && !photoBroken.value);
const photoSrc = computed(() => normalizePhotoUrl(bull.value?.photoUrl) ?? '');

const openPhotoViewer = (): void => {
  if (!shouldShowPhoto.value) {
    return;
  }

  isPhotoViewerOpen.value = true;
};

const closePhotoViewer = (): void => {
  isPhotoViewerOpen.value = false;
};

const loadBull = async (): Promise<void> => {
  loading.value = true;
  error.value = '';
  actionError.value = '';
  closePhotoViewer();

  try {
    photoBroken.value = false;
    bull.value = await api.getBull(props.id);
  } catch (requestError) {
    error.value =
      requestError instanceof Error ? requestError.message : 'Не удалось загрузить карточку';
  } finally {
    loading.value = false;
  }
};

const deleteBull = async (): Promise<void> => {
  if (!bull.value || deleting.value) {
    return;
  }

  deleting.value = true;
  actionError.value = '';

  try {
    await api.deleteBull(bull.value.id);
    await router.replace('/bulls');
  } catch (requestError) {
    actionError.value =
      requestError instanceof Error ? requestError.message : 'Не удалось удалить бычка';
  } finally {
    deleting.value = false;
  }
};

const confirmDelete = async (): Promise<void> => {
  if (!bull.value || deleting.value) {
    return;
  }

  const alert = await alertController.create({
    header: 'Удалить бычка?',
    message: `Карточка ${bull.value.name || `с биркой ${bull.value.tagNumber}`} и вся история веса будут удалены без возможности восстановления.`,
    buttons: [
      {
        text: 'Отмена',
        role: 'cancel',
      },
      {
        text: 'Удалить',
        role: 'destructive',
        handler: () => {
          void deleteBull();
        },
      },
    ],
  });

  await alert.present();
};

onIonViewWillEnter(() => {
  void loadBull();
});
</script>

<style scoped>
.screen {
  min-height: 100%;
  padding: 16px;
  background: #f4f6f2;
}

.hero {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
  align-items: center;
  margin-bottom: 16px;
}

.avatar {
  display: grid;
  width: 76px;
  height: 76px;
  place-items: center;
  border: 1px solid #cfe0d2;
  border-radius: 8px;
  background: #e4efe7;
  color: #1f5c3f;
  font-size: 18px;
  font-weight: 900;
}

.hero-photo {
  width: 76px;
  height: 76px;
  border: 1px solid #cfe0d2;
  border-radius: 8px;
  object-fit: cover;
}

.hero-photo-button {
  display: block;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
}

.hero-photo-button:active {
  transform: scale(0.98);
}

.eyebrow,
.muted,
p {
  margin: 0;
  color: #607067;
}

.eyebrow {
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
}

h1 {
  margin: 0 0 6px;
  color: #1f2d24;
  font-size: 28px;
  line-height: 1.15;
}

h2 {
  margin: 0;
  color: #1f2d24;
  font-size: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 18px;
}

.stat,
.info-block,
.empty-history {
  border: 1px solid #dfe8df;
  border-radius: 8px;
  background: #ffffff;
}

.stat {
  display: grid;
  gap: 6px;
  min-height: 82px;
  padding: 12px;
}

.stat span,
dt {
  color: #607067;
  font-size: 13px;
}

.stat strong {
  color: #1f2d24;
  font-size: 18px;
}

.info-block {
  padding: 14px;
  margin-bottom: 18px;
}

.danger-zone__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

.danger-zone__button {
  --background: #8f3d29;
  --background-hover: #823421;
  --background-activated: #732d1c;
  --background-focused: #823421;
  --border-radius: 999px;
  --box-shadow: none;
  --padding-start: 18px;
  --padding-end: 18px;
  min-height: 46px;
  font-weight: 700;
}

.photo-viewer {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  grid-template-rows: auto 1fr;
  padding: calc(env(safe-area-inset-top) + 16px) 16px calc(env(safe-area-inset-bottom) + 20px);
  background: rgba(14, 23, 19, 0.92);
  backdrop-filter: blur(6px);
}

.photo-viewer__close {
  justify-self: end;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
}

.photo-viewer__body {
  display: grid;
  place-items: center;
  min-height: 0;
}

.photo-viewer__image {
  width: 100%;
  max-width: 960px;
  max-height: min(78vh, 960px);
  border-radius: 18px;
  object-fit: contain;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
}

dl {
  display: grid;
  gap: 12px;
  margin: 14px 0 0;
}

dl div {
  display: grid;
  gap: 4px;
}

dd {
  margin: 0;
  color: #1f2d24;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.weight-list {
  display: grid;
  gap: 10px;
  background: transparent;
}

.weight-item {
  --background: #ffffff;
  --border-radius: 8px;
  --inner-padding-end: 12px;
  --padding-start: 12px;
  border: 1px solid #dfe8df;
  border-radius: 8px;
}

.weight-item h3 {
  margin: 0 0 4px;
  color: #1f2d24;
  font-size: 16px;
}

.weight-value {
  display: grid;
  min-width: 64px;
  justify-items: end;
  color: #1f2d24;
}

.weight-value strong {
  font-size: 18px;
}

.weight-value span {
  color: #607067;
  font-size: 12px;
}

.empty-history {
  padding: 18px;
  color: #607067;
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

.error-block {
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #e7b3a9;
  border-radius: 8px;
  background: #fff2ee;
  color: #8a321f;
  white-space: pre-line;
}

.error-block p {
  margin: 0;
}
</style>
