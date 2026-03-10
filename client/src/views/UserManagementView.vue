<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '@/services/api';
import Swal from 'sweetalert2';

// --- State ---
const users = ref([]);
const loading = ref(true);
const submitting = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const currentId = ref(null);
// const userRole = inject('userRole');

// --- Toast System ---
const toast = reactive({ show: false, message: '', type: 'success' });
const triggerToast = (msg, type = 'success') => {
    toast.message = msg;
    toast.type = type;
    toast.show = true;
    setTimeout(() => { toast.show = false; }, 4000);
};

// --- Form State ---
const formData = reactive({
    fullName: '', username: '', email: '', password: '', role: 'Sales Agent', branch: 'Maganjo'
});

const resetForm = () => {
    isEditing.value = false;
    currentId.value = null;
    Object.assign(formData, {
        fullName: '', username: '', email: '', password: '', role: 'Sales Agent', branch: 'Maganjo'
    });
};

// --- Actions ---
const fetchUsers = async () => {
    try {
        loading.value = true;
        const response = await api.get('/user/');
        users.value = response.data.data;
    } catch (err) {
        triggerToast(err.response?.data?.message || "Failed to load users", "danger");
    } finally {
        loading.value = false;
    }
};

const editUser = (user) => {
    isEditing.value = true;
    currentId.value = user._id;
    Object.assign(formData, {
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        password: '', // Keep empty for security unless changing
        role: user.role,
        branch: user.branch
    });
    showModal.value = true;
};

const handleSave = async () => {
    try {
        submitting.value = true;
        if (isEditing.value) {
            // Call the PATCH route we just fixed in the backend
            await api.patch(`/user/${currentId.value}`, formData);
            triggerToast("User updated successfully", "success");
        } else {
            await api.post('/user/register', formData);
            triggerToast("User registered successfully", "success");
        }
        showModal.value = false;
        resetForm();
        await fetchUsers();
    } catch (err) {
        triggerToast(err.response?.data?.message || "Error saving user", "danger");
    } finally {
        submitting.value = false;
    }
};

const handleDelete = async (id, name) => {
    const result = await Swal.fire({
        title: 'Delete User?',
        text: `Are you sure you want to remove ${name}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Yes, remove'
    });

    if (result.isConfirmed) {
        try {
            // Note: using _id as per MongoDB standard
            await api.delete(`/user/${id}`);
            await fetchUsers();
            triggerToast("User removed successfully", "success");
        } catch (err) {
            triggerToast(err.response?.data?.message || "Failed to delete user", "danger");
        }
    }
};

onMounted(fetchUsers);
</script>

<template>
    <div class="container-fluid kgl-ledger p-2">
        <Transition name="toast">
            <div v-if="toast.show" :class="['kgl-toast shadow', `bg-${toast.type}`]">
                <i
                    :class="['fa-solid me-1 kgl-icon-sm', toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle']"></i>
                {{ toast.message }}
            </div>
        </Transition>

        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bold text-dark mb-0">User Management</h2>
            <button class="btn btn-sm btn-primary rounded-pill px-3 kgl-action-btn"
                @click="resetForm(); showModal = true">
                <i class="fa-solid fa-user-plus me-1 kgl-icon-sm"></i> Add New User
            </button>
        </div>

        <div v-if="showModal" class="kgl-modal-overlay" @click.self="showModal = false">
            <div class="kgl-modal-content card shadow border-0 p-2">
                <div class="card-header bg-white border-0 py-2 d-flex justify-content-between align-items-center">
                    <h5 class="mb-0 fw-bold text-sm">{{ isEditing ? 'Edit User' : 'Register User' }}</h5>
                    <button class="btn-close btn-sm" @click="showModal = false"></button>
                </div>
                <div class="kgl-modal-body p-2 pt-0">
                    <form @submit.prevent="handleSave" id="userForm" class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label small fw-bold">Full Name</label>
                            <input v-model="formData.fullName" type="text" class="form-control form-control-sm bg-light"
                                required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small fw-bold">Username</label>
                            <input v-model="formData.username" type="text" class="form-control form-control-sm bg-light"
                                required>
                        </div>
                        <div class="col-12">
                            <label class="form-label small fw-bold">Email</label>
                            <input v-model="formData.email" type="email" class="form-control form-control-sm bg-light"
                                required>
                        </div>
                        <div class="col-12" v-if="!isEditing">
                            <label class="form-label small fw-bold">Password</label>
                            <input v-model="formData.password" type="password"
                                class="form-control form-control-sm bg-light" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small fw-bold">Role</label>
                            <select v-model="formData.role" class="form-select form-select-sm bg-light">
                                <option value="Director">Director</option>
                                <option value="Manager">Manager</option>
                                <option value="Sales Agent">Sales Agent</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small fw-bold">Branch</label>
                            <select v-model="formData.branch" class="form-select form-select-sm bg-light">
                                <option value="Maganjo">Maganjo</option>
                                <option value="Matugga">Matugga</option>
                                <option value="Headquarters">Headquarters</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="card-footer bg-white text-end py-2 border-0">
                    <button class="btn btn-sm btn-link text-muted me-2 text-decoration-none"
                        @click="showModal = false">Cancel</button>
                    <button type="submit" form="userForm" class="btn btn-sm btn-success px-3 rounded-pill"
                        :disabled="submitting">
                        {{ submitting ? 'Saving...' : (isEditing ? 'Update User' : 'Confirm Registration') }}
                    </button>
                </div>
            </div>
        </div>

        <div v-if="loading" class="text-center my-2 py-3">
            <div class="spinner-border spinner-border-sm text-primary"></div>
        </div>

        <div v-else class="card border-0 shadow-sm overflow-hidden p-2">
            <div class="table-responsive">
                <table class="table table-sm table-hover align-middle mb-0 kgl-compact-table">
                    <thead class="bg-light">
                        <tr>
                            <th class="px-3">Name</th>
                            <th class="px-3">Username</th>
                            <th class="px-3">Role</th>
                            <th class="px-3">Branch</th>
                            <th class="px-3 text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="user in users" :key="user._id">
                            <td class="px-3 fw-bold text-sm">{{ user.fullName }}</td>
                            <td class="px-3 text-sm">{{ user.username }}</td>
                            <td class="px-3">
                                <span class="badge bg-primary-subtle text-primary text-xs">{{ user.role }}</span>
                            </td>
                            <td class="px-3 text-sm">{{ user.branch }}</td>
                            <td class="px-3 text-end">
                                <button class="btn btn-sm btn-outline-primary me-2 kgl-action-btn"
                                    @click="editUser(user)">
                                    <i class="fa-solid fa-pen-to-square kgl-icon-sm"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger kgl-action-btn"
                                    @click="handleDelete(user._id, user.fullName)">
                                    <i class="fa-solid fa-trash kgl-icon-sm"></i>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Styles remain unchanged as they were already correct */
.kgl-ledger .text-xs {
    font-size: 0.75rem;
}

.kgl-ledger :deep(.kgl-compact-table) {
    font-size: 0.875rem;
}

.kgl-icon-sm {
    font-size: 0.875rem;
    width: 1rem;
    display: inline-block;
    text-align: center;
}

.kgl-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1050;
}

.kgl-modal-content {
    width: 95%;
    max-width: 500px;
    max-height: 85vh;
    border-radius: 8px;
}

.kgl-modal-body {
    overflow-y: auto;
    flex-grow: 1;
}

.kgl-toast {
    position: fixed;
    top: 12px;
    right: 12px;
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    z-index: 2000;
    font-weight: 500;
    font-size: 0.875rem;
}

.toast-enter-active,
.toast-leave-active {
    transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}
</style>