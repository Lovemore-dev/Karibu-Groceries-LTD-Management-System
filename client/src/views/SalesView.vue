<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '@/services/api';
import Swal from 'sweetalert2';

// --- State ---
const cashSales = ref([]);
const creditSales = ref([]);
const loading = ref(true);
const submitting = ref(false);
const showModal = ref(false);
const saleType = ref('cash');
const userRole = ref('');

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

// --- Fetch Only Sales ---
const fetchData = async () => {
    try {
        loading.value = true;
        // Only calling the sales endpoint to avoid inventory route errors
        const response = await api.get('/sales');

        userRole.value = response.data.role;

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

const handleSale = async () => {
    try {
        submitting.value = true;
        const endpoint = saleType.value === 'cash' ? '/sales/cash' : '/sales/credit';
        const response = await api.post(endpoint, { ...formData });

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
};

onMounted(fetchData);
</script>

<template>
    <div class="container-fluid py-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bold">Sales Records</h2>
            <div v-if="userRole !== 'Director'" class="btn-group shadow-sm rounded-pill overflow-hidden">
                <button class="btn btn-success px-4" @click="saleType = 'cash'; showModal = true">
                    <i class="fa-solid fa-money-bill-1 me-2"></i>Cash Sale
                </button>
                <button class="btn btn-warning px-4 text-dark fw-bold" @click="saleType = 'credit'; showModal = true">
                    <i class="fa-solid fa-handshake me-2"></i>Credit Sale
                </button>
            </div>
        </div>

        <div v-if="loading" class="text-center my-5">
            <div class="spinner-border text-primary"></div>
        </div>

        <template v-else>
            <div class="card border-0 shadow-sm rounded-4 mb-4">
                <div class="card-header bg-white py-3 border-0">
                    <h5 class="mb-0 fw-bold text-success">Cash Sales</h5>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="bg-light">
                            <tr v-if="userRole === 'Director'">
                                <th>Branch</th>
                                <th>Total Revenue</th>
                                <th>Total Tonnage</th>
                            </tr>
                            <tr v-else>
                                <th>Date</th>
                                <th>Buyer</th>
                                <th>Produce</th>
                                <th>Qty (kg)</th>
                                <th>Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            <template v-if="userRole === 'Director'">
                                <tr v-for="item in cashSales" :key="item._id">
                                    <td>{{ item._id }}</td>
                                    <td class="fw-bold text-success">{{ item.totalRevenue.toLocaleString() }} UGX</td>
                                    <td>{{ item.totalTonnage.toLocaleString() }} kg</td>
                                </tr>
                            </template>
                            <template v-else>
                                <tr v-for="sale in cashSales" :key="sale._id">
                                    <td>{{ new Date(sale.date).toLocaleDateString() }}</td>
                                    <td>{{ sale.buyersName }}</td>
                                    <td><span class="badge bg-primary-subtle text-primary">{{ sale.produceName }}</span>
                                    </td>
                                    <td>{{ sale.tonnage.toLocaleString() }} kg</td>
                                    <td class="fw-bold text-success">{{ sale.amountPaid.toLocaleString() }} UGX</td>
                                </tr>
                            </template>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card border-0 shadow-sm rounded-4">
                <div class="card-header bg-white py-3 border-0">
                    <h5 class="mb-0 fw-bold text-warning">Credit Sales</h5>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="bg-light">
                            <tr v-if="userRole === 'Director'">
                                <th>Branch</th>
                                <th>Total Owed</th>
                                <th>Total Tonnage</th>
                            </tr>
                            <tr v-else>
                                <th>Due Date</th>
                                <th>Buyer</th>
                                <th>Produce</th>
                                <th>Amount Due</th>
                            </tr>
                        </thead>
                        <tbody>
                            <template v-if="userRole === 'Director'">
                                <tr v-for="item in creditSales" :key="item._id">
                                    <td>{{ item._id }}</td>
                                    <td class="fw-bold text-danger">{{ item.totalOwed.toLocaleString() }} UGX</td>
                                    <td>{{ item.totalTonnage.toLocaleString() }} kg</td>
                                </tr>
                            </template>
                            <template v-else>
                                <tr v-for="sale in creditSales" :key="sale._id">
                                    <td>{{ new Date(sale.dueDate).toLocaleDateString() }}</td>
                                    <td>{{ sale.buyersName }}</td>
                                    <td><span class="badge bg-warning-subtle text-dark">{{ sale.produceName }}</span>
                                    </td>
                                    <td class="fw-bold">{{ sale.amountDue.toLocaleString() }} UGX</td>
                                </tr>
                            </template>
                        </tbody>
                    </table>
                </div>
            </div>
        </template>

        <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
            <div class="modal-content-custom card shadow-lg p-4 border-0">
                <h4 class="fw-bold mb-4">New {{ saleType === 'cash' ? 'Cash' : 'Credit' }} Sale</h4>
                <form @submit.prevent="handleSale" class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label small fw-bold">Produce Name</label>
                        <input v-model="formData.produceName" type="text" class="form-control bg-light"
                            placeholder="e.g. Beans">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small fw-bold">Quantity (kg)</label>
                        <input v-model.number="formData.tonnage" type="number" class="form-control bg-light">
                    </div>
                    <div class="col-12">
                        <label class="form-label small fw-bold">Buyer's Name</label>
                        <input v-model="formData.buyersName" type="text" class="form-control bg-light">
                    </div>

                    <template v-if="saleType === 'credit'">
                        <div class="col-md-6">
                            <label class="form-label small fw-bold">NIN</label>
                            <input v-model="formData.nationalId" type="text" class="form-control bg-light">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small fw-bold">Due Date</label>
                            <input v-model="formData.dueDate" type="date" class="form-control bg-light">
                        </div>
                        <div class="col-md-6">
                            <label for="form-label small fw-bold">Location</label>
                            <input v-model="formData.location" type="text" class="form-control bg-light">
                        </div>
                    </template>

                    <div class="col-12 text-end mt-4">
                        <button type="button" class="btn btn-light me-2 rounded-pill"
                            @click="showModal = false">Cancel</button>
                        <button type="submit" class="btn px-4 rounded-pill"
                            :class="saleType === 'cash' ? 'btn-success' : 'btn-warning'" :disabled="submitting">
                            {{ submitting ? 'Processing...' : 'Complete Sale' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1050;
}

.modal-content-custom {
    width: 95%;
    max-width: 550px;
    border-radius: 20px;
}

.rounded-4 {
    border-radius: 1rem !important;
}
</style>