<script setup>
//  The script goes here

</script>

<template>
    <div class="dashboard-page">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="page-title">Business Overview</h2>
            <button class="btn btn-success">
                <i class="fa-solid fa-plus me-2"></i>New Sale
            </button>
        </div>

        <div class="row g-4 mb-4">
            <div class="col-12 col-sm-6 col-xl-3">
                <div class="stat-card shadow-sm">
                    <div class="icon-box bg-primary-light">
                        <i class="fa-solid fa-money-bill-trend-up"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-label">Daily Sales</span>
                        <h3 class="stat-value">UGX 450k</h3>
                    </div>
                </div>
            </div>

            <div class="col-12 col-sm-6 col-xl-3">
                <div class="stat-card shadow-sm">
                    <div class="icon-box bg-success-light">
                        <i class="fa-solid fa-layer-group"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-label">Active Batches</span>
                        <h3 class="stat-value">24</h3>
                    </div>
                </div>
            </div>

            <div class="col-12 col-sm-6 col-xl-3">
                <div class="stat-card shadow-sm border-danger-left">
                    <div class="icon-box bg-danger-light text-danger">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-label">Low Stock</span>
                        <h3 class="stat-value text-danger">3 Items</h3>
                    </div>
                </div>
            </div>

            <div class="col-12 col-sm-6 col-xl-3">
                <div class="stat-card shadow-sm">
                    <div class="icon-box bg-info-light">
                        <i class="fa-solid fa-user-clock"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-label">Staff Active</span>
                        <h3 class="stat-value">6</h3>
                    </div>
                </div>
            </div>
        </div>

        <div class="row g-4">
            <div class="col-12 col-lg-8">
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-white py-3">
                        <h5 class="mb-0">Recent Produce Intake</h5>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover align-middle mb-0">
                                <thead class="bg-light">
                                    <tr>
                                        <th>Item</th>
                                        <th>Supplier</th>
                                        <th>Weight</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Yellow Beans</td>
                                        <td>Mbarara Hub</td>
                                        <td>1,200 kg</td>
                                        <td><span class="badge bg-success-subtle text-success">Verified</span></td>
                                    </tr>
                                    <tr>
                                        <td>White Maize</td>
                                        <td>Gulu Wholesale</td>
                                        <td>850 kg</td>
                                        <td><span class="badge bg-warning-subtle text-warning">Pending</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-12 col-lg-4">
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-white py-3">
                        <h5 class="mb-0">Inventory Notifications</h5>
                    </div>
                    <div class="card-body">
                        <div class="notification-item pb-3 mb-3 border-bottom">
                            <small class="text-muted d-block">10 mins ago</small>
                            <strong>Soya Beans</strong> reached reorder point (50kg).
                        </div>
                        <div class="notification-item pb-3">
                            <small class="text-muted d-block">1 hour ago</small>
                            New delivery received from <strong>Western Farms</strong>.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.page-title {
    color: #2c3e50;
    font-weight: 700;
}

.stat-card {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 15px;
    border-left: 4px solid #198754;
}

.border-danger-left {
    border-left-color: #dc3545 !important;
}

.icon-box {
    width: 55px;
    height: 55px;
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 0.75rem;
}

/* Color variations */
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

.bg-info-light {
    background: #e1f5fe;
    color: #03a9f4;
}

.stat-label {
    color: #6c757d;
    font-size: 0.75rem;
    letter-spacing: 0.5px;
}

.stat-value {
    margin: 0;
    color: #2c3e50;
}

.card-header h5 {
    font-weight: 600;
    color: #495057;
}

.table thead th {
    font-size: 0.8rem;
    text-transform: uppercase;
    color: #adb5bd;
    font-weight: 600;
}
</style>