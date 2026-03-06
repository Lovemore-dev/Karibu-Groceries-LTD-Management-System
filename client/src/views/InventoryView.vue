<template>
    <div class="container-fluid py-4">
        <h2 class="fw-bold mb-4">Branch Inventory Status</h2>

        <div class="card border-0 shadow-sm">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="bg-light">
                        <tr>
                            <th class="ps-4">Branch</th>
                            <th>Available Stock (kg)</th>
                            <th>Asset Value (UGX)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in filteredStats" :key="item._id">
                            <td class="ps-4 fw-bold text-uppercase">{{ item._id }}</td>
                            <td>{{ (item.currentTonnageInStore || 0).toLocaleString() }}</td>
                            <td class="fw-bold text-primary">{{ (item.currentAssetValue || 0).toLocaleString() }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth'; 
import api from '@/services/api';

const authStore = useAuthStore();
const stats = ref([]);

const filteredStats = computed(() => {
    const user = authStore.user;
    // Safety check: if user isn't loaded yet
    if (!user) return [];

    if (user.role === 'Director') return stats.value;
    return stats.value.filter(s => s._id === user.branch);
});

const fetchInventory = async () => {
    try {
        const response = await api.get('/procurements');
        stats.value = response.data.stats || [];
    } catch (err) {
        console.error("Failed to fetch inventory", err);
    }
};

onMounted(fetchInventory);
</script>