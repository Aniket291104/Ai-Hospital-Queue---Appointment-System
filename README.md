# HospitalAI

> Smart Queue. Better Care.

HospitalAI is an enterprise-grade AI Hospital Queue & Appointment System designed to streamline hospital operations, automate check-ins, offer AI-powered symptom-based triage recommendations, perform prescription handwriting reading (OCR), and provide patients with real-time queue position tracking.

## 🚀 Features

- **RBAC Authentication**: Separate dashboards for Patient, Doctor, Receptionist, Admin, and SuperAdmin.
- **AI Symptom Triage**: Predicts priority, department, and doctor using Gemini API.
- **Prescription OCR**: Extracts medicines, dosage, timing, and duration from images using Gemini Vision.
- **Real-Time Queue**: Powered by Socket.IO for live queue status updates.
- **Payment Integration**: Secure billing gateway with automated PDF invoices.
- **Docker Compose Setup**: Spawns DB, Redis caching, backend, and frontend instantly.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Zustand, Recharts, TanStack Query.
- **Backend**: Node.js, Express.js, TypeScript, Mongoose, Redis, Socket.IO, PDFKit.
- **AI Engine**: Google Gemini API.

---

## ⚙️ Quick Start

### Option 1: Run with Docker Compose (Recommended)

1. Clone the repository and navigate to the project directory.
2. Run the services:
   ```bash
   docker-compose up --build
   ```
3. Open `http://localhost:3000` in your browser.

### Option 2: Local Development Setup

#### Backend Setup
1. Navigate to `/backend`.
2. Configure `.env` from `.env.example`.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run Seeding Script (Requires running MongoDB instance):
   ```bash
   npm run seed
   ```
5. Run the dev server:
   ```bash
   npm run dev
   ```

#### Frontend Setup
1. Navigate to `/frontend`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000` in your browser.

---

## 👤 Seed Accounts

Use the following credentials after seeding the database (`npm run seed`):

- **Admin Account**:
  - Email: `admin@hospitalai.com`
  - Password: `password123`
- **Doctor Account**:
  - Email: `dr.john@hospitalai.com`
  - Password: `password123`
- **Patient Account**:
  - Email: `patient@hospitalai.com`
  - Password: `password123`
