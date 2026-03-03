<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// --- 1. Reactive State ---
const username = ref('')
const password = ref('')
const showPassword = ref(false)

// --- 2. Toast Logic ---
const toastMessage = ref('')
const toastType = ref('') // 'success' or 'error'
const isToastVisible = ref(false)

const triggerToast = (msg, type) => {
    toastMessage.value = msg
    toastType.value = type
    isToastVisible.value = true
    setTimeout(() => {
        isToastVisible.value = false
    }, 3000)
}

// --- 3. Login Logic ---
const handleLogin = async () => {
    if (!username.value.trim() || !password.value) {
        triggerToast("Please enter both username and password!", "error")
        return
    }

    try {
        const response = await fetch("http://localhost:3000/api/user/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: username.value,
                password: password.value
            }),
        })

        const result = await response.json()

        if (response.ok) {
            triggerToast("Login successful!", "success")
            localStorage.setItem("token", result.token)
            localStorage.setItem("userDetails", JSON.stringify(result.user))

            setTimeout(() => {
                router.push('/admin/dashboard')
            }, 1000)
        } else {
            triggerToast(result.message || "Unauthorized", "error")
        }
    } catch (error) {
        console.error("Error:", error)
        triggerToast("Server is offline or unreachable", "error")
    }
}
</script>

<template>
    <main class="mainLogin">
        <div class="welcomeSideLogin">
            <router-link to="/" class="logo-link">
                <div class="center-content">
                    <img src="/images/logo.png" width="200" height="200" alt="Logo" />
                </div>
            </router-link>
            <h2>Welcome to Karibu Groceries Ltd</h2>
        </div>

        <div class="loginSide">
            <div class="center-content">
                <img src="/images/logo.png" width="100" height="100" alt="Logo" />
                <h2>Karibu Groceries Limited</h2>
                <h1>Admin & Staff Login</h1>
                <p>Welcome back! Please enter your details</p>
            </div>

            <br />

            <form @submit.prevent="handleLogin">
                <label for="UserName">Username</label>
                <input v-model="username" type="text" id="UserName" placeholder="Enter your username" />

                <label for="enterPassword" class="mt-3">Password</label>
                <div class="password-wrapper">
                    <input v-model="password" :type="showPassword ? 'text' : 'password'" id="enterPassword"
                        placeholder="Enter your password" />
                    <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'" @click="showPassword = !showPassword"
                        class="eye-icon"></i>
                </div>

                <button class="submitButton" type="submit">Login</button>

                <br /><br />
                <p class="forgot-password">
                    <a href="#">Forgot Password?</a>
                </p>
            </form>
        </div>

        <transition name="fade">
            <div v-if="isToastVisible" :class="['toast-notification', toastType]">
                {{ toastMessage }}
            </div>
        </transition>
    </main>
</template>

<style scoped>
/* Replaces <center> tag functionality */
.center-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.logo-link {
    text-decoration: none;
    color: inherit;
}

.forgot-password {
    text-align: right;
    color: rgb(46, 179, 46);
}

/* Password Toggle Styling */
.password-wrapper {
    position: relative;
    width: 100%;
}

.eye-icon {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    color: #666;
}

/* Toast Styling */
.toast-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 25px;
    border-radius: 8px;
    color: white;
    z-index: 9999;
    font-weight: bold;
}

.toast-notification.success {
    background-color: #28a745;
}

.toast-notification.error {
    background-color: #dc3545;
}

/* Toast Animation */
.fade-enter-active,
.fade-leave-active {
    transition: all 0.3s ease;
}

.fade-enter-from {
    transform: translateX(100%);
    opacity: 0;
}

.fade-leave-to {
    transform: translateX(100%);
    opacity: 0;
}
</style>