# 🏦 Banking Management System

A full-stack modern Banking Management System built with **Next.js 16**, **TypeScript**, **Tailwind CSS**, and **Drizzle ORM** with **PGlite** embedded Wasm PostgreSQL engine.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Installation
Clone the repository and install all dependencies:
```bash
git clone <repository-url>
cd flask-banking-management-system
npm install
```

### 2. Running Environment
The application comes pre-configured with embedded WebAssembly PostgreSQL (`@electric-sql/pglite`), allowing it to run completely standalone out-of-the-box without requiring an external database server daemon.

To start the development server:
```bash
npm run dev
```

The application will be running at [http://localhost:3000](http://localhost:3000).

---

## 🔑 Demo Login Accounts

After starting the server, seed the initial database accounts by making a `POST` request to `http://localhost:3000/api/seed` or by logging in with the pre-seeded accounts:

| User Type | Username | Password | Default Accounts & Balances |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Full admin analytics, customer management & account toggling |
| **Customer** | `john_doe` | `customer123` | Savings: `₹10,000.00` \| Current: `₹25,000.00` |
| **Customer** | `jane_smith` | `customer123` | Savings: `₹5,000.00` |
| **Customer** | `bob_wilson` | `customer123` | Fixed Deposit: `₹50,000.00` (Inactive) |

---

## 🛠️ Features

### 👤 Customer Features
- **Account Dashboard**: View account summary, balances, and real-time transaction history.
- **Deposits & Withdrawals**: Instant funds deposit and withdrawal with account balance verification.
- **Fund Transfers**: Transfer money seamlessly between customer accounts with atomic transaction handling.
- **Profile Management**: View customer profile details, account numbers, and personal info.

### 🛡️ Admin Features
- **Admin Dashboard**: System-wide statistics, total accounts count, system balance metrics, and active transaction feed.
- **Customer Management**: Search and inspect registered customers and linked account details.
- **Account Control**: Toggle account status (Active / Inactive) with real-time controls.
- **Audit Logs**: Comprehensive logs of all system transactions across all user accounts.

---

## 📁 Project Structure

```text
├── src/
│   ├── app/                 # Next.js App Router (Pages & API Routes)
│   │   ├── admin/           # Admin panel pages
│   │   ├── api/             # REST API endpoints (Auth, Customer, Admin, Seed, Health)
│   │   ├── dashboard/       # Customer dashboard
│   │   ├── deposit/         # Deposit money page
│   │   ├── withdraw/        # Withdraw money page
│   │   ├── transfer/        # Transfer money page
│   │   ├── profile/         # Customer profile page
│   │   ├── login/           # User authentication login
│   │   └── register/        # Customer registration
│   ├── db/                  # Database schema & PGlite connection adapter
│   ├── lib/                 # Auth utilities, session JWT management, banking logic
│   └── middleware.ts        # Next.js authentication middleware proxy
├── tests/                   # Integration test scripts
├── drizzle.config.json      # Drizzle ORM configuration
├── next.config.ts           # Next.js configuration
├── package.json             # Project dependencies & scripts
└── INSTALLATION.md          # Step-by-step setup & deployment instructions
```

---

## 🧪 Commands & Testing

- **Development Server**: `npm run dev`
- **TypeScript Typecheck**: `npm run typecheck`
- **Production Build**: `npm run build`
- **Start Production Server**: `npm start`
- **Seed Database**: `curl -X POST http://localhost:3000/api/seed`

---

## 📜 License
MIT License.
