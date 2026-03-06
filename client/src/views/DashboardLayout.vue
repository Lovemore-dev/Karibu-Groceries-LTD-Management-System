<template>
    <div class="admin-wrapper">
        <div v-if="!isCollapsed" class="sidebar-overlay" @click="isCollapsed = true"></div>
        <aside :class="['admin-sidebar', { 'collapsed': isCollapsed }]">
            <div class="sidebar-brand">
                <router-link to="/admin/dashboard" class="logo-link">
                    <img src="/images/logo.png" alt="Karibu Logo" class="logo-img" />
                    <span v-if="!isCollapsed" class="logo-text">Karibu Groceries Ltd</span>
                </router-link>
            </div>

            <nav class="sidebar-nav">
                <router-link to="/admin/dashboard" class="nav-item">
                    <i class="fa-solid fa-gauge-high"></i>
                    <span>Executive Summary</span>
                </router-link>

                <template v-if="['manager', 'director'].includes(userRole)">
                    <div class="nav-section-label" v-if="!isCollapsed">Stock Management</div>
                    <router-link to="/admin/procurement" class="nav-item">
                        <i class="fa-solid fa-cart-flatbed"></i>
                        <span>Procurement</span>
                    </router-link>
                    <router-link to="/admin/inventory" class="nav-item">
                        <i class="fa-solid fa-boxes-stacked"></i>
                        <span>Inventory</span>
                    </router-link>
                </template>

                <div class="nav-section-label" v-if="!isCollapsed">Transactions</div>
                <router-link to="/admin/sales" class="nav-item">
                    <i class="fa-solid fa-file-invoice-dollar"></i>
                    <span>Sales</span>
                </router-link>

                <template v-if="userRole === 'director'">
                    <div class="nav-section-label" v-if="!isCollapsed">Intelligence</div>
                    <router-link to="/admin/intelligence" class="nav-item">
                        <i class="fa-solid fa-chart-line"></i>
                        <span>BI Dashboard</span>
                    </router-link>
                </template>
            </nav>
        </aside>

        <div class="main-content">
            <header class="admin-header">
                <div class="header-left">
                    <button @click="toggleSidebar" class="icon-btn toggle-sidebar" title="Toggle Sidebar">
                        <i :class="isCollapsed ? 'fa-solid fa-indent' : 'fa-solid fa-outdent'"></i>
                    </button>

                    <div class="page-info">
                        <h1 class="page-title">{{ currentPageName }}</h1>
                        <span class="branch-indicator">
                            <i class="fa-solid fa-location-dot"></i> {{ userBranch || 'Main Branch' }}
                        </span>
                    </div>
                </div>

                <div class="header-right">
                    <div class="header-search">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input type="text" placeholder="Search transactions..." />
                    </div>

                    <div class="v-divider"></div>

                    <div class="user-dropdown">
                        <div class="user-trigger">
                            <div class="user-text">
                                <span class="user-name">{{ username }}</span>
                                <span class="user-role">{{ userRole }}</span>
                            </div>
                            <div class="avatar-circle">
                                {{ username.charAt(0).toUpperCase() }}
                            </div>
                        </div>

                        <div class="dropdown-content">
                            <div class="dropdown-header">Account</div>
                            <button class="dropdown-link"><i class="fa-solid fa-user-gear"></i> Profile</button>
                            <hr />
                            <button @click="logout" class="dropdown-link logout-link">
                                <i class="fa-solid fa-arrow-right-from-bracket"></i> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main class="scroll-area">
                <div class="view-container">
                    <router-view />
                </div>
            </main>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted,provide } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const isCollapsed = ref(false)
const username = ref('User')
const userRole = ref('')
const userBranch = ref('')

provide('userRole', userRole)
provide('userBranch',userBranch)

// responsiveness
const handleResize = () => {
    if (window.innerWidth < 1024) {
        isCollapsed.value = true
    } else {
        isCollapsed.value = false
    }
}

// Dynamic title based on current route
const currentPageName = computed(() => {
    return route.name || 'Dashboard'
})

const toggleSidebar = () => { isCollapsed.value = !isCollapsed.value }

const logout = () => {
    localStorage.clear()
    router.push('/login')
}

onMounted(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    const user = JSON.parse(localStorage.getItem('userDetails'))
    if (user) {
        username.value = user.username
        userRole.value = user.role?.toLowerCase()
        userBranch.value = user.branch
    } else {
        router.push('/login')
    }
})
onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
/* Modern CSS Variables for Consistency */
:host {
    --primary: #10b981;
    /* Emerald Green for Karibu Groceries */
    --sidebar-bg: #0f172a;
    /* Slate 900 */
    --header-bg: rgba(255, 255, 255, 0.85);
    --border-color: #e2e8f0;
}

.admin-wrapper {
    display: flex;
    height: 100vh;
    background: #f8fafc;
    font-family: 'Inter', system-ui, sans-serif;
}

.main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
}

/* --- SIDEBAR --- */
.admin-sidebar {
    width: 260px;
    background: #1f3058;
    color: #94a3b8;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s ease;
    display: flex;
    flex-direction: column;
    z-index: 50;
}

.admin-sidebar.collapsed {
    width: 80px;
}

/* 1. Hide the nav text when collapsed */
.admin-sidebar.collapsed .nav-item span,
.admin-sidebar.collapsed .nav-section-label,
.admin-sidebar.collapsed .logo-text {
    display: none;
}

/* 2. Center the icons when collapsed for a clean look */
.admin-sidebar.collapsed .nav-item {
    justify-content: center;
    padding: 12px 0;
    margin: 4px 15px;
    /* Adjust margins to keep icons centered */
}

/* 3. Ensure the icons don't have extra gap when text is gone */
.admin-sidebar.collapsed .nav-item i {
    margin: 0;
    font-size: 1rem;
    /* Make icons slightly more prominent */
}

/* 4. Prevent any accidental horizontal scroll/overflow */
.admin-sidebar {
    overflow-x: hidden;
    white-space: nowrap;
}

.sidebar-brand {
    height: 70px;
    display: flex;
    align-items: center;
    padding: 0 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.logo-link {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    color: white;
    font-weight: 700;
}

.logo-img {
    height: 32px;
    width: auto;
    border-radius: 6px;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 24px;
    color: #94a3b8;
    text-decoration: none;
    transition: 0.2s;
    margin: 4px 12px;
    border-radius: 8px;
}

.nav-item:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.05);
}

.nav-item.router-link-active {
    background: #10b981;
    color: white;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

.nav-section-label {
    padding: 24px 24px 8px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #475569;
}

/* --- HEADER --- */
.admin-header {
    height: 70px;
    background: var(--header-bg);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    position: sticky;
    top: 0;
    z-index: 40;
    background: #bbcdfb60
}

.header-left {
    display: flex;
    align-items: center;
    gap: 20px;
}

.page-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
}

.branch-indicator {
    font-size: 0.75rem;
    color: #64748b;
    display: flex;
    align-items: center;
    gap: 4px;
}

.icon-btn {
    background: #f1f5f9;
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    color: #64748b;
    cursor: pointer;
    transition: 0.2s;
}

.icon-btn:hover {
    background: #e2e8f0;
    color: #10b981;
}

.header-search {
    position: relative;
    display: none;
}

@media (min-width: 1024px) {
    .header-search {
        display: block;
    }
}

.header-search i {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
}

.header-search input {
    background: #f1f5f9;
    border: 1px solid transparent;
    padding: 10px 16px 10px 40px;
    border-radius: 12px;
    width: 240px;
    font-size: 0.9rem;
}

.header-search input:focus {
    outline: none;
    border-color: #10b981;
    background: #fff;
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.05);
}

.header-right {
    display: flex;
    align-items: center;
    gap: 20px;
}

.v-divider {
    width: 1px;
    height: 32px;
    background: var(--border-color);
}

.user-dropdown {
    position: relative;
    cursor: pointer;
}

.user-trigger {
    display: flex;
    align-items: center;
    gap: 12px;
}

.user-text {
    text-align: right;
}

.user-name {
    display: block;
    font-size: 0.9rem;
    font-weight: 600;
    color: #1e293b;
}

.user-role {
    font-size: 0.75rem;
    color: #64748b;
    text-transform: capitalize;
}

.avatar-circle {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
}

/* User Dropdown Menu */
.dropdown-content {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    background: white;
    border-radius: 12px;
    min-width: 180px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    opacity: 0;
    visibility: hidden;
    transform: translateY(10px);
    transition: 0.2s;
    padding: 8px;
}

.user-dropdown:hover .dropdown-content {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

.dropdown-header {
    padding: 8px 12px;
    font-size: 0.7rem;
    font-weight: 800;
    color: #94a3b8;
    text-transform: uppercase;
}

.dropdown-link {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: none;
    background: none;
    border-radius: 8px;
    color: #475569;
    font-size: 0.9rem;
    cursor: pointer;
}

.dropdown-link:hover {
    background: #f1f5f9;
    color: #10b981;
}

.logout-link {
    color: #ef4444;
}

.logout-link:hover {
    background: #fef2f2;
    color: #dc2626;
}

/* Main Area Styling */
.scroll-area {
    flex: 1;
    overflow-y: auto;
}

.view-container {
    padding: 32px;
    max-width: 1600px;
    margin: 0 auto;
}

/* ... existing styles ... */

@media (max-width: 1024px) {

    /* 1. The Sidebar becomes an overlay drawer */
    .admin-sidebar {
        position: fixed;
        /* Sit on top of everything */
        top: 0;
        left: 0;
        height: 100vh;
        z-index: 100;
        /* Higher than header */
        box-shadow: 20px 0 50px rgba(0, 0, 0, 0.1);
    }

    /* 2. When collapsed on mobile, move it completely off-screen left */
    .admin-sidebar.collapsed {
        width: 260px;
        /* Keep its width so content doesn't squish */
        transform: translateX(-100%);
        /* Slide it out of view */
    }

    /* 3. Ensure the main content doesn't try to "shrink" to fit the sidebar */
    .main-content {
        width: 100%;
        margin-left: 0 !important;
    }

    /* 4. Keep the header button visible and functional */
    .header-left .toggle-sidebar {
        display: flex;
        /* Always show on mobile */
        position: relative;
        z-index: 110;
        /* Higher than the sidebar drawer */
    }
}


.sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(15, 23, 42, 0.3);
    /* Slate 900 with transparency */
    transition: opacity 0.3s ease;
    backdrop-filter: blur(4px);
    z-index: 80;
    /* Lower than sidebar (100) and header toggle (110) */
}

/* Ensure the header toggle is ALWAYS clickable */
.toggle-sidebar {
    position: relative;
    z-index: 110;
}

/* Hide overlay on desktop entirely */
@media (min-width: 1025px) {
    .sidebar-overlay {
        display: none;
    }
}

@media (max-width: 1024px) {
    .sidebar-overlay.active {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(4px);
        z-index: 90;
    }
}

/*Intelligence Dashboard design */
:deep(.stats-card) {
    transition: transform 0.2s ease;
}

:deep(.stats-card:hover) {
    transform: translateY(-5px);
}

:deep(.progress-bar-glow) {
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
}
</style>