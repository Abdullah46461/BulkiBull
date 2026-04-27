<template>
  <div class="primary-footer" aria-hidden="false">
    <nav class="primary-footer__nav" aria-label="Основная навигация">
      <ion-button
        fill="clear"
        class="primary-footer__tab"
        :class="{ 'primary-footer__tab--active': activeView === 'bulls' }"
        router-link="/bulls"
        aria-label="Открыть список бычков"
        :aria-current="activeView === 'bulls' ? 'page' : undefined"
      >
        <span class="primary-footer__tab-content">Бычки</span>
      </ion-button>

      <ion-button
        fill="clear"
        class="primary-footer__tab"
        :class="{ 'primary-footer__tab--active': activeView === 'create' }"
        router-link="/bulls/new"
        aria-label="Добавить нового бычка"
        :aria-current="activeView === 'create' ? 'page' : undefined"
      >
        <span class="primary-footer__tab-content">Добавить</span>
      </ion-button>

      <ion-button
        fill="clear"
        class="primary-footer__tab"
        :class="{ 'primary-footer__tab--active': activeView === 'feeds' }"
        router-link="/feeds"
        aria-label="Открыть корма"
        :aria-current="activeView === 'feeds' ? 'page' : undefined"
      >
        <span class="primary-footer__tab-content">Корма</span>
      </ion-button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { IonButton } from '@ionic/vue';

defineProps<{
  activeView: 'bulls' | 'feeds' | 'create';
}>();
</script>

<style scoped>
.primary-footer {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 90;
  padding: 4px 0 env(safe-area-inset-bottom);
  background: var(--app-footer-background);
  border-top: 1px solid var(--app-footer-border-color);
  box-shadow: var(--app-footer-shadow);
}

.primary-footer__nav {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: center;
  width: 100%;
  gap: 8px;
  padding: 0 10px;
}

.primary-footer__tab {
  --border-radius: 999px;
  --color: var(--app-text-muted);
  --background: transparent;
  --background-hover: transparent;
  --background-activated: transparent;
  --padding-start: 0;
  --padding-end: 0;
  --ripple-color: transparent;
  margin: 0;
  min-height: 42px;
}

.primary-footer__tab-content {
  display: inline-flex;
  justify-items: center;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-width: 0;
  padding: 9px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  transition:
    background-color 180ms ease,
    color 180ms ease,
    transform 180ms ease;
}

.primary-footer__tab--active {
  --color: var(--ion-color-primary);
}

.primary-footer__tab--active .primary-footer__tab-content {
  background: var(--app-footer-active-background);
  font-weight: 700;
  letter-spacing: -0.01em;
}

@media (max-width: 360px) {
  .primary-footer__tab-content {
    padding-inline: 8px;
    font-size: 12px;
  }
}
</style>
