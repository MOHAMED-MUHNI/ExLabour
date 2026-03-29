# ExLabour — Freelance Task Marketplace

ExLabour is a robust, secure, and modern freelance task marketplace built with the **MERN Stack** (Next.js 16, Express.js, MongoDB). It features a premium dark-mode UI with glassmorphism and is designed to handle the full lifecycle of freelance task management—from posting and bidding to assignment and completion.

---

## 🚀 Key Features

### 👥 Role-Based Access Control (RBAC)
- **Users (Task Owners):** Post tasks, review bids, assign taskers, and manage project completion.
- **Taskers (Service Providers):** Browse approved tasks, place professional bids, and track assigned work.
- **Admins:** Full platform oversight, user verification, task moderation, and dispute management.

### 🛡️ Secure Verification System
- Mandatory Admin approval for both users and tasks to ensure platform quality.
- Secure JWT-based authentication with **token refresh logic** and bcrypt password hashing.

### 🔨 Dynamic Bidding & Assignment
- Real-time bidding system with delivery estimates and proposals.
- One-click assignment that automatically notifies the winner and rejects other pending bids.

### 💬 Advanced Functional Modules
- **In-App Chat:** Real-time (polling-based) communication between task owners and assigned taskers.
- **Notification System:** Instant updates for bid status, assignments, and account verifications.
- **Ratings & Reviews:** Dual-sided review system for building platform trust.
- **Report & Dispute:** Integrated module for users to report issues for admin review.
- **Profile Strength:** Visual indicator to encourage complete profile setups.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 16 (App Router), Axios, React Hot Toast, React Icons.
- **Backend:** Node.js, Express.js, Mongoose (MongoDB).
- **Storage:** **Cloudinary** (Secure image and document management).
- **Security:** Helmet, CORS, JWT, Bcrypt, Express Rate Limit.

---

## 📦 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Cloudinary Account (for file storage)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/MOHAMED-MUHNI/ExLabour.git
cd ExLabour

# Install Backend dependencies
cd backend
npm install

# Install Frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Setup
Create a `.env` file in the `backend/` directory using the provided `.env.example` as a template:
```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Running the Project
```bash
# Start Backend (from /backend)
npm run dev

# Start Frontend (from /frontend)
npm run dev
```

---

## 🧪 Demo & Lifecycle
A comprehensive lifecycle walkthrough (from registration to completion) is available in:
👉 **[DEMO_WALKTHROUGH.md](./DEMO_WALKTHROUGH.md)**

---

## 📚 API Overview

| Module | Access | Description |
|---|---|---|
| `/api/auth` | Public/Auth | Registration, Login, Profile Management |
| `/api/tasks` | Verified | Task creation, discovery, and moderation |
| `/api/bids` | Verified | Bidding logic and task assignment |
| `/api/admin` | Admin | Dashboard metrics, verification, and blocking |
| `/api/reviews` | Auth | Rating and review submission |
| `/api/messages` | Assigned | Task-specific chat system |

---

## ✅ Assignment Requirement Checklist

| Requirement | Status |
|---|---|
| MERN Stack Implementation | ✅ Implemented |
| Role-based Auth (User, Tasker, Admin) | ✅ Implemented |
| Admin Approval System (Users & Tasks) | ✅ Implemented |
| Cloudinary Integration | ✅ Implemented |
| Bidding & Assignment Flow | ✅ Implemented |
| Ratings/Reviews & Notifications | ✅ Implemented |
| Chat & Dispute Modules | ✅ Implemented |
| Demo Artifact (WALKTHROUGH.md) | ✅ Implemented |

---

## 📜 License
This project is built for the ExLabour Internship assignment.
