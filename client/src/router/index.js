import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'

const getAuth = () => {
  const token = localStorage.getItem('token')
  let user = null
  try {
    user = JSON.parse(localStorage.getItem('userDetails'))
  } catch {
    user = null
  }
  return { token, user }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/admin',
      component: () => import('@/views/DashboardLayout.vue'),
      redirect: '/admin/dashboard',
      meta: { requiresAuth: true },
      children:[
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { roles: ['Director', 'Manager', 'Sales Agent'] },
        },
         {
          path: 'procurement',
          name: 'procurement',
          component: () => import('@/views/ProcurementView.vue'),
          meta: { roles: ['Director', 'Manager'] },
        },
         {
          path: 'sales',
          name: 'sales',
          component: () => import('@/views/SalesView.vue'),
          meta: { roles: ['Director', 'Manager', 'Sales Agent'] },
        },
        {
          path: 'inventory',
          name: 'inventory',
          component: () => import('@/views/InventoryView.vue'),
          meta: { roles: ['Director', 'Manager'] },
        },
        {
          path: 'intelligence',
          name: 'intelligence',
          component: () => import('@/views/IntelligenceView.vue'),
          meta: { roles: ['Director'] },
        }
      ]
    }
  ],
})

router.beforeEach((to) => {
  const requiresAuth = to.matched.some((r) => r.meta?.requiresAuth)
  if (!requiresAuth) return true

  const { token, user } = getAuth()
  if (!token || !user) return { path: '/login' }

  const allowedRoles = to.matched
    .map((r) => r.meta?.roles)
    .filter(Boolean)
    .at(-1)

  if (!allowedRoles) return true
  if (allowedRoles.includes(user.role)) return true

  // Friendly fallback per role
  if (user.role === 'Sales Agent') return { path: '/admin/sales' }
  return { path: '/admin/dashboard' }
})

export default router
