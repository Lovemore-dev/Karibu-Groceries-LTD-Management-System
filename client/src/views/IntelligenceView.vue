<template>
    <div class="intelligence-container kgl-ledger p-2">
        <div v-if="loading" class="d-flex flex-column justify-content-center align-items-center py-2 min-vh-50">
            <div class="spinner-border spinner-border-sm text-emerald" role="status"></div>
            <p class="mt-2 text-muted small fw-bold">Calculating Business Intelligence...</p>
        </div>

        <div v-else>
            <div class="row g-3 mb-4">
                <div class="col-md-3" v-for="stat in kpiStats" :key="stat.title">
                    <div class="card kgl-stats-card border-0 shadow-sm rounded p-2 h-100">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <p class="text-muted small text-uppercase mb-0 fw-bold">{{ stat.title }}</p>
                                <h3 class="fw-bold mb-0 small">{{ stat.value }}</h3>
                            </div>
                            <div :class="['kgl-bi-icon p-1 rounded', stat.bgClass]">
                                <i :class="['fa-solid', stat.icon, stat.textClass, 'kgl-icon-sm']"></i>
                            </div>
                        </div>
                        <div class="mt-1">
                            <small class="text-success small">Live Data</small>
                            <span class="text-muted small ms-1">from all branches</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row g-3">
                <div class="col-lg-8">
                    <div class="card border-0 shadow-sm rounded p-2 mb-4 h-100">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h5 class="fw-bold mb-0 small text-uppercase">Branch Stock Utilization</h5>
                            <button @click="fetchData" class="btn btn-sm btn-light text-muted kgl-action-btn">
                                <i class="fa-solid fa-rotate kgl-icon-sm"></i> Refresh
                            </button>
                        </div>
                        <div class="table-responsive">
                            <table class="table table-sm table-hover align-middle mb-0 kgl-compact-table">
                                <thead class="table-light">
                                    <tr>
                                        <th class="px-3 small text-uppercase">Branch</th>
                                        <th class="px-3 small text-uppercase">Inventory Status</th>
                                        <th class="px-3 small text-uppercase">Stock Turned</th>
                                        <th class="px-3 small text-uppercase">Revenue (UGX)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="branch in branchPerformance" :key="branch.name">
                                        <td class="px-3 fw-bold text-sm align-middle">{{ branch.name }}</td>
                                        <td class="px-3 kgl-progress-cell align-middle">
                                            <div class="progress kgl-progress-bar" style="height: 6px; background-color: #e2e8f0;">
                                                <div class="progress-bar bg-emerald" role="progressbar" :style="{ width: branch.usage + '%' }"></div>
                                            </div>
                                            <small class="text-muted small d-block">{{ branch.usage }}% Sold</small>
                                        </td>
                                        <td class="px-3 align-middle">
                                            <span class="fw-medium text-sm">{{ branch.tonnageSold.toLocaleString() }}</span>
                                            <small class="text-muted small">/ {{ branch.totalTonnage.toLocaleString() }} kg</small>
                                        </td>
                                        <td class="px-3 text-success fw-bold text-sm align-middle">{{ branch.revenue.toLocaleString() }}</td>
                                    </tr>
                                    <tr v-if="branchPerformance.length === 0">
                                        <td colspan="4" class="px-3 text-center py-2 text-muted small">No branch data available.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="col-lg-4">
                    <div class="card border-0 shadow-sm rounded p-2 h-100 bg-slate text-white">
                        <h5 class="fw-bold mb-2 text-emerald small text-uppercase">Executive Insights</h5>

                        <div class="kgl-insight-item mb-2 pb-2 border-bottom border-secondary">
                            <small class="text-slate-light d-block text-uppercase small fw-bold mb-0">Stock Health</small>
                            <div class="d-flex justify-content-between align-items-center small">
                                <span>Items near stockout</span>
                                <span class="badge bg-danger">{{ lowStockCount }} Alerts</span>
                            </div>
                        </div>

                        <div class="kgl-insight-item mb-2 pb-2 border-bottom border-secondary">
                            <small class="text-slate-light d-block text-uppercase small fw-bold mb-0">Financial Risk</small>
                            <div class="d-flex justify-content-between align-items-center small">
                                <span>Credit Exposure</span>
                                <span class="text-warning fw-bold">{{ totalOwedDisplay }}</span>
                            </div>
                        </div>

                        <div class="kgl-insight-item mb-2">
                            <small class="text-slate-light d-block text-uppercase small fw-bold mb-0">Performance</small>
                            <div class="d-flex justify-content-between align-items-center small">
                                <span>System Efficiency</span>
                                <span class="text-emerald fw-bold">Optimal</span>
                            </div>
                        </div>

                        <div class="mt-auto pt-2">
                            <button class="btn btn-sm btn-emerald w-100 py-2 rounded fw-bold kgl-action-btn">
                                <i class="fa-solid fa-file-pdf me-1 kgl-icon-sm"></i> Export Report
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
/* KGL namespaced: BI dashboard compact overrides */
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
}

.btn-emerald:hover {
    background-color: #059669;
}

.bg-slate {
    background-color: #1e293b !important;
}

.text-slate-light {
    color: #94a3b8;
}

.kgl-stats-card {
    border: 1px solid #f1f5f9;
}

.kgl-icon-sm {
    font-size: 0.875rem;
}

.kgl-bi-icon {
    width: 28px;
    height: 28px;
    min-width: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.kgl-bi-icon .kgl-icon-sm {
    font-size: 0.875rem;
}

.kgl-ledger :deep(.kgl-compact-table) {
    font-size: 0.875rem;
}

.kgl-progress-bar {
    border-radius: 4px;
    overflow: hidden;
}

.min-vh-50 {
    min-height: 40vh;
}
</style>