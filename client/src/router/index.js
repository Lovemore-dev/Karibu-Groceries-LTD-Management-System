import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import DashboardLayout from '@/views/DashboardLayout.vue'
import DashboardView from '@/views/DashboardView.vue'
import ProcurementView from '@/views/ProcurementView.vue'

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
      children:[
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue') 
        },
         {
          path: 'procurement',
          name: 'procurement',
          component: () => import('@/views/ProcurementView.vue') 
        },
         {
          path: 'sales',
          name: 'sales',
          component: () => import('@/views/SalesView.vue') 
        },
        {
          path: 'inventory',
          name: 'inventory',
          component: () => import('@/views/InventoryView.vue')
        },
        {
          path: 'intelligence',
          name: 'intelligence',
          component: () => import('@/views/IntelligenceView.vue') 
        }
      ]
    }
  ],
})

export default router
