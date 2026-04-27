<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
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
            <section class="breed-field">
              <ion-item>
                <ion-input
                  v-model="form.breed"
                  label="Порода"
                  label-placement="stacked"
                  placeholder="Начните вводить или выберите из списка"
                  @ion-focus="openBreedSuggestions"
                  @ion-blur="scheduleBreedSuggestionsClose"
                />
              </ion-item>
              <div v-if="showBreedSuggestions" class="breed-suggestions">
                <button
                  v-for="breed in filteredBreedOptions"
                  :key="breed"
                  type="button"
                  class="breed-suggestion"
                  @pointerdown.prevent="selectBreed(breed)"
                  @click="selectBreed(breed)"
                >
                  {{ breed }}
                </button>
              </div>
            </section>
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
                  @click="capturePhoto"
                >
                  <ion-spinner v-if="photoAction === 'camera'" slot="start" name="crescent" />
                  <ion-icon v-else slot="start" :icon="cameraOutline" />
                  {{ photoPreviewUrl ? 'Снять заново' : 'Сделать фото' }}
                </ion-button>
                <ion-button
                  type="button"
                  fill="outline"
                  :disabled="saving || photoProcessing"
                  @click="selectPhotoFromGallery"
                >
                  <ion-spinner v-if="photoAction === 'gallery'" slot="start" name="crescent" />
                  <ion-icon v-else slot="start" :icon="imagesOutline" />
                  {{ photoPreviewUrl ? 'Выбрать из галереи' : 'Из галереи' }}
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
              <p class="photo-hint">
                Фото можно снять камерой или выбрать из галереи телефона. Ссылка вручную не нужна.
              </p>
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
  IonButton,
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
import { Camera, CameraDirection, MediaTypeSelection, type MediaResult } from '@capacitor/camera';
import {
  bullBreedValues,
  type BullSex,
  type CreateBullInput,
  type UpdateBullInput,
} from '@bulki-bull/shared';
import { cameraOutline, imagesOutline, saveOutline, trashOutline } from 'ionicons/icons';
import { computed, onBeforeUnmount, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

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

type PhotoAction = 'camera' | 'gallery';

const router = useRouter();
const isEdit = computed(() => props.mode === 'edit');
const loading = ref(false);
const photoAction = ref<PhotoAction | null>(null);
const photoProcessing = computed(() => photoAction.value !== null);
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

const PHOTO_MAX_DIMENSION = 1280;
const PHOTO_QUALITY = 85;
const BREED_SUGGESTIONS_CLOSE_DELAY_MS = 150;

const optionalText = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const breedSuggestionsOpen = ref(false);
const breedSuggestionsCloseTimeout = ref<number | null>(null);

const clearBreedSuggestionsCloseTimeout = (): void => {
  if (breedSuggestionsCloseTimeout.value === null) {
    return;
  }

  window.clearTimeout(breedSuggestionsCloseTimeout.value);
  breedSuggestionsCloseTimeout.value = null;
};

const filteredBreedOptions = computed(() => {
  const query = form.breed.trim().toLocaleLowerCase('ru-RU');

  return bullBreedValues.filter((breed) => {
    if (!query) {
      return true;
    }

    return breed.toLocaleLowerCase('ru-RU').includes(query);
  });
});

const showBreedSuggestions = computed(
  () => breedSuggestionsOpen.value && filteredBreedOptions.value.length > 0,
);

const openBreedSuggestions = (): void => {
  clearBreedSuggestionsCloseTimeout();
  breedSuggestionsOpen.value = true;
};

const scheduleBreedSuggestionsClose = (): void => {
  clearBreedSuggestionsCloseTimeout();
  breedSuggestionsCloseTimeout.value = window.setTimeout(() => {
    breedSuggestionsOpen.value = false;
    breedSuggestionsCloseTimeout.value = null;
  }, BREED_SUGGESTIONS_CLOSE_DELAY_MS);
};

const selectBreed = (breed: string): void => {
  clearBreedSuggestionsCloseTimeout();
  form.breed = breed;
  breedSuggestionsOpen.value = false;
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

const savePhotoFromResult = async (result?: MediaResult): Promise<void> => {
  if (!result?.webPath) {
    throw new Error('Не удалось получить фото. Попробуйте еще раз.');
  }

  form.photoUrl = await photoSourceToDataUrl(result.webPath);
};

const runPhotoAction = async (
  action: PhotoAction,
  task: () => Promise<void>,
  fallbackMessage: string,
): Promise<void> => {
  photoAction.value = action;
  error.value = '';

  try {
    await task();
  } catch (photoError) {
    if (isPhotoSelectionCancelled(photoError)) {
      return;
    }

    error.value = photoError instanceof Error ? photoError.message : fallbackMessage;
  } finally {
    photoAction.value = null;
  }
};

const capturePhoto = async (): Promise<void> =>
  runPhotoAction(
    'camera',
    async () => {
      const result = await Camera.takePhoto({
        cameraDirection: CameraDirection.Rear,
        correctOrientation: true,
        quality: PHOTO_QUALITY,
        saveToGallery: false,
        targetWidth: PHOTO_MAX_DIMENSION,
        targetHeight: PHOTO_MAX_DIMENSION,
        webUseInput: false,
      });

      await savePhotoFromResult(result);
    },
    'Не удалось сделать фото',
  );

const selectPhotoFromGallery = async (): Promise<void> =>
  runPhotoAction(
    'gallery',
    async () => {
      const { results } = await Camera.chooseFromGallery({
        correctOrientation: true,
        quality: PHOTO_QUALITY,
        limit: 1,
        mediaType: MediaTypeSelection.Photo,
        targetWidth: PHOTO_MAX_DIMENSION,
        targetHeight: PHOTO_MAX_DIMENSION,
      });

      await savePhotoFromResult(results[0]);
    },
    'Не удалось выбрать фото',
  );

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

onBeforeUnmount(() => {
  clearBreedSuggestionsCloseTimeout();
});
</script>

<style scoped>
.screen {
  min-height: 100%;
  padding: 16px 16px calc(16px + var(--app-bottom-nav-space, 0px));
  background: var(--app-screen-background);
}

.form-section {
  display: grid;
  gap: 10px;
  margin-bottom: 18px;
}

.breed-field {
  width: 100%;
}

ion-item {
  --background: var(--app-surface);
  --border-radius: 8px;
  --padding-start: 12px;
  --inner-padding-end: 12px;
  border: 1px solid var(--app-border-color);
  border-radius: 8px;
}

.breed-field ion-item {
  margin: 0;
}

.breed-suggestions {
  display: grid;
  gap: 6px;
  padding: 8px;
  margin-top: 6px;
  border: 1px solid var(--app-border-color);
  border-radius: 8px;
  background: var(--app-surface);
}

.breed-suggestion {
  padding: 10px 12px;
  color: var(--app-accent-soft-text);
  text-align: left;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border-strong);
  border-radius: 8px;
}

.field-hint {
  margin: 8px 2px 0;
  color: var(--app-text-muted);
  font-size: 13px;
}

.photo-section {
  display: grid;
  gap: 10px;
}

.photo-preview,
.photo-empty {
  overflow: hidden;
  min-height: 180px;
  border: 1px solid var(--app-border-color);
  border-radius: 8px;
  background: var(--app-surface);
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
  color: var(--app-text-muted);
  text-align: center;
}

.photo-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.photo-hint {
  color: var(--app-text-muted);
  font-size: 13px;
}

.error-block {
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid var(--app-danger-soft-border);
  border-radius: 8px;
  background: var(--app-danger-soft-background);
  color: var(--app-danger-soft-text);
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
  color: var(--app-text-muted);
  text-align: center;
}
</style>
