<template>
    <div class="intelligence-container">
        <div v-if="loading" class="d-flex flex-column justify-content-center align-items-center py-5 min-vh-50">
            <div class="spinner-border text-emerald" role="status" style="width: 3rem; height: 3rem;"></div>
            <p class="mt-3 text-muted fw-bold">Calculating Business Intelligence...</p>
        </div>

        <div v-else>
            <div class="row g-4 mb-4">
                <div class="col-md-3" v-for="stat in kpiStats" :key="stat.title">
                    <div class="card stats-card border-0 shadow-sm rounded-4 p-3 h-100">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <p class="text-muted small text-uppercase mb-1 fw-bold">{{ stat.title }}</p>
                                <h3 class="fw-bold mb-0">{{ stat.value }}</h3>
                            </div>
                            <div :class="['icon-box p-2 rounded-3', stat.bgClass]">
                                <i :class="['fa-solid', stat.icon, stat.textClass]"></i>
                            </div>
                        </div>
                        <div class="mt-3">
                            <small class="text-success">
                                <i class="fa-solid fa-chart-line"></i> Live Data
                            </small>
                            <span class="text-muted small ms-1">from all branches</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row g-4">
                <div class="col-lg-8">
                    <div class="card border-0 shadow-sm rounded-4 p-4 h-100">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h5 class="fw-bold mb-0">Branch Stock Utilization</h5>
                            <button @click="fetchData" class="btn btn-light btn-sm text-muted">
                                <i class="fa-solid fa-rotate"></i> Refresh
                            </button>
                        </div>
                        <div class="table-responsive">
                            <table class="table table-hover align-middle">
                                <thead class="table-light">
                                    <tr>
                                        <th>Branch</th>
                                        <th>Inventory Status</th>
                                        <th>Stock Turned</th>
                                        <th>Revenue (UGX)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="branch in branchPerformance" :key="branch.name">
                                        <td><strong>{{ branch.name }}</strong></td>
                                        <td style="width: 30%;">
                                            <div class="progress progress-bar-glow"
                                                style="height: 10px; background-color: #e2e8f0;">
                                                <div class="progress-bar bg-emerald" role="progressbar"
                                                    :style="{ width: branch.usage + '%' }"></div>
                                            </div>
                                            <small class="text-muted mt-1 d-block">{{ branch.usage }}% Sold</small>
                                        </td>
                                        <td>
                                            <span class="fw-medium">{{ branch.tonnageSold.toLocaleString() }}</span>
                                            <small class="text-muted">/ {{ branch.totalTonnage.toLocaleString() }}
                                                kg</small>
                                        </td>
                                        <td class="text-success fw-bold">{{ branch.revenue.toLocaleString() }}</td>
                                    </tr>
                                    <tr v-if="branchPerformance.length === 0">
                                        <td colspan="4" class="text-center py-4 text-muted">No branch data available.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="col-lg-4">
                    <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-slate text-white">
                        <h5 class="fw-bold mb-4 text-emerald">Executive Insights</h5>

                        <div class="insight-item mb-4 pb-3 border-bottom border-secondary">
                            <small class="text-slate-light d-block text-uppercase small fw-bold mb-1">Stock
                                Health</small>
                            <div class="d-flex justify-content-between align-items-center">
                                <span>Items near stockout</span>
                                <span class="badge bg-danger">{{ lowStockCount }} Alerts</span>
                            </div>
                        </div>

                        <div class="insight-item mb-4 pb-3 border-bottom border-secondary">
                            <small class="text-slate-light d-block text-uppercase small fw-bold mb-1">Financial
                                Risk</small>
                            <div class="d-flex justify-content-between align-items-center">
                                <span>Credit Exposure</span>
                                <span class="text-warning fw-bold">{{ totalOwedDisplay }}</span>
                            </div>
                        </div>

                        <div class="insight-item mb-4">
                            <small
                                class="text-slate-light d-block text-uppercase small fw-bold mb-1">Performance</small>
                            <div class="d-flex justify-content-between align-items-center">
                                <span>System Efficiency</span>
                                <span class="text-emerald fw-bold">Optimal</span>
                            </div>
                        </div>

                        <div class="mt-auto pt-4">
                            <button class="btn btn-emerald w-100 py-3 rounded-3 fw-bold shadow-sm">
                                <i class="fa-solid fa-file-pdf me-2"></i> Export Monthly Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '@/services/api';

// Data State
const branchData = ref([]);
const salesStats = ref({ cash: [], credit: [] });
const loading = ref(true);

const fetchData = async () => {
    try {
        loading.value = true;
        // Fetch procurement and sales aggregations in parallel
        const [procRes, salesRes] = await Promise.all([
            api.get('/procurements'),
            api.get('/sales')
        ]);

        branchData.value = procRes.data.stats || [];
        salesStats.value = {
            cash: salesRes.data.cashAggregations || [],
            credit: salesRes.data.creditAggregations || []
        };
    } catch (err) {
        console.error("Intelligence Fetch Error", err);
    } finally {
        loading.value = false;
    }
};

// 1. KPI Calculations
const kpiStats = computed(() => {
    const totalRevenue = salesStats.value.cash.reduce((acc, b) => acc + (b.totalRevenue || 0), 0);
    const totalInvestment = branchData.value.reduce((acc, b) => acc + (b.totalInvestment || 0), 0);
    const totalOwed = salesStats.value.credit.reduce((acc, b) => acc + (b.totalOwed || 0), 0);

    return [
        { title: 'Total Revenue', value: totalRevenue.toLocaleString() + ' UGX', icon: 'fa-money-bill-trend-up', bgClass: 'bg-success-subtle', textClass: 'text-success' },
        { title: 'Investment', value: totalInvestment.toLocaleString() + ' UGX', icon: 'fa-hand-holding-dollar', bgClass: 'bg-primary-subtle', textClass: 'text-primary' },
        { title: 'Net Margin', value: (totalRevenue - totalInvestment).toLocaleString() + ' UGX', icon: 'fa-chart-line', bgClass: 'bg-info-subtle', textClass: 'text-info' },
        { title: 'Credit Owed', value: totalOwed.toLocaleString() + ' UGX', icon: 'fa-clock-rotate-left', bgClass: 'bg-danger-subtle', textClass: 'text-danger' },
    ];
});

// 2. Dynamic Branch Performance Mapping
const branchPerformance = computed(() => {
    return branchData.value.map(branch => {
        const sold = branch.totalTonnageBought - branch.currentTonnageInStore;
        const usage = branch.totalTonnageBought > 0
            ? Math.round((sold / branch.totalTonnageBought) * 100)
            : 0;

        const salesInfo = salesStats.value.cash.find(s => s._id === branch._id);

        return {
            name: branch._id,
            usage: usage,
            tonnageSold: sold,
            totalTonnage: branch.totalTonnageBought,
            revenue: salesInfo ? salesInfo.totalRevenue : 0
        };
    });
});

// 3. Insight Helpers
const lowStockCount = computed(() => {
    // Counts branches where inventory is below 20%
    return branchPerformance.value.filter(b => b.usage > 80).length;
});

const totalOwedDisplay = computed(() => {
    const total = salesStats.value.credit.reduce((acc, b) => acc + (b.totalOwed || 0), 0);
    return total.toLocaleString() + ' UGX';
});

onMounted(fetchData);
</script>

<style scoped>
/* Emerald & Slate Theme Variables */
.text-emerald {
    color: #10b981 !important;
}

.bg-emerald {
    background-color: #10b981 !important;
}

.btn-emerald {
    background-color: #10b981;
    color: white;
    border: none;
    transition: 0.3s;
}

.btn-emerald:hover {
    background-color: #059669;
    transform: translateY(-2px);
}

.bg-slate {
    background-color: #1e293b !important;
}

.text-slate-light {
    color: #94a3b8;
}

.stats-card {
    transition: transform 0.2s ease;
    border: 1px solid #f1f5f9;
}

.stats-card:hover {
    transform: translateY(-5px);
}

.icon-box {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.progress-bar-glow {
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
    border-radius: 10px;
    overflow: hidden;
}

.min-vh-50 {
    min-height: 50vh;
}
</style>