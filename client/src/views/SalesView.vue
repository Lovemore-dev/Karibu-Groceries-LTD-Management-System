<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import api from '@/services/api';
import Swal from 'sweetalert2';
import { useAuthStore } from '@/stores/auth';

// --- State ---
const cashSales = ref([]);
const creditSales = ref([]);
const loading = ref(true);
const submitting = ref(false);
const showModal = ref(false);
const saleType = ref('cash');
const authStore = useAuthStore();
const userRole = computed(() => authStore.user?.role || '');
const isDirector = computed(() => userRole.value === 'Director');

// Stock lookup (for enforcing available inventory and amount preview)
const stockLoading = ref(false);
const stockKgAvailable = ref(null); // null => unknown/unloaded
const stockMessage = ref('');
const sellingPricePerKg = ref(null); // from stock API for amount preview

// Sale.js produceName enum
const PRODUCE_NAMES = ['Beans', 'Grain Maize', 'Cow peas', 'G-nuts', 'Soybeans'];

// --- Form State ---
const formData = reactive({
    produceName: '',
    tonnage: null,
    buyersName: '',
    // Credit specific
    nationalId: '',
    contact: '',
    location: '',
    dueDate: ''
});

const ninRegex = /^(CF|CM)[A-Z0-9]{12}$/;
const phoneRegex = /^(\+256|256|0)7[0-9]{8}$/;
const alphaNumSpace = /^[a-zA-Z0-9 ]+$/;

const errors = computed(() => {
    const e = {};
    if (!formData.produceName?.trim()) e.produceName = 'Produce name is required';
    else if (!PRODUCE_NAMES.includes(formData.produceName)) e.produceName = 'Select a valid produce';

    if (formData.tonnage === null || formData.tonnage === '' || Number.isNaN(Number(formData.tonnage))) {
        e.tonnage = 'Tonnage is required';
    } else if (Number(formData.tonnage) <= 0) {
        e.tonnage = 'Tonnage must be a positive number';
    } else if (typeof stockKgAvailable.value === 'number' && Number(formData.tonnage) > stockKgAvailable.value) {
        e.tonnage = `Insufficient inventory. Only ${stockKgAvailable.value}kg available.`;
    }

    if (!formData.buyersName?.trim()) e.buyersName = "Buyer's name is required";
    else if (!alphaNumSpace.test(formData.buyersName) || formData.buyersName.trim().length < 2) {
        e.buyersName = "Buyer's name should be alpha-numeric (min 2 chars)";
    }

    if (saleType.value === 'credit') {
        if (!formData.nationalId?.trim()) e.nationalId = 'NIN is required';
        else if (!ninRegex.test(formData.nationalId.trim().toUpperCase())) e.nationalId = 'Follow the format of NIN in Uganda (CF/CM + 12 chars)';

        if (!formData.location?.trim()) e.location = 'Location is required';
        else if (!alphaNumSpace.test(formData.location) || formData.location.trim().length < 2) {
            e.location = 'Location should be alpha-numeric (min 2 chars)';
        }

        if (!formData.contact?.trim()) e.contact = 'Contact is required';
        else if (!phoneRegex.test(formData.contact)) e.contact = 'Contact must be a valid phone number in Uganda';

        if (!formData.dueDate) e.dueDate = 'Due date is required';
    }

    return e;
});

const isFormValid = computed(() => Object.keys(errors.value).length === 0);

// Amount buyer will pay (estimated from first batch selling price; actual is computed by backend FIFO)
const amountPaidDisplay = computed(() => {
    const qty = Number(formData.tonnage);
    const price = sellingPricePerKg.value;
    if (price == null || !Number.isFinite(qty) || qty <= 0) return null;
    return Math.round(price * qty);
});

// --- Fetch Only Sales ---
const fetchData = async () => {
    try {
        loading.value = true;
        // Only calling the sales endpoint to avoid inventory route errors
        const response = await api.get('/sales');
        if (response.data.role === 'Director') {
            cashSales.value = response.data.cashAggregations || [];
            creditSales.value = response.data.creditAggregations || [];
        } else {
            cashSales.value = response.data.cashSales || [];
            creditSales.value = response.data.creditSales || [];
        }
    } catch (err) {
        console.error("Sales Fetch Error:", err);
        Swal.fire('Error', 'Could not load sales records. Check if the /sales route is working.', 'error');
    } finally {
        loading.value = false;
    }
};

const fetchAvailableStock = async () => {
    const produceName = formData.produceName?.trim();
    if (!produceName) {
        stockKgAvailable.value = null;
        stockMessage.value = '';
        return;
    }

    try {
        stockLoading.value = true;
        stockMessage.value = '';
        sellingPricePerKg.value = null;
        const res = await api.get('/sales/stock', { params: { produceName } });
        const data = res.data?.data || {};
        const totalAvailable = data.totalAvailable;
        stockKgAvailable.value = typeof totalAvailable === 'number' ? totalAvailable : null;
        sellingPricePerKg.value = data.sellingPricePerKg ?? null;
        if (typeof stockKgAvailable.value === 'number') {
            stockMessage.value = `${stockKgAvailable.value.toLocaleString()} kg available`;
        }
    } catch (err) {
        stockKgAvailable.value = null;
        sellingPricePerKg.value = null;
        stockMessage.value = err.response?.data?.message || 'Stock will be verified on submit';
    } finally {
        stockLoading.value = false;
    }
};

const handleSale = async () => {
    try {
        if (!isFormValid.value) {
            Swal.fire('Fix Form Errors', 'Please correct the highlighted fields before submitting.', 'warning');
            return;
        }

        submitting.value = true;
        const endpoint = saleType.value === 'cash' ? '/sales/cash' : '/sales/credit';
        const payload = {
            ...formData,
            nationalId: formData.nationalId?.trim().toUpperCase(),
            tonnage: Number(formData.tonnage),
        };
        const response = await api.post(endpoint, payload);

        if (response.data.status === 'success') {
            Swal.fire('Success', 'Sale recorded!', 'success');
            showModal.value = false;
            resetForm();
            fetchData();
        }
    } catch (err) {
        Swal.fire('Error', err.response?.data?.message || 'Transaction failed', 'error');
    } finally {
        submitting.value = false;
    }
};

const resetForm = () => {
    Object.assign(formData, {
        produceName: '', tonnage: null, buyersName: '',
        nationalId: '', contact: '', location: '', dueDate: ''
    });
    stockKgAvailable.value = null;
    stockMessage.value = '';
    sellingPricePerKg.value = null;
};

watch(() => formData.produceName, () => {
    // keep the UX responsive without spamming requests
    fetchAvailableStock();
});

onMounted(fetchData);
</script>

<template>
    <div class="container-fluid kgl-ledger p-2">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bold mb-0">Sales Records</h2>
            <div v-if="!isDirector" class="btn-group btn-group-sm shadow-sm">
                <button class="btn btn-sm btn-success px-3 kgl-action-btn" @click="saleType = 'cash'; showModal = true">
                    <i class="fa-solid fa-money-bill-1 me-1 kgl-icon-sm"></i>Cash Sale
                </button>
                <button class="btn btn-sm btn-warning px-3 text-dark fw-bold kgl-action-btn" @click="saleType = 'credit'; showModal = true">
                    <i class="fa-solid fa-handshake me-1 kgl-icon-sm"></i>Credit Sale
                </button>
            </div>
        </div>

        <div v-if="loading" class="text-center my-2 py-3">
            <div class="spinner-border spinner-border-sm text-primary"></div>
        </div>

        <template v-else>
            <div class="card border-0 shadow-sm p-2 mb-4">
                <div class="card-header bg-white py-2 border-0">
                    <h5 class="mb-0 fw-bold text-success small text-uppercase">Cash Sales</h5>
                </div>
                <div class="table-responsive">
                    <table class="table table-sm table-hover align-middle mb-0 kgl-compact-table">
                        <thead class="bg-light">
                            <tr v-if="isDirector">
                                <th class="px-3 small text-uppercase">Branch</th>
                                <th class="px-3 small text-uppercase">Total Revenue</th>
                                <th class="px-3 small text-uppercase">Total Tonnage</th>
                            </tr>
                            <tr v-else>
                                <th class="px-3 small text-uppercase">Date</th>
                                <th class="px-3 small text-uppercase">Buyer</th>
                                <th class="px-3 small text-uppercase">Produce</th>
                                <th class="px-3 small text-uppercase">Qty (kg)</th>
                                <th class="px-3 small text-uppercase">Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            <template v-if="isDirector">
                                <tr v-for="item in cashSales" :key="item._id">
                                    <td class="px-3 text-sm fw-bold align-middle">{{ item._id }}</td>
                                    <td class="px-3 fw-bold text-success align-middle">{{ item.totalRevenue.toLocaleString() }} UGX</td>
                                    <td class="px-3 text-sm align-middle">{{ item.totalTonnage.toLocaleString() }} kg</td>
                                </tr>
                            </template>
                            <template v-else>
                                <tr v-for="sale in cashSales" :key="sale._id">
                                    <td class="px-3 text-sm text-muted align-middle">{{ new Date(sale.date).toLocaleDateString() }}</td>
                                    <td class="px-3 fw-bold align-middle">{{ sale.buyersName }}</td>
                                    <td class="px-3 align-middle"><span class="badge bg-primary-subtle text-primary text-xs">{{ sale.produceName }}</span></td>
                                    <td class="px-3 align-middle">{{ sale.tonnage.toLocaleString() }} kg</td>
                                    <td class="px-3 fw-bold text-success align-middle">{{ sale.amountPaid.toLocaleString() }} UGX</td>
                                </tr>
                            </template>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card border-0 shadow-sm p-2 mb-4">
                <div class="card-header bg-white py-2 border-0">
                    <h5 class="mb-0 fw-bold text-warning small text-uppercase">Credit Sales</h5>
                </div>
                <div class="table-responsive">
                    <table class="table table-sm table-hover align-middle mb-0 kgl-compact-table">
                        <thead class="bg-light">
                            <tr v-if="isDirector">
                                <th class="px-3 small text-uppercase">Branch</th>
                                <th class="px-3 small text-uppercase">Total Owed</th>
                                <th class="px-3 small text-uppercase">Total Tonnage</th>
                            </tr>
                            <tr v-else>
                                <th class="px-3 small text-uppercase">Due Date</th>
                                <th class="px-3 small text-uppercase">Buyer</th>
                                <th class="px-3 small text-uppercase">Produce</th>
                                <th class="px-3 small text-uppercase">Amount Due</th>
                            </tr>
                        </thead>
                        <tbody>
                            <template v-if="isDirector">
                                <tr v-for="item in creditSales" :key="item._id">
                                    <td class="px-3 text-sm fw-bold align-middle">{{ item._id }}</td>
                                    <td class="px-3 fw-bold text-danger align-middle">{{ item.totalOwed.toLocaleString() }} UGX</td>
                                    <td class="px-3 text-sm align-middle">{{ item.totalTonnage.toLocaleString() }} kg</td>
                                </tr>
                            </template>
                            <template v-else>
                                <tr v-for="sale in creditSales" :key="sale._id">
                                    <td class="px-3 text-sm text-muted align-middle">{{ new Date(sale.dueDate).toLocaleDateString() }}</td>
                                    <td class="px-3 fw-bold align-middle">{{ sale.buyersName }}</td>
                                    <td class="px-3 align-middle"><span class="badge bg-warning-subtle text-dark text-xs">{{ sale.produceName }}</span></td>
                                    <td class="px-3 fw-bold align-middle">{{ sale.amountDue.toLocaleString() }} UGX</td>
                                </tr>
                            </template>
                        </tbody>
                    </table>
                </div>
            </div>
        </template>

        <div v-if="showModal" class="kgl-modal-overlay" @click.self="showModal = false">
            <div class="kgl-modal-content card shadow border-0">
                <div class="card-header bg-white d-flex justify-content-between align-items-center py-2 border-0">
                    <h5 class="mb-0 fw-bold">New {{ saleType === 'cash' ? 'Cash' : 'Credit' }} Sale</h5>
                    <button class="btn-close btn-sm" @click="showModal = false"></button>
                </div>
                <div class="kgl-modal-body p-3 pt-0">
                    <form @submit.prevent="handleSale" class="row g-3">
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
                            <label class="form-label small fw-bold">Quantity (kg)</label>
                            <input v-model.number="formData.tonnage" type="number" class="form-control form-control-sm bg-light"
                                :class="{ 'is-invalid': errors.tonnage }">
                            <div class="invalid-feedback">{{ errors.tonnage }}</div>
                            <div class="form-text text-muted small" v-if="stockLoading">Checking stock...</div>
                            <div class="form-text small" v-else-if="stockMessage">{{ stockMessage }}</div>
                        </div>
                        <div class="col-12" v-if="amountPaidDisplay != null">
                            <label class="form-label small fw-bold">Amount buyer will pay</label>
                            <div class="form-control form-control-sm bg-light fw-bold text-success">
                                {{ amountPaidDisplay.toLocaleString() }} UGX
                            </div>
                            <div class="form-text text-muted small">Based on current selling price; final amount may vary with FIFO.</div>
                        </div>
                        <div class="col-12">
                            <label class="form-label small fw-bold">Buyer's Name</label>
                            <input v-model="formData.buyersName" type="text" class="form-control form-control-sm bg-light"
                                :class="{ 'is-invalid': errors.buyersName }">
                            <div class="invalid-feedback">{{ errors.buyersName }}</div>
                        </div>

                        <template v-if="saleType === 'credit'">
                            <div class="col-md-6">
                                <label class="form-label small fw-bold">NIN</label>
                                <input v-model="formData.nationalId" type="text" class="form-control form-control-sm bg-light"
                                    :class="{ 'is-invalid': errors.nationalId }" placeholder="e.g. CM123456789012">
                                <div class="invalid-feedback">{{ errors.nationalId }}</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-bold">Due Date</label>
                                <input v-model="formData.dueDate" type="date" class="form-control form-control-sm bg-light"
                                    :class="{ 'is-invalid': errors.dueDate }">
                                <div class="invalid-feedback">{{ errors.dueDate }}</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-bold">Location</label>
                                <input v-model="formData.location" type="text" class="form-control form-control-sm bg-light"
                                    :class="{ 'is-invalid': errors.location }">
                                <div class="invalid-feedback">{{ errors.location }}</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-bold">Contact</label>
                                <input v-model="formData.contact" type="text" class="form-control form-control-sm bg-light"
                                    :class="{ 'is-invalid': errors.contact }" placeholder="e.g. 0700000000">
                                <div class="invalid-feedback">{{ errors.contact }}</div>
                            </div>
                            <div class="col-12">
                                <label class="form-label small fw-bold">Date of Dispatch</label>
                                <input :value="new Date().toLocaleDateString()" type="text" class="form-control form-control-sm bg-light" disabled>
                                <div class="form-text text-muted small">Saved as <strong>dispatchDate</strong> in the backend.</div>
                            </div>
                        </template>

                        <div class="col-12 text-end mt-2">
                            <button type="button" class="btn btn-sm btn-light me-1 kgl-action-btn" @click="showModal = false">Cancel</button>
                            <button type="submit" class="btn btn-sm px-3 kgl-action-btn"
                                :class="saleType === 'cash' ? 'btn-success' : 'btn-warning'" :disabled="submitting || !isFormValid">
                                {{ submitting ? 'Processing...' : 'Complete Sale' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.kgl-ledger .text-xs {
    font-size: 0.75rem;
}

.kgl-ledger :deep(.kgl-compact-table) {
    font-size: 0.875rem;
}

.kgl-icon-sm {
    font-size: 0.875rem;
    display: inline-block;
    text-align: center;
}

.kgl-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1050;
}

.kgl-modal-content {
    width: 95%;
    max-width: 520px;
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
</style>