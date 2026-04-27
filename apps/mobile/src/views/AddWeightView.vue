<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/bulls/${id}`" />
        </ion-buttons>
        <ion-title>Новый вес</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen>
      <form class="screen" @submit.prevent="submit">
        <section v-if="error" class="error-block">
          <p>{{ error }}</p>
        </section>

        <section class="form-section">
          <ion-item>
            <ion-input
              v-model="form.date"
              type="date"
              label="Дата"
              label-placement="stacked"
              required
            />
          </ion-item>
          <ion-item>
            <ion-input
              v-model="form.weight"
              type="number"
              inputmode="decimal"
              label="Вес, кг"
              label-placement="stacked"
              required
            />
          </ion-item>
          <ion-item>
            <ion-textarea
              v-model="form.comment"
              auto-grow
              label="Комментарий"
              label-placement="stacked"
              :rows="3"
            />
          </ion-item>
        </section>

        <ion-button expand="block" type="button" :disabled="saving" @click="submit">
          <ion-spinner v-if="saving" slot="start" name="crescent" />
          <ion-icon v-else slot="start" :icon="scaleOutline" />
          Добавить
        </ion-button>
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
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { scaleOutline } from 'ionicons/icons';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { api } from '../services/api';
import { todayIsoDate } from '../utils/formatters';

const props = defineProps<{
  id: string;
}>();

const router = useRouter();
const saving = ref(false);
const error = ref('');
const form = reactive({
  date: todayIsoDate(),
  weight: '',
  comment: '',
});

const optionalText = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const submit = async (): Promise<void> => {
  saving.value = true;
  error.value = '';

  try {
    await api.addWeight(props.id, {
      date: form.date,
      weight: Number(form.weight),
      comment: optionalText(form.comment),
    });
    await router.replace(`/bulls/${props.id}`);
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Не удалось добавить вес';
  } finally {
    saving.value = false;
  }
};
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

ion-item {
  --background: var(--app-surface);
  --border-radius: 8px;
  --padding-start: 12px;
  --inner-padding-end: 12px;
  border: 1px solid var(--app-border-color);
  border-radius: 8px;
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
</style>
