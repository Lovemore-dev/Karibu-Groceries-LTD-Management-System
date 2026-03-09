# Karibu Groceries LTD Management System

This repository contains a management system for **Karibu Groceries LTD (KGL)**.
The application supports procurement, stock management, sales (cash and credit), and reporting across two branches. It is built using a modern web stack with a Node.js backend and a Vue.js frontend.

> **Note:** This project was implemented as part of a student assignment. The implementation demonstrates form validation, role-based access control, inventory tracking, and MongoDB integration.

## Features

- Record produce procurement with detailed metadata
- Track inventory levels per branch
- Record cash and credit sales
- Manage trusted buyers with deferred payments
- Role-based access: sales agent, manager, director
- Director dashboard with aggregated sales data
- Simple UI built with Vue.js and Vite
- REST API powered by Node.js and Express
- MongoDB for persistent storage

## Project Structure

```
KGL project/
├─ client/               # Vue.js frontend application
│   ├─ src/              # Vue components, router, stores, views
│   ├─ public/           # Static assets
│   ├─ package.json      # Frontend dependencies & scripts
│   └─ ...
├─ Frontend/             # Legacy/static HTML/CSS/JS pages
├─ server/               # Node.js backend
│   ├─ controllers/      # Request handlers
│   ├─ models/           # Mongoose schemas
│   ├─ routes/           # Express route definitions
│   ├─ middleware/       # Authentication & error handling
│   ├─ config/           # Database configuration
│   ├─ server.js         # Entry point
│   └─ ...
└─ README.md             # This file
```

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- npm or yarn
- MongoDB instance (local or remote)

### Server(Node js)

```bash
cd "KGL project/server"
npm install
# set environment variables (Mongo URI, JWT secret, etc.)
npm start
```

The server will run on `http://localhost:3000` by default.

### Client (Vue)

```bash
cd "KGL project/client"
npm install
npm run dev
```

Visit `http://localhost:5173` (default Vite port) to access the app.

## Usage

1. Register or log in as a manager or sales agent.
2. Use the procurement form to add new produce deliveries.
3. Record sales in the sales interface (cash or credit).
4. Managers can view branch-level data; the director account can view aggregated totals.
5. See stock levels and receive alerts when items run out.

## Technologies Used

- **Frontend:** Vue 3, Vue Router, Pinia, Vite
- **Backend:** Node.js, Express, Mongoose
- **Database:** MongoDB
- **Authentication:** JWT
- **Styling:** CSS and Bootstrap

## 📄 License

This repository is for educational purposes.
Good luck implementing and extending the system! Feel free to explore and modify the code.
