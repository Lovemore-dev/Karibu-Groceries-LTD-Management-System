<template>
    <div class="dashboard-page kgl-ledger p-2">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="page-title mb-0">
                <span v-if="isDirector">Executive Overview</span>
                <span v-else-if="isManager">Branch Operations</span>
                <span v-else>Your Sales Summary</span>
            </h2>
            <button v-if="!isDirector" class="btn btn-sm btn-success kgl-action-btn" @click="router.push('/admin/sales')">
                <i class="fa-solid fa-plus me-1 kgl-icon-sm"></i>New Sale
            </button>
        </div>

        <div class="row g-3 mb-4">
            <div class="col-12 col-sm-6 col-xl-3">
                <div class="kgl-stat-card shadow-sm">
                    <div class="kgl-stat-icon bg-success-light">
                        <i class="fa-solid fa-layer-group kgl-icon-sm"></i>
                    </div>
                    <div class="kgl-stat-content">
                        <span class="kgl-stat-label">Active Batches</span>
                        <h3 class="kgl-stat-value mb-0">{{ procurements.length }}</h3>
                    </div>
                </div>
            </div>

            <div v-if="isDirector" class="col-12 col-sm-6 col-xl-3">
                <div class="kgl-stat-card shadow-sm">
                    <div class="kgl-stat-icon bg-primary-light">
                        <i class="fa-solid fa-money-bill-trend-up kgl-icon-sm"></i>
                    </div>
                    <div class="kgl-stat-content">
                        <span class="kgl-stat-label">Total Asset Value</span>
                        <h3 class="kgl-stat-value mb-0">{{ totalAssetValue.toLocaleString() }} UGX</h3>
                    </div>
                </div>
            </div>

            <div v-if="isDirector" class="col-12 col-sm-6 col-xl-3">
                <div class="kgl-stat-card shadow-sm">
                    <div class="kgl-stat-icon bg-success-light">
                        <i class="fa-solid fa-sack-dollar kgl-icon-sm"></i>
                    </div>
                    <div class="kgl-stat-content">
                        <span class="kgl-stat-label">Total Revenue</span>
                        <h3 class="kgl-stat-value mb-0">{{ directorRevenue.toLocaleString() }} UGX</h3>
                    </div>
                </div>
            </div>

            <div v-if="isDirector" class="col-12 col-sm-6 col-xl-3">
                <div class="kgl-stat-card shadow-sm kgl-stat-card-danger">
                    <div class="kgl-stat-icon bg-danger-light text-danger">
                        <i class="fa-solid fa-clock-rotate-left kgl-icon-sm"></i>
                    </div>
                    <div class="kgl-stat-content">
                        <span class="kgl-stat-label">Outstanding Credit</span>
                        <h3 class="kgl-stat-value text-danger mb-0">{{ directorOutstandingCredit.toLocaleString() }} UGX</h3>
                    </div>
                </div>
            </div>

            <div v-else class="col-12 col-sm-6 col-xl-3">
                <div class="kgl-stat-card shadow-sm kgl-stat-card-danger">
                    <div class="kgl-stat-icon bg-danger-light text-danger">
                        <i class="fa-solid fa-triangle-exclamation kgl-icon-sm"></i>
                    </div>
                    <div class="kgl-stat-content">
                        <span class="kgl-stat-label">Low Stock</span>
                        <h3 class="kgl-stat-value text-danger mb-0">{{ lowStockCount }} Items</h3>
                    </div>
                </div>
            </div>
        </div>
        <!-- Director: branch-level aggregation of procurement + sales -->
        <div v-if="isDirector" class="row g-3">
            <div class="col-12">
                <div class="card border-0 shadow-sm p-2 mb-4">
                    <div class="card-header bg-white py-2">
                        <h5 class="mb-0 small text-uppercase">Branch Performance Overview</h5>
                        <small class="text-muted text-xs">Aggregated procurement and sales across all branches.</small>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-sm table-hover align-middle mb-0 kgl-compact-table">
                            <thead class="bg-light">
                                <tr>
                                    <th class="px-3 small text-uppercase">Branch</th>
                                    <th class="px-3 small text-uppercase">Tonnage Procured</th>
                                    <th class="px-3 small text-uppercase">Investment (UGX)</th>
                                    <th class="px-3 small text-uppercase">Cash Revenue (UGX)</th>
                                    <th class="px-3 small text-uppercase">Credit Owed (UGX)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="row in directorBranchPerformance" :key="row.branch">
                                    <td class="px-3 fw-bold text-sm align-middle">{{ row.branch }}</td>
                                    <td class="px-3 text-sm align-middle">{{ row.totalTonnageBought.toLocaleString() }} kg</td>
                                    <td class="px-3 fw-bold align-middle">{{ row.totalInvestment.toLocaleString() }} UGX</td>
                                    <td class="px-3 fw-bold text-success align-middle">{{ row.cashRevenue.toLocaleString() }} UGX</td>
                                    <td class="px-3 fw-bold text-danger align-middle">{{ row.creditOwed.toLocaleString() }} UGX</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Manager: branch procurements + branch sales records -->
        <div v-if="isManager" class="row g-3">
            <div class="col-12 col-lg-6">
                <div class="card border-0 shadow-sm p-2 mb-4">
                    <div class="card-header bg-white py-2">
                        <h5 class="mb-0 small text-uppercase">Recent Produce Intake</h5>
                        <small class="text-muted text-xs">Latest procurements recorded at this branch.</small>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-sm table-hover align-middle mb-0 kgl-compact-table">
                                <thead class="bg-light">
                                    <tr>
                                        <th class="px-3 small text-uppercase">Produce</th>
                                        <th class="px-3 small text-uppercase">Dealer</th>
                                        <th class="px-3 small text-uppercase">Tonnage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="item in procurements.slice(0, 5)" :key="item._id">
                                        <td class="px-3 fw-bold align-middle">{{ item.produceName }}</td>
                                        <td class="px-3 text-sm align-middle">{{ item.dealerName }}</td>
                                        <td class="px-3 align-middle">{{ item.tonnage.toLocaleString() }} kg</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-12 col-lg-6">
                <div class="card border-0 shadow-sm p-2 mb-4">
                    <div class="card-header bg-white py-2">
                        <h5 class="mb-0 small text-uppercase">Recent Branch Sales</h5>
                        <small class="text-muted text-xs">Cash and credit sales at your branch.</small>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-sm table-hover align-middle mb-0 kgl-compact-table">
                                <thead class="bg-light">
                                    <tr>
                                        <th class="px-3 small text-uppercase">Date</th>
                                        <th class="px-3 small text-uppercase">Buyer</th>
                                        <th class="px-3 small text-uppercase">Produce</th>
                                        <th class="px-3 small text-uppercase">Qty (kg)</th>
                                        <th class="px-3 small text-uppercase">Total (UGX)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="sale in branchCashSales.slice(0, 5)" :key="sale._id">
                                        <td class="px-3 text-sm text-muted align-middle">{{ new Date(sale.date).toLocaleDateString() }}</td>
                                        <td class="px-3 text-sm align-middle">{{ sale.buyersName }}</td>
                                        <td class="px-3 text-sm align-middle">{{ sale.produceName }}</td>
                                        <td class="px-3 align-middle">{{ sale.tonnage.toLocaleString() }} kg</td>
                                        <td class="px-3 fw-bold text-success align-middle">{{ sale.amountPaid.toLocaleString() }} UGX</td>
                                    </tr>
                                    <tr v-for="sale in branchCreditSales.slice(0, 5)" :key="sale._id + '-credit'">
                                        <td class="px-3 text-sm text-muted align-middle">{{ new Date(sale.dueDate).toLocaleDateString() }}</td>
                                        <td class="px-3 text-sm align-middle">{{ sale.buyersName }}</td>
                                        <td class="px-3 text-sm align-middle">{{ sale.produceName }}</td>
                                        <td class="px-3 align-middle">{{ sale.tonnage.toLocaleString() }} kg</td>
                                        <td class="px-3 fw-bold text-warning align-middle">{{ sale.amountDue.toLocaleString() }} UGX</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Sales Agent: personal sales records only -->
        <div v-if="isSalesAgent" class="row g-3">
            <div class="col-12 col-lg-6">
                <div class="card border-0 shadow-sm p-2 mb-4">
                    <div class="card-header bg-white py-2">
                        <h5 class="mb-0 small text-uppercase">Your Cash Sales</h5>
                        <small class="text-muted text-xs">Cash transactions recorded under your name.</small>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-sm table-hover align-middle mb-0 kgl-compact-table">
                            <thead class="bg-light">
                                <tr>
                                    <th class="px-3 small text-uppercase">Date</th>
                                    <th class="px-3 small text-uppercase">Produce</th>
                                    <th class="px-3 small text-uppercase">Qty (kg)</th>
                                    <th class="px-3 small text-uppercase">Amount (UGX)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="sale in myCashSales.slice(0, 8)" :key="sale._id">
                                    <td class="px-3 text-sm text-muted align-middle">{{ new Date(sale.date).toLocaleDateString() }}</td>
                                    <td class="px-3 text-sm align-middle">{{ sale.produceName }}</td>
                                    <td class="px-3 align-middle">{{ sale.tonnage.toLocaleString() }} kg</td>
                                    <td class="px-3 fw-bold text-success align-middle">{{ sale.amountPaid.toLocaleString() }} UGX</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="col-12 col-lg-6">
                <div class="card border-0 shadow-sm p-2 mb-4">
                    <div class="card-header bg-white py-2">
                        <h5 class="mb-0 small text-uppercase">Your Credit Sales</h5>
                        <small class="text-muted text-xs">Credit transactions you have dispatched.</small>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-sm table-hover align-middle mb-0 kgl-compact-table">
                            <thead class="bg-light">
                                <tr>
                                    <th class="px-3 small text-uppercase">Due Date</th>
                                    <th class="px-3 small text-uppercase">Produce</th>
                                    <th class="px-3 small text-uppercase">Qty (kg)</th>
                                    <th class="px-3 small text-uppercase">Amount Due (UGX)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="sale in myCreditSales.slice(0, 8)" :key="sale._id">
                                    <td class="px-3 text-sm text-muted align-middle">{{ new Date(sale.dueDate).toLocaleDateString() }}</td>
                                    <td class="px-3 text-sm align-middle">{{ sale.produceName }}</td>
                                    <td class="px-3 align-middle">{{ sale.tonnage.toLocaleString() }} kg</td>
                                    <td class="px-3 fw-bold text-warning align-middle">{{ sale.amountDue.toLocaleString() }} UGX</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';

const router = useRouter();
const authStore = useAuthStore();

const procurements = ref([]);
const stats = ref([]);
const directorTotals = ref(null);
const lowStock = 500;

// Sales data buckets
const branchCashSales = ref([]);
const branchCreditSales = ref([]);
const myCashSales = ref([]);
const myCreditSales = ref([]);
const directorSalesAgg = ref({ cash: [], credit: [] });

const userRole = computed(() => authStore.user?.role || '');
const isDirector = computed(() => userRole.value === 'Director');
const isManager = computed(() => userRole.value === 'Manager');
const isSalesAgent = computed(() => userRole.value === 'Sales Agent');

const fetchData = async () => {
    try {
        const calls = [api.get('/procurements')];

        if (isDirector.value) {
            calls.push(api.get('/user/director/totals'));
            calls.push(api.get('/sales'));
        } else {
            // Manager or Sales Agent: need branch-level sales only
            calls.push(api.get('/sales'));
        }

        const [procRes, secondRes, thirdRes] = await Promise.all(calls);

        procurements.value = procRes.data.data;
        stats.value = procRes.data.stats || [];

        if (isDirector.value) {
            const totalsRes = secondRes;
            const salesRes = thirdRes;
            directorTotals.value = totalsRes?.data?.data || null;
            directorSalesAgg.value = {
                cash: salesRes?.data?.cashAggregations || [],
                credit: salesRes?.data?.creditAggregations || [],
            };
        } else {
            directorTotals.value = null;
            const salesRes = secondRes;
            const branchCash = salesRes?.data?.cashSales || [];
            const branchCredit = salesRes?.data?.creditSales || [];

            if (isManager.value) {
                branchCashSales.value = branchCash;
                branchCreditSales.value = branchCredit;
            } else if (isSalesAgent.value) {
                const fullName = authStore.user?.fullName;
                myCashSales.value = fullName ? branchCash.filter((s) => s.saleAgent === fullName) : [];
                myCreditSales.value = fullName ? branchCredit.filter((s) => s.saleAgent === fullName) : [];
            }
        }
    } catch (err) {
        console.error('Failed to load dashboard data', err);
    }
};

const totalAssetValue = computed(() => {
    return stats.value.reduce((acc, curr) => acc + (curr.currentAssetValue || 0), 0);
});

const directorRevenue = computed(() => directorTotals.value?.revenue || 0);
const directorOutstandingCredit = computed(() => directorTotals.value?.outstandingCredit || 0);

const lowStockCount = computed(() => {
    return procurements.value.filter((p) => (p.currentInventory ?? 0) < lowStock).length;
});

const directorBranchPerformance = computed(() => {
    if (!isDirector.value) return [];

    const cashByBranch = new Map();
    const creditByBranch = new Map();

    (directorSalesAgg.value.cash || []).forEach((row) => {
        if (row && row._id) cashByBranch.set(row._id, row);
    });

    (directorSalesAgg.value.credit || []).forEach((row) => {
        if (row && row._id) creditByBranch.set(row._id, row);
    });

    return (stats.value || []).map((s) => {
        const branch = s._id;
        const cash = cashByBranch.get(branch);
        const credit = creditByBranch.get(branch);

        return {
            branch,
            totalTonnageBought: s.totalTonnageBought || 0,
            totalInvestment: s.totalInvestment || 0,
            cashRevenue: cash?.totalRevenue || 0,
            creditOwed: credit?.totalOwed || 0,
        };
    });
});

onMounted(fetchData);
</script>

<style scoped>
.kgl-ledger .page-title {
    color: #2c3e50;
    font-weight: 700;
}

.kgl-stat-card {
    background: #fff;
    border-radius: 6px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-left: 4px solid #198754;
}

.kgl-stat-card-danger {
    border-left-color: #dc3545;
}

.kgl-stat-icon {
    width: 32px;
    height: 32px;
    min-width: 32px;
    border-radius: 6px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.kgl-icon-sm {
    font-size: 0.875rem;
}

.kgl-stat-icon .kgl-icon-sm {
    font-size: 0.875rem;
}

.bg-primary-light {
    background: #e7f1ff;
    color: #0d6efd;
}

.bg-success-light {
    background: #eafaf1;
    color: #198754;
}

.bg-danger-light {
    background: #fdf2f2;
}

.kgl-stat-label {
    color: #6c757d;
    font-size: 0.6875rem;
    text-transform: uppercase;
}

.kgl-stat-value {
    font-size: 0.9375rem;
    color: #2c3e50;
}

.kgl-ledger :deep(.kgl-compact-table) {
    font-size: 0.875rem;
}
</style>