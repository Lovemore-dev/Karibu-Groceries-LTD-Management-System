<template>
    <div class="container-fluid kgl-ledger p-2">
        <h2 class="fw-bold mb-4">{{ isDirector ? 'Total Available Stock' : 'Branch Inventory Status' }}</h2>

        <!-- Director: total available stock per branch -->
        <div v-if="isDirector" class="card border-0 shadow-sm p-2 mb-4">
            <div class="card-header bg-white border-0 py-2">
                <h5 class="fw-bold text-dark mb-0 small text-uppercase">Total Available Stock per Branch</h5>
            </div>
            <div class="table-responsive">
                <table class="table table-sm table-hover align-middle mb-0 kgl-compact-table">
                    <thead class="bg-light">
                        <tr>
                            <th class="px-3 small text-uppercase">Branch</th>
                            <th class="px-3 small text-uppercase">Available Stock (kg)</th>
                            <th class="px-3 small text-uppercase">Asset Value (UGX)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in filteredStats" :key="item._id">
                            <td class="px-3 fw-bold text-uppercase text-sm align-middle">{{ item._id }}</td>
                            <td class="px-3 align-middle">{{ (item.currentTonnageInStore || 0).toLocaleString() }}</td>
                            <td class="px-3 fw-bold text-primary align-middle">{{ (item.currentAssetValue || 0).toLocaleString() }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Manager: stock levels by produce (current stock in inventory) -->
        <template v-if="!isDirector">
            <div v-if="stockByProduce.length > 0" class="card border-0 shadow-sm p-2 mb-4">
                <div class="card-header bg-white border-0 py-2">
                    <h5 class="fw-bold text-dark mb-0 small text-uppercase">Stock Levels by Produce</h5>
                </div>
                <div class="table-responsive">
                    <table class="table table-sm table-hover align-middle mb-0 kgl-compact-table">
                        <thead class="bg-light">
                            <tr>
                                <th class="px-3 small text-uppercase">Produce</th>
                                <th class="px-3 small text-uppercase">Current Stock (kg)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in stockByProduce" :key="row.produceName">
                                <td class="px-3 fw-bold align-middle">{{ row.produceName }}</td>
                                <td class="px-3 align-middle">{{ (row.currentStock || 0).toLocaleString() }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="card border-0 shadow-sm p-2 mb-4">
                <div class="card-header bg-white border-0 py-2">
                    <h5 class="fw-bold text-dark mb-0 small text-uppercase">Branch Summary</h5>
                </div>
                <div class="table-responsive">
                    <table class="table table-sm table-hover align-middle mb-0 kgl-compact-table">
                        <thead class="bg-light">
                            <tr>
                                <th class="px-3 small text-uppercase">Branch</th>
                                <th class="px-3 small text-uppercase">Available Stock (kg)</th>
                                <th class="px-3 small text-uppercase">Asset Value (UGX)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in filteredStats" :key="item._id">
                                <td class="px-3 fw-bold text-uppercase text-sm align-middle">{{ item._id }}</td>
                                <td class="px-3 align-middle">{{ (item.currentTonnageInStore || 0).toLocaleString() }}</td>
                                <td class="px-3 fw-bold text-primary align-middle">{{ (item.currentAssetValue || 0).toLocaleString() }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';

const authStore = useAuthStore();
const stats = ref([]);
const procurements = ref([]);

const isDirector = computed(() => authStore.user?.role === 'Director');

const filteredStats = computed(() => {
    const user = authStore.user;
    if (!user) return [];
    if (user.role === 'Director') return stats.value;
    return stats.value.filter(s => s._id === user.branch);
});

// Manager: aggregate current stock by produce name from procurement batches
const stockByProduce = computed(() => {
    const list = procurements.value;
    if (!list.length) return [];
    const map = new Map();
    list.forEach((p) => {
        const name = p.produceName;
        const inv = p.currentInventory ?? p.tonnage ?? 0;
        map.set(name, (map.get(name) || 0) + inv);
    });
    return Array.from(map.entries())
        .map(([produceName, currentStock]) => ({ produceName, currentStock }))
        .sort((a, b) => a.produceName.localeCompare(b.produceName));
});

const fetchInventory = async () => {
    try {
        const response = await api.get('/procurements');
        stats.value = response.data.stats || [];
        procurements.value = response.data.data || [];
    } catch (err) {
        console.error("Failed to fetch inventory", err);
    }
};

onMounted(fetchInventory);
</script>

<style scoped>
.kgl-ledger :deep(.kgl-compact-table) {
    font-size: 0.875rem;
}
</style>