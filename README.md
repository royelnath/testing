# 🧪 Laboratory Management System

A full-stack **MERN** application for managing a diagnostic laboratory — doctors, tests, patients, prescriptions with print & email.

---

## ✨ Features

| Module | Features |
|---|---|
| **Auth** | Login / Register, JWT, Role-based (Admin / Doctor / Receptionist) |
| **Doctors** | Add doctors (2-step form), edit profile, specialization, clinic info |
| **Doctor Dashboard** | Each doctor manages their own test catalogue — add, edit, delete, set prices |
| **Tests** | Per-doctor tests with category, price, discounted price, sample type, turnaround |
| **Patients** | Add/edit patients, search, blood group, medical history |
| **Prescriptions** | Multi-step creation, select patient → doctor → tests → billing |
| **Print** | Beautiful HTML prescription opens in new tab with browser print dialog |
| **Email** | Send prescription as HTML email via Gmail SMTP (Nodemailer) |
| **Billing** | Subtotal, discount, tax, grand total, payment status tracking |

---

## 🗂️ Project Structure

```
lab-management/
├── server/                  # Node.js + Express backend
│   ├── models/
│   │   ├── User.js          # Auth users (admin/doctor/receptionist)
│   │   ├── Doctor.js        # Doctor profiles linked to users
│   │   ├── Test.js          # Tests per doctor (name, price, category)
│   │   ├── Patient.js       # Patient records
│   │   └── Prescription.js  # Prescriptions with line items
│   ├── routes/
│   │   ├── auth.js          # /api/auth
│   │   ├── doctors.js       # /api/doctors
│   │   ├── tests.js         # /api/tests
│   │   ├── patients.js      # /api/patients
│   │   ├── prescriptions.js # /api/prescriptions (+ /print endpoint)
│   │   └── email.js         # /api/email (Nodemailer)
│   ├── middleware/
│   │   └── auth.js          # JWT protect + authorize middleware
│   ├── utils/
│   │   └── prescriptionTemplate.js  # HTML template for print/email
│   ├── .env.example         # Copy to .env and fill in
│   └── index.js             # Express entry point
│
└── client/                  # React + Vite + Tailwind frontend
    └── src/
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── DashboardPage.jsx
        │   ├── DoctorsPage.jsx          # Admin: manage doctors
        │   ├── DoctorDashboardPage.jsx  # Doctor: manage own tests
        │   ├── PatientsPage.jsx
        │   ├── PatientDetailPage.jsx
        │   ├── PrescriptionsPage.jsx
        │   ├── NewPrescriptionPage.jsx  # Create prescription workflow
        │   ├── PrescriptionDetailPage.jsx # View + Print + Email
        │   └── TestsPage.jsx            # Browse all tests
        ├── context/AuthContext.jsx
        ├── components/shared/Layout.jsx
        └── utils/api.js                 # Axios instance
```

---

## 🚀 Setup & Installation

### 1. Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- Gmail account (for email feature)

### 2. Clone & Install

```bash
# Install root dev tools
npm install

# Install all dependencies
npm run install:all
```

### 3. Configure Environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/labmanagement

# CHANGE THIS - use a long random string
JWT_SECRET=your_super_secret_key_minimum_32_chars

# Gmail: go to Google Account → Security → 2FA → App Passwords
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_char_app_password
EMAIL_FROM=Lab Management <your_gmail@gmail.com>

# Appears on printed prescriptions
LAB_NAME=City Diagnostic Laboratory
LAB_ADDRESS=123 Main Street, City 400001
LAB_PHONE=+91-9876543210
LAB_EMAIL=info@citylab.com
```

### 4. Create First Admin User

Start the server, then POST to register:

```bash
# Start server
cd server && npm run dev

# Register admin (use Postman or curl)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin User","email":"admin@lab.com","password":"admin123","role":"admin"}'
```

### 5. Run Development Servers

```bash
# From root — runs both server (5000) and client (5173) together
npm run dev
```

Open: **http://localhost:5173**

---

## 📋 User Roles & Access

| Role | Access |
|---|---|
| **admin** | Everything — manage doctors, view all data |
| **doctor** | Doctor Dashboard (manage own tests), patients, prescriptions |
| **receptionist** | Patients, prescriptions, tests (read) |

---

## 🖨️ Print Prescription

On the Prescription Detail page, click **"Print / Download"** — a new tab opens with the formatted prescription HTML. Use your browser's **Print** (Ctrl+P / Cmd+P) to print or **Save as PDF**.

## 📧 Email Prescription

On the Prescription Detail page, click **"Email"** — enter the patient's email address and an optional message. The prescription is sent as a formatted HTML email via Gmail SMTP.

### Gmail App Password Setup
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Security → 2-Step Verification (must be ON)
3. App Passwords → Generate for "Mail"
4. Paste the 16-character password into `EMAIL_PASS` in `.env`

---

## 🗄️ API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login → returns JWT |
| GET | `/api/auth/me` | Current user |
| GET | `/api/doctors` | List all doctors |
| POST | `/api/doctors` | Create doctor (admin) |
| PUT | `/api/doctors/:id` | Update doctor |
| GET | `/api/tests?doctor=ID` | Tests by doctor |
| POST | `/api/tests` | Create test |
| PUT | `/api/tests/:id` | Update test |
| DELETE | `/api/tests/:id` | Soft-delete test |
| GET | `/api/patients` | List patients (paginated) |
| POST | `/api/patients` | Add patient |
| GET | `/api/prescriptions` | List prescriptions |
| POST | `/api/prescriptions` | Create prescription |
| GET | `/api/prescriptions/:id/print` | HTML for printing |
| POST | `/api/email/send-prescription` | Email prescription |

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT, Nodemailer
- **Frontend**: React 18, Vite, Tailwind CSS, TanStack Query, React Router v6, Lucide icons
- **PDF/Print**: Browser native print from server-rendered HTML
- **Email**: Nodemailer with Gmail SMTP
