import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';

import useFirebaseAuth from "@/hooks/firebase";
const state = useFirebaseAuth();

const routes: Array<RouteRecordRaw> = [
  {
    path: '/auth',
    name: 'auth',
    component: () => import('@/views/auth/index.vue')
  },
  {
    name: 'search',
    path: '/search/:query?',
    component: () => import('@/views/search/index.vue')
  },
  {
    name: 'blocked',
    path: '/blocked',
    component: () => import('@/views/blocked/index.vue')
  },
  {
    name: 'muted',
    path: '/muted',
    component: () => import('@/views/muted/index.vue')
  },
  {
    name: 'security',
    path: '/security',
    component: () => import('@/views/security/index.vue')
  },
  {
    name: 'profile',
    path: '/profile/:name?',
    component: () => import('@/views/profile/index.vue')
  },
  {
    name: 'tweet',
    path: '/tweet/:id?',
    component: () => import('@/views/tweet/index.vue')
  },
  {
    name: 'feed',
    path: '/',
    component: () => import('@/views/index.vue')
  },
  {
    name: 'onboard',
    path: '/onboard',
    component: () => import('@/views/onboard/index.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  console.log('router-beforeEach')
  console.log(state)
  const isAuthenticated = !!(state.accessToken.value && state.accessTokenSecret.value && state.user.value)
  
  console.log(to)
  console.log(from)
  console.log(`authenticated: ${isAuthenticated}`)

  switch(to.name) {
    case 'feed':
      if (isAuthenticated) {
        next()
      } else {
        next({name : 'onboard', replace : true})
      }
      break;
    case 'auth':
      if (isAuthenticated) {
        next({name : 'feed', replace : true})
      } else {
        next()
      }
      break;
    default:
      next()
  }
});

export default router
