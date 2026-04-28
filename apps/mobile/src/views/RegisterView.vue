<template>
  <ion-page>
    <ion-content fullscreen>
      <main class="auth-screen">
        <section class="auth-panel">
          <div class="brand">
            <span class="brand__mark">BB</span>
            <div>
              <p class="brand__eyebrow">Bulki Bull</p>
              <h1>Новый аккаунт</h1>
            </div>
          </div>

          <section v-if="registeredEmail" class="success-block">
            <ion-icon :icon="mailOutline" class="success-block__icon" />
            <h2>Проверьте почту</h2>
            <section v-if="error" class="error-block">
              <p>{{ error }}</p>
            </section>
            <p>
              Мы отправили ссылку подтверждения. Адрес:
              <strong>{{ registeredEmail }}</strong>
            </p>
            <p>После подтверждения вернитесь сюда и войдите с паролем.</p>
            <p v-if="delivery === 'dev_console'" class="dev-note">
              SMTP не настроен, поэтому письмо не отправляется на почту. Ссылка подтверждения
              напечатана в логе API.
            </p>
            <div class="success-actions">
              <ion-button fill="outline" type="button" :disabled="resending" @click="resend">
                <ion-spinner v-if="resending" slot="start" name="crescent" />
                <ion-icon v-else slot="start" :icon="refreshOutline" />
                Отправить еще раз
              </ion-button>
              <ion-button :router-link="{ name: 'login', query: redirectQuery }">
                <ion-icon slot="start" :icon="logInOutline" />
                Войти
              </ion-button>
            </div>
          </section>

          <form v-else class="auth-form" @submit.prevent="submit">
            <section v-if="error" class="error-block">
              <p>{{ error }}</p>
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
                autocomplete="new-password"
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

            <ion-item>
              <ion-input
                v-model="form.passwordConfirmation"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                label="Повтор пароля"
                label-placement="stacked"
                required
              />
            </ion-item>

            <p class="password-note">Минимум {{ AUTH_PASSWORD_MIN_LENGTH }} символов.</p>

            <ion-button expand="block" type="submit" :disabled="saving">
              <ion-spinner v-if="saving" slot="start" name="crescent" />
              <ion-icon v-else slot="start" :icon="personAddOutline" />
              Создать аккаунт
            </ion-button>
          </form>

          <p class="auth-switch">
            Уже есть аккаунт?
            <router-link :to="{ name: 'login', query: redirectQuery }">Войти</router-link>
          </p>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { AUTH_PASSWORD_MIN_LENGTH, type EmailVerificationDelivery } from '@bulki-bull/shared';
import { IonButton, IonContent, IonIcon, IonInput, IonItem, IonPage, IonSpinner } from '@ionic/vue';
import {
  eyeOffOutline,
  eyeOutline,
  logInOutline,
  mailOutline,
  personAddOutline,
  refreshOutline,
} from 'ionicons/icons';
import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import { register, resendEmailVerification } from '../services/auth';

const route = useRoute();
const saving = ref(false);
const resending = ref(false);
const error = ref('');
const showPassword = ref(false);
const registeredEmail = ref('');
const delivery = ref<EmailVerificationDelivery>('email');
const form = reactive({
  email: '',
  password: '',
  passwordConfirmation: '',
});

const redirectQuery = computed(() =>
  typeof route.query.redirect === 'string' ? { redirect: route.query.redirect } : {},
);

const submit = async (): Promise<void> => {
  if (form.password !== form.passwordConfirmation) {
    error.value = 'Пароли не совпадают.';
    return;
  }

  saving.value = true;
  error.value = '';

  try {
    const response = await register({
      email: form.email,
      password: form.password,
    });
    registeredEmail.value = response.email;
    delivery.value = response.delivery;
  } catch (requestError) {
    error.value =
      requestError instanceof Error ? requestError.message : 'Не удалось создать аккаунт';
  } finally {
    saving.value = false;
  }
};

const resend = async (): Promise<void> => {
  if (!registeredEmail.value) {
    return;
  }

  resending.value = true;
  error.value = '';

  try {
    const response = await resendEmailVerification({
      email: registeredEmail.value,
    });
    delivery.value = response.delivery;
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

.password-note {
  margin: -2px 2px 2px;
  color: var(--app-text-muted);
  font-size: 13px;
}

.success-block {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--app-accent-soft-border);
  border-radius: 8px;
  background: var(--app-accent-soft-background);
  color: var(--app-accent-soft-text);
}

.success-block__icon {
  font-size: 28px;
}

.success-block h2,
.success-block p {
  margin: 0;
}

.success-block h2 {
  font-size: 20px;
}

.success-block p {
  color: var(--app-text-strong);
  line-height: 1.45;
}

.dev-note {
  padding: 10px 12px;
  border: 1px solid var(--app-border-strong);
  border-radius: 8px;
  background: var(--app-surface);
}

.success-actions {
  display: grid;
  gap: 8px;
}

.error-block {
  padding: 12px;
  border: 1px solid var(--app-danger-soft-border);
  border-radius: 8px;
  background: var(--app-danger-soft-background);
  color: var(--app-danger-soft-text);
  white-space: pre-line;
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
