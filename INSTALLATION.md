# 📖 Installation & Setup Instructions

Follow these step-by-step instructions to set up and run the Banking Management System on your machine.

---

## 1. Prerequisites Check

Make sure you have Node.js installed:
```bash
node -v
# Output should be >= v18.0.0

npm -v
# Output should be >= v9.0.0
```

---

## 2. Clone & Install Dependencies

```bash
# Clone the repository
git clone <repository-url>

# Navigate into project directory
cd flask-banking-management-system

# Install dependencies
npm install
```

> **Note for Windows PowerShell Users**:
> If script execution is restricted on your machine, use `npm.cmd install` or run PowerShell as Administrator.

---

## 3. Environment Setup

Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
JWT_SECRET=banking-system-dev-secret-change-in-production
```

> **Embedded Database**: By default, the application uses `@electric-sql/pglite` embedded WebAssembly PostgreSQL. You do not need to install or run PostgreSQL manually.

---

## 4. Run Development Server

```bash
npm run dev
```

The application will start on **`http://localhost:3000`**.

---

## 5. Seed Initial Test Data

Once the server is running, trigger database seeding:

### Using curl
```bash
curl -X POST http://localhost:3000/api/seed
```

### Using PowerShell
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/seed" -Method POST
```

---

## 6. Access Demo Accounts

Open your browser and navigate to `http://localhost:3000/login`.

- **Admin Portal**: Login with `admin` / `admin123`
- **Customer Portal**: Login with `john_doe` / `customer123` or `jane_smith` / `customer123`

---

## 7. Production Build & Deployment

To verify and create a production build:
```bash
# Verify TypeScript types
npm run typecheck

# Build production bundle
npm run build

# Start production server
npm start
```
