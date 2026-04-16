<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/bulls" />
        </ion-buttons>
        <ion-title>{{ isEdit ? 'Редактирование' : 'Новый бычок' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen>
      <form class="screen" @submit.prevent="submit">
        <section v-if="loading" class="state">
          <ion-spinner name="crescent" />
          <p>Загружаем данные</p>
        </section>

        <template v-else>
          <section v-if="error" class="error-block">
            <p>{{ error }}</p>
          </section>

          <section class="form-section">
            <ion-item>
              <ion-input
                v-model="form.tagNumber"
                label="Бирка"
                label-placement="stacked"
                required
              />
            </ion-item>
            <ion-item>
              <ion-input v-model="form.name" label="Имя" label-placement="stacked" />
            </ion-item>
            <ion-item>
              <ion-input
                v-model="form.birthDate"
                type="date"
                label="Дата рождения"
                label-placement="stacked"
                required
              />
            </ion-item>
            <ion-item>
              <ion-input v-model="form.breed" label="Порода" label-placement="stacked" />
            </ion-item>
            <ion-item>
              <ion-select
                v-model="form.sex"
                label="Пол"
                label-placement="stacked"
                interface="popover"
              >
                <ion-select-option value="MALE">Бычок</ion-select-option>
                <ion-select-option value="FEMALE">Телка</ion-select-option>
                <ion-select-option value="UNKNOWN">Не указан</ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-input
                v-model="form.arrivalDate"
                type="date"
                label="Дата поступления"
                label-placement="stacked"
                required
              />
            </ion-item>
            <ion-item>
              <ion-input
                v-model="form.initialWeight"
                type="number"
                inputmode="decimal"
                label="Стартовый вес, кг"
                label-placement="stacked"
                required
              />
            </ion-item>
            <section class="photo-section">
              <div v-if="photoPreviewUrl" class="photo-preview">
                <img :src="photoPreviewUrl" alt="Фото бычка" />
              </div>
              <div v-else class="photo-empty">
                <p>Фото пока не выбрано</p>
              </div>
              <div class="photo-actions">
                <ion-button
                  type="button"
                  fill="outline"
                  :disabled="saving || photoProcessing"
                  @click="selectPhotoFromGallery"
                >
                  <ion-spinner v-if="photoProcessing" slot="start" name="crescent" />
                  <ion-icon v-else slot="start" :icon="imagesOutline" />
                  {{ photoPreviewUrl ? 'Заменить фото' : 'Выбрать из галереи' }}
                </ion-button>
                <ion-button
                  v-if="photoPreviewUrl"
                  type="button"
                  fill="clear"
                  color="medium"
                  :disabled="saving || photoProcessing"
                  @click="removePhoto"
                >
                  <ion-icon slot="start" :icon="trashOutline" />
                  Удалить
                </ion-button>
              </div>
              <p class="photo-hint">Фото выбирается из галереи телефона. Ссылка вручную не нужна.</p>
            </section>
            <ion-item>
              <ion-textarea
                v-model="form.notes"
                auto-grow
                label="Заметки"
                label-placement="stacked"
                :rows="3"
              />
            </ion-item>
          </section>

          <ion-button expand="block" type="button" :disabled="saving" @click="submit">
            <ion-spinner v-if="saving" slot="start" name="crescent" />
            <ion-icon v-else slot="start" :icon="saveOutline" />
            Сохранить
          </ion-button>
        </template>
      </form>
    </ion-content>
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
  IonInput,
  IonItem,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter,
} from '@ionic/vue';
import { Camera, MediaTypeSelection } from '@capacitor/camera';
import { imagesOutline, saveOutline, trashOutline } from 'ionicons/icons';
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { BullSex, CreateBullInput, UpdateBullInput } from '@bulki-bull/shared';

import { api } from '../services/api';
import { normalizePhotoUrl, photoSourceToDataUrl } from '../utils/photo';

const props = defineProps<{
  mode: 'create' | 'edit';
  id?: string;
}>();

type BullForm = {
  tagNumber: string;
  name: string;
  birthDate: string;
  breed: string;
  sex: BullSex;
  arrivalDate: string;
  initialWeight: string;
  photoUrl: string;
  notes: string;
};

const router = useRouter();
const isEdit = computed(() => props.mode === 'edit');
const loading = ref(false);
const photoProcessing = ref(false);
const saving = ref(false);
const error = ref('');
const form = reactive<BullForm>({
  tagNumber: '',
  name: '',
  birthDate: '',
  breed: '',
  sex: 'MALE',
  arrivalDate: '',
  initialWeight: '',
  photoUrl: '',
  notes: '',
});

const optionalText = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const isPhotoSelectionCancelled = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as {
    code?: unknown;
    message?: unknown;
  };

  const code = typeof candidate.code === 'string' ? candidate.code.toLowerCase() : '';
  const message = typeof candidate.message === 'string' ? candidate.message.toLowerCase() : '';

  return (
    code.includes('cancel') ||
    message.includes('cancel') ||
    message.includes('canceled') ||
    message.includes('cancelled')
  );
};

const fillForm = async (): Promise<void> => {
  if (!isEdit.value || !props.id) {
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const bull = await api.getBull(props.id);
    form.tagNumber = bull.tagNumber;
    form.name = bull.name ?? '';
    form.birthDate = bull.birthDate;
    form.breed = bull.breed ?? '';
    form.sex = bull.sex;
    form.arrivalDate = bull.arrivalDate;
    form.initialWeight = String(bull.initialWeight);
    form.photoUrl = bull.photoUrl ?? '';
    form.notes = bull.notes ?? '';
  } catch (requestError) {
    error.value =
      requestError instanceof Error ? requestError.message : 'Не удалось загрузить данные';
  } finally {
    loading.value = false;
  }
};

const buildPayload = (): CreateBullInput => ({
  tagNumber: form.tagNumber.trim(),
  name: optionalText(form.name),
  birthDate: form.birthDate,
  breed: optionalText(form.breed),
  sex: form.sex,
  arrivalDate: form.arrivalDate,
  initialWeight: Number(form.initialWeight),
  photoUrl: optionalText(form.photoUrl),
  notes: optionalText(form.notes),
});

const photoPreviewUrl = computed(() => normalizePhotoUrl(optionalText(form.photoUrl)));

const selectPhotoFromGallery = async (): Promise<void> => {
  photoProcessing.value = true;
  error.value = '';

  try {
    const { results } = await Camera.chooseFromGallery({
      quality: 85,
      limit: 1,
      mediaType: MediaTypeSelection.Photo,
      targetWidth: 1280,
      targetHeight: 1280,
    });
    const selectedPhoto = results[0];

    if (!selectedPhoto?.webPath) {
      return;
    }

    form.photoUrl = await photoSourceToDataUrl(selectedPhoto.webPath);
  } catch (photoError) {
    if (isPhotoSelectionCancelled(photoError)) {
      return;
    }

    error.value = photoError instanceof Error ? photoError.message : 'Не удалось выбрать фото';
  } finally {
    photoProcessing.value = false;
  }
};

const removePhoto = (): void => {
  form.photoUrl = '';
};

const submit = async (): Promise<void> => {
  if (photoProcessing.value) {
    return;
  }

  saving.value = true;
  error.value = '';

  try {
    const payload = buildPayload();
    const savedBull = isEdit.value
      ? await api.updateBull(props.id ?? '', payload satisfies UpdateBullInput)
      : await api.createBull(payload);

    await router.replace(`/bulls/${savedBull.id}`);
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Не удалось сохранить';
  } finally {
    saving.value = false;
  }
};

onIonViewWillEnter(() => {
  void fillForm();
});
</script>

<style scoped>
.screen {
  min-height: 100%;
  padding: 16px;
  background: #f4f6f2;
}

.form-section {
  display: grid;
  gap: 10px;
  margin-bottom: 18px;
}

ion-item {
  --background: #ffffff;
  --border-radius: 8px;
  --padding-start: 12px;
  --inner-padding-end: 12px;
  border: 1px solid #dfe8df;
  border-radius: 8px;
}

.photo-section {
  display: grid;
  gap: 10px;
}

.photo-preview,
.photo-empty {
  overflow: hidden;
  min-height: 180px;
  border: 1px solid #dfe8df;
  border-radius: 8px;
  background: #ffffff;
}

.photo-preview img {
  display: block;
  width: 100%;
  height: 220px;
  object-fit: cover;
}

.photo-empty {
  display: grid;
  place-items: center;
  padding: 16px;
  color: #607067;
  text-align: center;
}

.photo-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.photo-hint {
  color: #607067;
  font-size: 13px;
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
