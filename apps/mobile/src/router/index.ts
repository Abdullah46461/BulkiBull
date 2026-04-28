import { createRouter, createWebHistory } from '@ionic/vue-router';

import AddWeightView from '../views/AddWeightView.vue';
import LoginView from '../views/LoginView.vue';
import BullDetailView from '../views/BullDetailView.vue';
import BullFormView from '../views/BullFormView.vue';
import BullListView from '../views/BullListView.vue';
import FeedsView from '../views/FeedsView.vue';
import RegisterView from '../views/RegisterView.vue';
import { ensureAuth, hasStoredAuthToken } from '../services/auth';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/bulls',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        public: true,
      },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: {
        public: true,
      },
    },
    {
      path: '/bulls',
      name: 'bulls',
      component: BullListView,
      meta: {
        primaryFooter: true,
        footerView: 'bulls',
      },
    },
    {
      path: '/bulls/new',
      name: 'bull-create',
      component: BullFormView,
      props: {
        mode: 'create',
      },
      meta: {
        primaryFooter: true,
        footerView: 'create',
      },
    },
    {
      path: '/bulls/:id',
      name: 'bull-detail',
      component: BullDetailView,
      props: true,
      meta: {
        primaryFooter: true,
        footerView: 'bulls',
      },
    },
    {
      path: '/bulls/:id/edit',
      name: 'bull-edit',
      component: BullFormView,
      props: (route) => ({
        mode: 'edit',
        id: route.params.id,
      }),
      meta: {
        primaryFooter: true,
        footerView: 'bulls',
      },
    },
    {
      path: '/bulls/:id/weights/new',
      name: 'weight-create',
      component: AddWeightView,
      props: true,
      meta: {
        primaryFooter: true,
        footerView: 'bulls',
      },
    },
    {
      path: '/feeds',
      name: 'feeds',
      component: FeedsView,
      meta: {
        primaryFooter: true,
        footerView: 'feeds',
      },
    },
  ],
});

router.beforeEach(async (to) => {
  if (to.meta.public === true) {
    if ((to.name === 'login' || to.name === 'register') && hasStoredAuthToken()) {
      const user = await ensureAuth();

      if (user) {
        return { name: 'bulls' };
      }
    }

    return true;
  }

  const user = await ensureAuth();

  if (!user) {
    return {
      name: 'login',
      query: {
        redirect: to.fullPath,
      },
    };
  }

  return true;
});

export default router;
