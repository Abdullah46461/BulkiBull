<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-title>{{ appName }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen>
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">{{ appName }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <main class="home">
        <section class="intro">
          <p class="eyebrow">MVP foundation</p>
          <h1>Учет бычков на откорме</h1>
          <p>
            Мобильный каркас запущен. Экраны списка, карточки и формы появятся на следующих этапах.
          </p>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
import { APP_NAME } from '@bulki-bull/shared';

const appName = APP_NAME;
</script>

<style scoped>
.home {
  min-height: 100%;
  padding: 24px;
  background: #f5f7f3;
}

.intro {
  max-width: 520px;
  padding-top: 28px;
}

.eyebrow {
  margin: 0 0 12px;
  color: #55715e;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1 {
  margin: 0 0 16px;
  color: #1f2d24;
  font-size: 30px;
  line-height: 1.15;
}

p {
  margin: 0;
  color: #4f5d54;
  font-size: 16px;
  line-height: 1.5;
}
</style>
