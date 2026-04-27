<template>
  <ion-app :style="appShellStyle">
    <ion-router-outlet />
    <primary-footer-nav v-if="showPrimaryFooter" :active-view="activeFooterView" />
  </ion-app>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { useRoute } from 'vue-router';

import PrimaryFooterNav from './components/PrimaryFooterNav.vue';

type PrimaryFooterView = 'bulls' | 'feeds' | 'create';

const route = useRoute();

const showPrimaryFooter = computed(() => route.meta.primaryFooter === true);

const activeFooterView = computed<PrimaryFooterView>(() => {
  const candidate = route.meta.footerView;

  if (candidate === 'feeds' || candidate === 'create' || candidate === 'bulls') {
    return candidate;
  }

  return 'bulls';
});

const appShellStyle = computed<Record<string, string>>(() => ({
  '--app-bottom-nav-space': showPrimaryFooter.value ? 'calc(env(safe-area-inset-bottom) + 68px)' : '0px',
}));
</script>
