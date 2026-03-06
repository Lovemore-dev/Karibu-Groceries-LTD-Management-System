import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  // Initialize with data from localStorage if it exists
  const user = ref(JSON.parse(localStorage.getItem('user')) || null)

  function setUser(userData) {
    user.value = userData
    localStorage.setItem('user', JSON.stringify(userData))
  }

  function clearUser() {
    user.value = null
    localStorage.removeItem('user')
  }

  return { user, setUser, clearUser }
})
