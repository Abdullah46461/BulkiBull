<template>
  <ion-button aria-label="Аккаунт" @click="openAccountMenu">
    <ion-icon slot="icon-only" :icon="personCircleOutline" />
  </ion-button>
</template>

<script setup lang="ts">
import { IonButton, IonIcon, actionSheetController } from '@ionic/vue';
import { logOutOutline, personCircleOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';

import { authState, logout } from '../services/auth';

const router = useRouter();

const handleLogout = async (): Promise<void> => {
  await logout();
  await router.replace('/login');
};

const openAccountMenu = async (): Promise<void> => {
  const actionSheet = await actionSheetController.create({
    header: authState.currentUser.value?.email ?? 'Аккаунт',
    buttons: [
      {
        text: 'Выйти',
        role: 'destructive',
        icon: logOutOutline,
        handler: () => {
          void handleLogout();
        },
      },
      {
        text: 'Отмена',
        role: 'cancel',
      },
    ],
  });

  await actionSheet.present();
};
</script>
