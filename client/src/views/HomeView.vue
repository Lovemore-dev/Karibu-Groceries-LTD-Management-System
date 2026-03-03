<template>
    <div class="landing-page">
        <header class="headerSection">
            <nav class="navbar navbar-expand-lg navbar-light bg-light navSection">
                <div class="container-fluid">
                    <router-link class="navbar-brand d-flex align-items-center" to="/">
                        <img src="/images/logo.png" alt="Karibu logo" height="60" class="me-2" />
                        <span>Karibu Groceries Limited</span>
                    </router-link>

                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>

                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav ms-auto">
                            <li class="nav-item"><a class="nav-link" href="#">About Us</a></li>
                            <li class="nav-item"><a class="nav-link" href="#">Contact</a></li>
                            <li class="nav-item">
                                <a href="mailto:" class="btn btn-secondary me-2">Request Access</a>
                            </li>
                            <li class="nav-item">
                                <router-link to="/login" class="btn btn-primary">Login</router-link>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        </header>

        <section class="heroSection">
            <div class="heroContent text-center">
                <h1>Streamlining Wholesale</h1>
                <h1>Produce Distribution</h1>
                <p>The official management portal for Karibu Groceries Limited</p>
                <div class="callButtons">
                    <router-link to="/login" class="btn btn-lg btn-success me-2">Log In to Your Account</router-link>
                    <a href="mailto:" style="background-color: grey;" class="btn btn-lg btn-outline-dark">Request Access</a>
                </div>
            </div>
        </section>


        <main class="mainSection">
            <h1>Efficiently Manage Your Operations</h1>
            <p>
                Our platform provides a comprehensive suite of tools to manage
                procurement, track sales, and generate insightful reports, all in one place.
            </p>

            <div class="container my-5">
                <div class="row">
                    <div class="col-md-4">
                        <div class="cardBox text-center">
                            <i class="fa-solid fa-cart-shopping"></i>
                            <h3>Procurement Management</h3>
                            <p>
                                Simplify and track your stock intake process from suppliers with ease.
                            </p>
                        </div>
                    </div>

                    <div class="col-md-4">
                        <div class="cardBox text-center">
                            <i class="fa-solid fa-credit-card"></i>
                            <h3>Sales & Credit Tracking</h3>
                            <p>
                                Monitor all sales transactions and manage credit accounts efficiently.
                            </p>
                        </div>
                    </div>

                    <div class="col-md-4">
                        <div class="cardBox text-center">
                            <i class="fa-solid fa-chart-bar"></i>
                            <h3>Insightful Reporting</h3>
                            <p>
                                Access key business metrics and generate detailed reports for decisions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <footer class="footerSection text-center py-4 bg-light">
            <p>&copy; {{ new Date().getFullYear() }} Karibu Groceries Limited</p>
        </footer>
    </div>
</template>

<script setup>
// Logic-free for now as it's a landing page
</script>

<style></style>