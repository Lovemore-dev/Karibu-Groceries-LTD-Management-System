import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  // Keep localStorage key consistent across the app
  const STORAGE_KEY = 'userDetails'

  // Initialize with data from localStorage if it exists
  const user = ref(JSON.parse(localStorage.getItem(STORAGE_KEY)) || null)

  function setUser(userData) {
    user.value = userData
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
  }

  function clearUser() {
    user.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return { user, setUser, clearUser }
})
