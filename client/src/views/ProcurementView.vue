<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import api from '@/services/api';

// --- State ---
const procurements = ref([]);
const loading = ref(true);
const submitting = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const currentId = ref(null);
const stats = ref(null);

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
    if (formData.tonnage !== null && String(formData.tonnage).length < 3)
        e.tonnage = "Tonnage must be at least 3 digits (100kg+)";
    if (formData.cost !== null && String(formData.cost).length < 5)
        e.cost = "Cost must be at least 5 digits (10,000+)";
    if (formData.dealerName && (!/^[a-zA-Z0-9 ]+$/.test(formData.dealerName) || formData.dealerName.length < 2))
        e.dealerName = "Dealer name must be alpha-numeric (min 2 chars)";
    if (formData.contact && !/^(\+256|256|0)7[0-9]{8}$/.test(formData.contact))
        e.contact = "Enter a valid Ugandan phone number (07...)";
    if (formData.sellingPrice !== null && String(formData.sellingPrice).length < 5)
        e.sellingPrice = "Selling price must be at least 5 digits";
    return e;
});

const isFormValid = computed(() => {
    return Object.keys(errors.value).length === 0 &&
        formData.produceName && formData.produceType &&
        formData.tonnage && formData.cost &&
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
    <div class="container-fluid py-4">

        <Transition name="toast">
            <div v-if="toast.show" :class="['custom-toast shadow', `bg-${toast.type}`]">
                <i :class="toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'"
                    class="fa-solid me-2"></i>
                {{ toast.message }}
            </div>
        </Transition>

        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bold text-dark">Procurement Dashboard</h2>
            <button v-if="!stats" class="btn btn-primary rounded-pill px-4" @click="openAddModal">
                <i class="fa-solid fa-plus me-2"></i>Record New Procurement
            </button>
        </div>

        <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
            <div class="modal-content-custom card shadow-lg border-0">
                <div class="card-header bg-white d-flex justify-content-between align-items-center py-3 border-0">
                    <h5 class="mb-0 fw-bold">{{ isEditing ? 'Edit Procurement' : 'Procurement Form' }}</h5>
                    <button class="btn-close" @click="showModal = false"></button>
                </div>

                <div class="modal-body-scroll no-scrollbar p-4 pt-0">
                    <form @submit.prevent="handleSave" class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label small fw-bold">Produce Name</label>
                            <input v-model="formData.produceName" type="text" class="form-control bg-light"
                                :class="{ 'is-invalid': errors.produceName }">
                            <div class="invalid-feedback">{{ errors.produceName }}</div>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label small fw-bold">Produce Type</label>
                            <input v-model="formData.produceType" type="text" class="form-control bg-light"
                                :class="{ 'is-invalid': errors.produceType }">
                            <div class="invalid-feedback">{{ errors.produceType }}</div>
                        </div>

                        <div class="col-md-4">
                            <label class="form-label small fw-bold">Tonnes</label>
                            <input v-model.number="formData.tonnage" type="number" class="form-control bg-light"
                                :class="{ 'is-invalid': errors.tonnage }">
                            <div class="invalid-feedback">{{ errors.tonnage }}</div>
                        </div>

                        <div class="col-md-4">
                            <label class="form-label small fw-bold">Cost</label>
                            <input v-model.number="formData.cost" type="number" class="form-control bg-light"
                                :class="{ 'is-invalid': errors.cost }">
                            <div class="invalid-feedback">{{ errors.cost }}</div>
                        </div>

                        <div class="col-md-4">
                            <label class="form-label small fw-bold">Selling Price</label>
                            <input v-model.number="formData.sellingPrice" type="number" class="form-control bg-light"
                                :class="{ 'is-invalid': errors.sellingPrice }">
                            <div class="invalid-feedback">{{ errors.sellingPrice }}</div>
                        </div>

                        <div class="col-md-12">
                            <label class="form-label small fw-bold">Dealer Name</label>
                            <input v-model="formData.dealerName" type="text" class="form-control bg-light"
                                :class="{ 'is-invalid': errors.dealerName }">
                            <div class="invalid-feedback">{{ errors.dealerName }}</div>
                        </div>

                        <div class="col-md-12">
                            <label class="form-label small fw-bold">Contact</label>
                            <input v-model="formData.contact" type="text" class="form-control bg-light"
                                :class="{ 'is-invalid': errors.contact }">
                            <div class="invalid-feedback">{{ errors.contact }}</div>
                        </div>
                    </form>
                </div>

                <div class="card-footer bg-white text-end py-3 border-0">
                    <button class="btn btn-link text-muted me-3 text-decoration-none"
                        @click="showModal = false">Cancel</button>
                    <button @click="handleSave" class="btn btn-success px-4 rounded-pill shadow-sm"
                        :disabled="submitting || !isFormValid">
                        {{ submitting ? 'Processing...' : (isEditing ? 'Update Changes' : 'Confirm Purchase') }}
                    </button>
                </div>
            </div>
        </div>

        <div v-if="loading" class="text-center my-5 py-5">
            <div class="spinner-border text-primary"></div>
        </div>

        <div v-if="stats && stats.length > 0" class="card border-0 shadow-sm mb-4">
            <div class="card-header bg-white border-0 pt-4">
                <h5 class="fw-bold text-dark">Procurement Summary</h5>
            </div>
            <div class="table-responsive">
                <table class="table align-middle mb-0">
                    <thead class="text-muted small text-uppercase">
                        <tr>
                            <th class="ps-4">Branch</th>
                            <th>Total Investment</th>
                            <th>Tonnage Bought</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in stats" :key="item._id">
                            <td class="ps-4 fw-bold">{{ item._id }}</td>
                            <td class="fw-bold text-success">{{ item.totalInvestment.toLocaleString() }} UGX</td>
                            <td>{{ item.totalTonnageBought.toLocaleString() }} kg</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div v-if="!stats" class="card border-0 shadow-sm overflow-hidden">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="bg-light">
                        <tr>
                            <th class="ps-4">Date/Time</th>
                            <th>Produce</th>
                            <th>Tonnes</th>
                            <th>Dealer</th>
                            <th>Total</th>
                            <th class="pe-4 text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in procurements" :key="item._id">
                            <td class="ps-4">
                                <div class="text-dark small">{{ new Date(item.createdAt).toLocaleDateString() }}</div>
                                <div class="text-muted extra-small">{{ new Date(item.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit', minute: '2-digit'
                                }) }}</div>
                            </td>
                            <td>
                                <div class="fw-bold">{{ item.produceName }}</div>
                                <span class="badge bg-primary-subtle text-primary small">{{ item.produceType }}</span>
                            </td>
                            <td>{{ item.tonnage.toLocaleString() }} kg</td>
                            <td>
                                <div class="text-dark small">{{ item.dealerName }}</div>
                                <div class="text-muted extra-small">{{ item.contact }}</div>
                            </td>
                            <td class="fw-bold text-success">
                                {{ (item.tonnage * item.cost).toLocaleString() }} UGX
                            </td>
                            <td class="pe-4 text-end">
                                <div class="btn-group">
                                    <button class="btn btn-sm btn-outline-primary" @click="openEditModal(item)">
                                        <i class="fa-solid fa-pen"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" @click="handleDelete(item._id)">
                                        <i class="fa-solid fa-trash"></i>
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
/* All your existing styles remain exactly as they were */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1050;
}

.modal-content-custom {
    width: 95%;
    max-width: 600px;
    max-height: 85vh;
    border-radius: 20px;
    display: flex;
    flex-direction: column;
}

.modal-body-scroll {
    overflow-y: scroll;
    flex-grow: 1;
}

.no-scrollbar::-webkit-scrollbar {
    display: none;
}

.no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

.custom-toast {
    position: fixed;
    top: 20px;
    right: 20px;
    color: white;
    padding: 12px 24px;
    border-radius: 50px;
    z-index: 2000;
    font-weight: 500;
}

.extra-small {
    font-size: 0.75rem;
}

.toast-enter-active,
.toast-leave-active {
    transition: all 0.4s ease;
}

.toast-enter-from {
    opacity: 0;
    transform: translateY(-20px);
}

.toast-leave-to {
    opacity: 0;
    transform: translateX(50px);
}
</style>