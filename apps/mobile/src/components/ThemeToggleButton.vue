<template>
  <ion-button :aria-label="ariaLabel" @click="toggleThemePreference">
    <ion-icon slot="icon-only" :icon="toggleIcon" />
  </ion-button>
</template>

<script setup lang="ts">
import { IonButton, IonIcon } from '@ionic/vue';
import { moonOutline, sunnyOutline } from 'ionicons/icons';
import { computed } from 'vue';

import { toggleThemePreference, useTheme } from '../theme/theme';

const { resolvedTheme } = useTheme();

const isDarkTheme = computed(() => resolvedTheme.value === 'dark');

const toggleIcon = computed(() => (isDarkTheme.value ? sunnyOutline : moonOutline));

const ariaLabel = computed(() =>
  isDarkTheme.value ? 'Переключить на светлую тему' : 'Переключить на темную тему',
);
</script>
