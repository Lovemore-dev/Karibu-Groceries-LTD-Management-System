<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';

// --- State ---
const procurements = ref([]);
const loading = ref(true);
const submitting = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const currentId = ref(null);
const stats = ref(null);

const authStore = useAuthStore();
const isManager = computed(() => authStore.user?.role === 'Manager');
const isDirector = computed(() => authStore.user?.role === 'Director');
const userBranch = computed(() => authStore.user?.branch || '');

// Match Produce.js model enums for dropdowns
const PRODUCE_NAMES = ['Beans', 'Grain Maize', 'Cow peas', 'G-nuts', 'Soybeans'];
const PRODUCE_TYPES = ['Legume', 'Cereal'];

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
    produceName: '',
    produceType: '',
    tonnage: null,
    cost: null,
    dealerName: '',
    contact: '',
    sellingPrice: null
});

// VALIDATION
const errors = computed(() => {
    const e = {};
    if (formData.produceName && !/^[a-zA-Z0-9 ]+$/.test(formData.produceName))
        e.produceName = "Produce name must be alpha-numeric";
    if (formData.produceType && (!/^[a-zA-Z ]+$/.test(formData.produceType) || formData.produceType.length < 2))
        e.produceType = "Type must be alphabets only (min 2 chars)";
    if (formData.tonnage !== null && Number(formData.tonnage) < 1000)
        e.tonnage = "Tonnage must be at least 1000kg";
    if (formData.cost !== null && Number(formData.cost) < 10000)
        e.cost = "Cost must be at least 10,000 UGX";
    if (formData.dealerName && (!/^[a-zA-Z0-9 ]+$/.test(formData.dealerName) || formData.dealerName.length < 2))
        e.dealerName = "Dealer name must be alpha-numeric (min 2 chars)";
    if (formData.contact && !/^(\+256|256|0)7[0-9]{8}$/.test(formData.contact))
        e.contact = "Enter a valid Ugandan phone number (07...)";
    if (
        formData.sellingPrice !== null &&
        formData.cost !== null &&
        formData.tonnage !== null &&
        Number(formData.tonnage) > 0 &&
        Number(formData.sellingPrice) < Number(formData.cost) / Number(formData.tonnage)
    ) {
        e.sellingPrice = "Selling price cannot be below unit cost";
    }
    return e;
});

const isFormValid = computed(() => {
    return Object.keys(errors.value).length === 0 &&
        formData.produceName && formData.produceType &&
        formData.tonnage && formData.cost && formData.sellingPrice &&
        formData.dealerName && formData.contact;
});


// Open Modal for New Record
const openAddModal = () => {
    isEditing.value = false;
    currentId.value = null;
    resetForm();
    showModal.value = true;
};

// Open Modal for Editing
const openEditModal = (item) => {
    isEditing.value = true;
    currentId.value = item._id;
    Object.assign(formData, {
        produceName: item.produceName,
        produceType: item.produceType,
        tonnage: item.tonnage,
        cost: item.cost,
        dealerName: item.dealerName,
        contact: item.contact,
        sellingPrice: item.sellingPrice
    });
    showModal.value = true;
};

const handleSave = async () => {
    if (!isManager.value) {
        triggerToast("Only Managers can record procurements", "danger");
        return;
    }
    if (!isFormValid.value) {
        triggerToast("Please fix the errors in the form before submitting", "danger");
        return;
    }

    try {
        submitting.value = true;

        //ensure numeric values are actually numbers
        const payload = {
            ...formData,
            tonnage: Number(formData.tonnage),
            cost: Number(formData.cost),
            sellingPrice: Number(formData.sellingPrice)
        }
        let response;

        if (isEditing.value) {
            response = await api.patch(`/procurements/${currentId.value}`, payload);
        } else {
            response = await api.post('/procurements', payload);
        }

        if (response.data.status === 'success') {
            resetForm();
            showModal.value = false;
            await fetchProcurements();
            triggerToast(isEditing.value ? "Update successful!" : "Recorded successfully!", "success");
        }
    } catch (err) {
        triggerToast(err.response?.data?.message || "Error saving data", "danger");
    } finally {
        submitting.value = false;
    }
};

import Swal from 'sweetalert2';

const handleDelete = async (id) => {
    // This creates the "Small Window" popup
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    });

    // Only proceed if they clicked "Yes"
    if (result.isConfirmed) {
        try {
            const response = await api.delete(`/procurements/${id}`);
            if (response.data.status === 'success') {
                await fetchProcurements();
                triggerToast("Record deleted successfully", "success");
            }
        } catch (err) {
            triggerToast("Failed to delete record", "danger", err);
        }
    }
};
const resetForm = () => {
    Object.assign(formData, {
        produceName: '', produceType: '', tonnage: null,
        cost: null, dealerName: '', contact: '', sellingPrice: null
    });
};

const fetchProcurements = async () => {
    try {
        loading.value = true;
        const response = await api.get('/procurements');
        // load table
        procurements.value = response.data.data;

        // For director's aggregated data
        stats.value = response.data.stats || null;
    } catch (err) {
        const errMessage = err.response?.data?.message || "Failed to fetch records";
        triggerToast(errMessage, "danger");
    } finally {
        loading.value = false;
    }
};

onMounted(fetchProcurements);
</script>

<template>
    <div class="container-fluid kgl-ledger p-2">

        <Transition name="toast">
            <div v-if="toast.show" :class="['kgl-toast shadow', `bg-${toast.type}`]">
                <i :class="[toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle', 'fa-solid me-1 kgl-icon-sm']"></i>
                {{ toast.message }}
            </div>
        </Transition>

        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bold text-dark mb-0">{{ isDirector ? 'Procurement Summary' : 'Procurement Dashboard' }}</h2>
            <button v-if="isManager" class="btn btn-sm btn-primary rounded-pill px-3 kgl-action-btn" @click="openAddModal">
                <i class="fa-solid fa-plus me-1 kgl-icon-sm"></i>Record New Procurement
            </button>
        </div>

        <div v-if="showModal" class="kgl-modal-overlay" @click.self="showModal = false">
            <div class="kgl-modal-content card shadow border-0 p-2">
                <div class="card-header bg-white d-flex justify-content-between align-items-center py-2 border-0">
                    <h5 class="mb-0 fw-bold text-sm">{{ isEditing ? 'Edit Procurement' : 'Procurement Form' }}</h5>
                    <button class="btn-close btn-sm" @click="showModal = false"></button>
                </div>

                <div class="kgl-modal-body p-2 pt-0">
                    <form @submit.prevent="handleSave" class="row g-3">
                        <div class="col-12" v-if="userBranch">
                            <label class="form-label small fw-bold">Branch</label>
                            <input :value="userBranch" type="text" class="form-control form-control-sm bg-light" disabled>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small fw-bold">Produce Name</label>
                            <select v-model="formData.produceName" class="form-select form-select-sm bg-light"
                                :class="{ 'is-invalid': errors.produceName }">
                                <option value="" disabled>Select produce</option>
                                <option v-for="name in PRODUCE_NAMES" :key="name" :value="name">{{ name }}</option>
                            </select>
                            <div class="invalid-feedback">{{ errors.produceName }}</div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small fw-bold">Produce Type</label>
                            <select v-model="formData.produceType" class="form-select form-select-sm bg-light"
                                :class="{ 'is-invalid': errors.produceType }">
                                <option value="" disabled>Select type</option>
                                <option v-for="type in PRODUCE_TYPES" :key="type" :value="type">{{ type }}</option>
                            </select>
                            <div class="invalid-feedback">{{ errors.produceType }}</div>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label small fw-bold">Tonnes</label>
                            <input v-model.number="formData.tonnage" type="number" class="form-control form-control-sm bg-light"
                                :class="{ 'is-invalid': errors.tonnage }">
                            <div class="invalid-feedback">{{ errors.tonnage }}</div>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label small fw-bold">Cost</label>
                            <input v-model.number="formData.cost" type="number" class="form-control form-control-sm bg-light"
                                :class="{ 'is-invalid': errors.cost }">
                            <div class="invalid-feedback">{{ errors.cost }}</div>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label small fw-bold">Selling Price</label>
                            <input v-model.number="formData.sellingPrice" type="number" class="form-control form-control-sm bg-light"
                                :class="{ 'is-invalid': errors.sellingPrice }">
                            <div class="invalid-feedback">{{ errors.sellingPrice }}</div>
                        </div>
                        <div class="col-12">
                            <label class="form-label small fw-bold">Dealer Name</label>
                            <input v-model="formData.dealerName" type="text" class="form-control form-control-sm bg-light"
                                :class="{ 'is-invalid': errors.dealerName }">
                            <div class="invalid-feedback">{{ errors.dealerName }}</div>
                        </div>
                        <div class="col-12">
                            <label class="form-label small fw-bold">Contact</label>
                            <input v-model="formData.contact" type="text" class="form-control form-control-sm bg-light"
                                :class="{ 'is-invalid': errors.contact }">
                            <div class="invalid-feedback">{{ errors.contact }}</div>
                        </div>
                    </form>
                </div>

                <div class="card-footer bg-white text-end py-2 border-0">
                    <button class="btn btn-sm btn-link text-muted me-2 text-decoration-none kgl-action-btn" @click="showModal = false">Cancel</button>
                    <button @click="handleSave" class="btn btn-sm btn-success px-3 rounded-pill kgl-action-btn"
                        :disabled="submitting || !isFormValid">
                        {{ submitting ? 'Processing...' : (isEditing ? 'Update' : 'Confirm') }}
                    </button>
                </div>
            </div>
        </div>

        <div v-if="loading" class="text-center my-2 py-3">
            <div class="spinner-border spinner-border-sm text-primary"></div>
        </div>

        <!-- Director: total procurement per branch only -->
        <div v-if="isDirector && stats && stats.length > 0" class="card border-0 shadow-sm p-2 mb-4">
            <div class="card-header bg-white border-0 py-2">
                <h5 class="fw-bold text-dark mb-0 small text-uppercase">Total Procurement per Branch</h5>
            </div>
            <div class="table-responsive">
                <table class="table table-sm table-hover align-middle mb-0 kgl-compact-table">
                    <thead class="text-muted text-uppercase">
                        <tr>
                            <th class="px-3">Branch</th>
                            <th class="px-3">Total Investment</th>
                            <th class="px-3">Tonnage Bought</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in stats" :key="item._id">
                            <td class="px-3 fw-bold text-sm align-middle">{{ item._id }}</td>
                            <td class="px-3 fw-bold text-success align-middle">{{ item.totalInvestment.toLocaleString() }} UGX</td>
                            <td class="px-3 text-sm align-middle">{{ item.totalTonnageBought.toLocaleString() }} kg</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Manager only: procurement history (no current stock column) -->
        <div v-if="isManager && procurements.length > 0" class="card border-0 shadow-sm overflow-hidden p-2 mb-4">
            <div class="card-header bg-white border-0 py-2">
                <h5 class="fw-bold text-dark mb-0 small text-uppercase">Procurement Log (by Produce)</h5>
            </div>
            <div class="table-responsive">
                <table class="table table-sm table-hover align-middle mb-0 kgl-compact-table">
                    <thead class="bg-light">
                        <tr>
                            <th class="px-3">Date/Time</th>
                            <th class="px-3">Produce</th>
                            <th class="px-3">Tonnage (Purchased)</th>
                            <th class="px-3">Dealer</th>
                            <th class="px-3">Total</th>
                            <th class="px-3 text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in procurements" :key="item._id">
                            <td class="px-3 align-middle">
                                <div class="text-dark text-sm">{{ new Date(item.createdAt).toLocaleDateString() }}</div>
                                <div class="text-muted text-xs">{{ new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</div>
                            </td>
                            <td class="px-3 align-middle">
                                <div class="fw-bold">{{ item.produceName }}</div>
                                <span class="badge bg-primary-subtle text-primary text-xs">{{ item.produceType }}</span>
                            </td>
                            <td class="px-3 align-middle">{{ item.tonnage.toLocaleString() }} kg</td>
                            <td class="px-3 align-middle">
                                <div class="text-dark text-sm">{{ item.dealerName }}</div>
                                <div class="text-muted text-xs">{{ item.contact }}</div>
                            </td>
                            <td class="px-3 fw-bold text-success align-middle">{{ (item.tonnage * item.cost).toLocaleString() }} UGX</td>
                            <td class="px-3 text-end align-middle">
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-sm btn-outline-primary kgl-action-btn" @click="openEditModal(item)">
                                        <i class="fa-solid fa-pen kgl-icon-sm"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger kgl-action-btn" @click="handleDelete(item._id)">
                                        <i class="fa-solid fa-trash kgl-icon-sm"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* KGL namespaced: ledger/compact overrides only */
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
    max-width: 600px;
    max-height: 85vh;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
}

.kgl-modal-body {
    overflow-y: auto;
    flex-grow: 1;
}

.kgl-modal-body::-webkit-scrollbar {
    width: 6px;
}

.kgl-modal-body::-webkit-scrollbar-thumb {
    background: #dee2e6;
    border-radius: 3px;
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

.toast-enter-from {
    opacity: 0;
    transform: translateY(-8px);
}

.toast-leave-to {
    opacity: 0;
    transform: translateX(24px);
}
</style>