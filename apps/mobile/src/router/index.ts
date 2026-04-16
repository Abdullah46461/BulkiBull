import { createRouter, createWebHistory } from '@ionic/vue-router';

import AddWeightView from '../views/AddWeightView.vue';
import BullDetailView from '../views/BullDetailView.vue';
import BullFormView from '../views/BullFormView.vue';
import BullListView from '../views/BullListView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/bulls',
    },
    {
      path: '/bulls',
      name: 'bulls',
      component: BullListView,
    },
    {
      path: '/bulls/new',
      name: 'bull-create',
      component: BullFormView,
      props: {
        mode: 'create',
      },
    },
    {
      path: '/bulls/:id',
      name: 'bull-detail',
      component: BullDetailView,
      props: true,
    },
    {
      path: '/bulls/:id/edit',
      name: 'bull-edit',
      component: BullFormView,
      props: (route) => ({
        mode: 'edit',
        id: route.params.id,
      }),
    },
    {
      path: '/bulls/:id/weights/new',
      name: 'weight-create',
      component: AddWeightView,
      props: true,
    },
  ],
});

export default router;
