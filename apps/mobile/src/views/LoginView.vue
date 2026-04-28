<template>
  <ion-page>
    <ion-content fullscreen>
      <main class="auth-screen">
        <section class="auth-panel">
          <div class="brand">
            <span class="brand__mark">BB</span>
            <div>
              <p class="brand__eyebrow">Bulki Bull</p>
              <h1>Вход по почте</h1>
            </div>
          </div>

          <form class="auth-form" @submit.prevent="submit">
            <section v-if="error" class="error-block">
              <p>{{ error }}</p>
            </section>

            <section v-if="verificationEmail" class="info-block">
              <h2>Почта еще не подтверждена</h2>
              <p>
                Для адреса <strong>{{ verificationEmail }}</strong> нужен переход по ссылке из
                письма.
              </p>
              <p v-if="verificationDelivery === 'dev_console'" class="info-block__note">
                SMTP не настроен, поэтому ссылка подтверждения сейчас печатается в логе API.
              </p>
              <ion-button
                fill="outline"
                type="button"
                :disabled="resending"
                @click="resendVerification"
              >
                <ion-spinner v-if="resending" slot="start" name="crescent" />
                <ion-icon v-else slot="start" :icon="refreshOutline" />
                Отправить письмо еще раз
              </ion-button>
            </section>

            <ion-item>
              <ion-input
                v-model="form.email"
                type="email"
                inputmode="email"
                autocomplete="email"
                label="Почта"
                label-placement="stacked"
                required
              />
            </ion-item>

            <ion-item>
              <ion-input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                label="Пароль"
                label-placement="stacked"
                required
              />
              <ion-button
                slot="end"
                fill="clear"
                type="button"
                :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'"
                @click="showPassword = !showPassword"
              >
                <ion-icon slot="icon-only" :icon="showPassword ? eyeOffOutline : eyeOutline" />
              </ion-button>
            </ion-item>

            <ion-button expand="block" type="submit" :disabled="saving">
              <ion-spinner v-if="saving" slot="start" name="crescent" />
              <ion-icon v-else slot="start" :icon="logInOutline" />
              Войти
            </ion-button>
          </form>

          <p class="auth-switch">
            Нет аккаунта?
            <router-link :to="{ name: 'register', query: redirectQuery }">Создать</router-link>
          </p>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import type { EmailVerificationDelivery } from '@bulki-bull/shared';
import { IonButton, IonContent, IonIcon, IonInput, IonItem, IonPage, IonSpinner } from '@ionic/vue';
import { eyeOffOutline, eyeOutline, logInOutline, refreshOutline } from 'ionicons/icons';
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { ApiError } from '../services/api';
import { login, resendEmailVerification } from '../services/auth';

const route = useRoute();
const router = useRouter();
const saving = ref(false);
const resending = ref(false);
const error = ref('');
const showPassword = ref(false);
const verificationEmail = ref('');
const verificationDelivery = ref<EmailVerificationDelivery>('email');
const form = reactive({
  email: '',
  password: '',
});

const redirectTarget = computed(() =>
  typeof route.query.redirect === 'string' ? route.query.redirect : '/bulls',
);

const redirectQuery = computed(() =>
  typeof route.query.redirect === 'string' ? { redirect: route.query.redirect } : {},
);

const submit = async (): Promise<void> => {
  saving.value = true;
  error.value = '';
  verificationEmail.value = '';

  try {
    await login({
      email: form.email,
      password: form.password,
    });
    await router.replace(redirectTarget.value);
  } catch (requestError) {
    if (
      requestError instanceof ApiError &&
      requestError.status === 403 &&
      form.email.trim().length > 0
    ) {
      verificationEmail.value = form.email.trim().toLowerCase();
    }

    error.value = requestError instanceof Error ? requestError.message : 'Не удалось войти';
  } finally {
    saving.value = false;
  }
};

const resendVerification = async (): Promise<void> => {
  if (!verificationEmail.value) {
    return;
  }

  resending.value = true;
  error.value = '';

  try {
    const response = await resendEmailVerification({
      email: verificationEmail.value,
    });
    verificationDelivery.value = response.delivery;
  } catch (requestError) {
    error.value =
      requestError instanceof Error ? requestError.message : 'Не удалось отправить письмо';
  } finally {
    resending.value = false;
  }
};
</script>

<style scoped>
.auth-screen {
  display: grid;
  min-height: 100%;
  place-items: center;
  padding: 24px 16px;
  background: var(--app-screen-background);
}

.auth-panel {
  display: grid;
  width: min(100%, 420px);
  gap: 18px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand__mark {
  display: grid;
  width: 52px;
  height: 52px;
  place-items: center;
  border-radius: 8px;
  background: var(--ion-color-primary);
  color: var(--ion-color-primary-contrast);
  font-weight: 900;
}

.brand__eyebrow {
  margin: 0 0 2px;
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: var(--app-text-strong);
  font-size: 28px;
  line-height: 1.15;
}

.auth-form {
  display: grid;
  gap: 10px;
}

ion-item {
  --background: var(--app-surface);
  --border-radius: 8px;
  --padding-start: 12px;
  --inner-padding-end: 4px;
  border: 1px solid var(--app-border-color);
  border-radius: 8px;
}

.error-block {
  padding: 12px;
  border: 1px solid var(--app-danger-soft-border);
  border-radius: 8px;
  background: var(--app-danger-soft-background);
  color: var(--app-danger-soft-text);
  white-space: pre-line;
}

.info-block {
  display: grid;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--app-accent-soft-border);
  border-radius: 8px;
  background: var(--app-accent-soft-background);
}

.info-block h2,
.info-block p {
  margin: 0;
}

.info-block h2 {
  color: var(--app-accent-soft-text);
  font-size: 18px;
}

.info-block p {
  color: var(--app-text-strong);
  line-height: 1.45;
}

.info-block__note {
  padding: 10px 12px;
  border: 1px solid var(--app-border-strong);
  border-radius: 8px;
  background: var(--app-surface);
}

.error-block p,
.auth-switch {
  margin: 0;
}

.auth-switch {
  color: var(--app-text-muted);
  text-align: center;
}

.auth-switch a {
  color: var(--ion-color-primary);
  font-weight: 800;
  text-decoration: none;
}
</style>
