# ExLabour — Freelance Task Marketplace

ExLabour is a robust, secure, and modern freelance task marketplace built with **Next.js 16**, **Express.js**, and **MongoDB**. It uses **AWS S3** for professional-grade file storage and features a premium dark-mode UI.

## 🚀 Features

- **Role-Based Access Control**: Separate flows for Users (Task Owners), Taskers (Service Providers), and Admins.
- **Secure Authentication**: JWT-based auth with bcrypt password hashing and token refresh logic.
- **Admin Verification**: Mandatory admin approval for new taskers and tasks to ensure platform quality.
- **Dynamic Bidding**: Real-time proposal system where taskers bid on tasks and owners choose the best fit.
- **Task Lifecycle**: Full tracking from "Pending Approval" to "Open for Bidding" to "Assigned" and "Completed".
- **Cloud Storage**: Profile images and task attachments are stored securely on AWS S3.
- **Premium UI**: Sleek dark-mode interface with glassmorphism, responsive design, and smooth animations.

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), Axios, React Hot Toast, React Icons.
- **Backend**: Node.js, Express.js, Mongoose (MongoDB).
- **Storage**: AWS S3 SDK v3.
- **Security**: Helmet, CORS, JWT, Bcrypt.

## 📦 Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (Local or Atlas)
- AWS Account (for S3 bucket)

### 1. Clone the repository

```bash
git clone <repository-url>
cd ExLabour
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/exlabour
JWT_SECRET=your_super_secret_jwt_key
NODE_ENV=development

# AWS S3 Config
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=exlabour-uploads

# Admin Seed
ADMIN_NAME=Super Admin
ADMIN_EMAIL=admin@exlabour.com
ADMIN_PASSWORD=Admin@123
```

Run the seed script to create the initial admin:

```bash
npm run seed
```

Start the backend:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

## 🧪 Verification

The backend includes a health check endpoint at `http://localhost:5000/api/health`.

## 📚 API Reference

Base URL: `http://localhost:5000/api`

Authorization format for protected routes:

```http
Authorization: Bearer <jwt_token>
```

Common validation error format (HTTP 400):

```json
{
	"success": false,
	"errors": [
		{ "msg": "Validation message", "path": "fieldName", "location": "body|params|query" }
	]
}
```

### Health

| Method | Endpoint | Auth | Access | Description |
| --- | --- | --- | --- | --- |
| GET | `/health` | No | Public | API health status and timestamp. |

### Auth Endpoints

| Method | Endpoint | Auth | Access | Request Payload | Description |
| --- | --- | --- | --- | --- | --- |
| POST | `/auth/register` | No | Public | `name`, `email`, `password`, `role` (`user` or `tasker`), optional: `phone`, `bio`, `skills`, `location` | Register a user or tasker account. |
| POST | `/auth/login` | No | Public | `email`, `password` | Login and receive JWT + user object. |
| GET | `/auth/me` | Yes | Any authenticated user | None | Get currently authenticated user profile. |
| PUT | `/auth/profile` | Yes | Any authenticated user | Any of: `name`, `phone`, `bio`, `skills`, `location` | Update own profile fields. |

### Task Endpoints

| Method | Endpoint | Auth | Access | Request / Query | Description |
| --- | --- | --- | --- | --- | --- |
| GET | `/tasks/approved` | Yes | Any authenticated user | Query (optional): `category`, `minBudget`, `maxBudget`, `search`, `location`, `sort` (`budget_high`, `budget_low`, `deadline`) | List approved tasks open for bidding. |
| GET | `/tasks/my` | Yes | Verified/Unverified `user` role | None | List tasks created by logged-in task owner. |
| GET | `/tasks/assigned` | Yes | `tasker` role | Query (optional): `status` (`assigned`, `in_progress`, `completed`, `cancelled`) | List tasks assigned to logged-in tasker. |
| GET | `/tasks/pending` | Yes | Admin | None | List tasks pending admin approval. |
| GET | `/tasks/:id` | Yes | Any authenticated user | Param: `id` (Mongo ObjectId) | Get task details. Bids included for task owner/admin only. |
| POST | `/tasks` | Yes | Verified `user` role | `title`, `description`, `category`, `budgetMin`, `budgetMax`, `deadline`, optional: `location`, `attachments[]` | Create new task (starts pending admin approval). |
| PUT | `/tasks/:id` | Yes | Verified `user` role (owner only) | Param: `id`; body optional task fields + `attachments[]` | Update task before assignment constraints apply. |
| PUT | `/tasks/:id/cancel` | Yes | Verified `user` role (owner only) | Param: `id` | Cancel task and auto-reject pending bids. |
| DELETE | `/tasks/:id` | Yes | Owner or Admin | Param: `id` | Delete task if allowed by state; removes related bids. |
| PUT | `/tasks/:id/approve` | Yes | Admin | Param: `id` | Approve task for bidding. |
| PUT | `/tasks/:id/reject` | Yes | Admin | Param: `id` | Reject task. |

### Bid Endpoints

| Method | Endpoint | Auth | Access | Request / Query | Description |
| --- | --- | --- | --- | --- | --- |
| POST | `/bids` | Yes | Verified `tasker` role | `taskId`, `amount`, `deliveryDays`, `proposalMessage` | Place a bid on an approved open task. |
| GET | `/bids/my` | Yes | `tasker` role | None | List bids created by logged-in tasker. |
| PUT | `/bids/:id` | Yes | Verified `tasker` role (owner only) | Param: `id`; body any of `amount`, `deliveryDays`, `proposalMessage` | Update a pending bid while task is still open. |
| PUT | `/bids/:id/withdraw` | Yes | `tasker` role (owner only) | Param: `id` | Withdraw a pending bid. |
| GET | `/bids/task/:taskId` | Yes | Task owner or Admin | Param: `taskId` | Get all bids for a given task. |
| PUT | `/bids/:id/accept` | Yes | Verified `user` role (task owner only) | Param: `id` | Accept a bid, assign tasker, reject other pending bids. |
| PUT | `/bids/:id/reject` | Yes | Verified `user` role (task owner only) | Param: `id` | Manually reject a pending bid. |
| PUT | `/bids/task/:taskId/start` | Yes | `tasker` role (assigned tasker only) | Param: `taskId` | Mark assigned task as in progress. |
| PUT | `/bids/task/:taskId/complete` | Yes | Task owner or assigned tasker | Param: `taskId` | Mark in-progress task as completed. |

### Admin Bid Moderation

| Method | Endpoint | Auth | Access | Request / Query | Description |
| --- | --- | --- | --- | --- | --- |
| PUT | `/bids/:id/admin-review` | Yes | Admin | Param: `id`; body: `action` ("approve" or "reject") | Admin approves pending bid (assigns tasker) or rejects it. |

All endpoints under `/admin/*` require admin authentication.

| Method | Endpoint | Auth | Access | Request / Query | Description |
| --- | --- | --- | --- | --- | --- |
| GET | `/admin/dashboard` | Yes | Admin | None | Dashboard metrics and recent activity. |
| GET | `/admin/pending` | Yes | Admin | Query (optional): `type` (`user`, `tasker`) | List pending verification accounts. |
| GET | `/admin/users` | Yes | Admin | Query (optional): `role`, `status` | List users/taskers with filters. |
| GET | `/admin/bids` | Yes | Admin | Query (optional): `status`, `taskStatus`, `search` | Monitor bids with summary and filters. |
| GET | `/admin/logs` | Yes | Admin | None | List latest verification moderation logs. |
| PUT | `/admin/verify/:id` | Yes | Admin | Param: `id`, optional body: `remarks` | Verify a user/tasker. |
| PUT | `/admin/reject/:id` | Yes | Admin | Param: `id`, optional body: `remarks` | Reject a user/tasker. |
| PUT | `/admin/block/:id` | Yes | Admin | Param: `id`, optional body: `remarks` | Block a user/tasker account. |
| PUT | `/admin/unblock/:id` | Yes | Admin | Param: `id`, optional body: `remarks` | Unblock a user/tasker account. |

### Upload Endpoints

| Method | Endpoint | Auth | Access | Request Type | Description |
| --- | --- | --- | --- | --- | --- |
| POST | `/upload/profile-image` | Yes | Any authenticated user | `multipart/form-data`, field: `image` | Upload profile image and update user profileImage URL. |
| POST | `/upload/task-attachment` | Yes | Any authenticated user | `multipart/form-data`, field: `file` | Upload task attachment and return `{ url, key, originalName }`. |
| POST | `/upload/verification-document` | Yes | `tasker` role | `multipart/form-data`, field: `file` | Upload tasker verification document and attach it to user profile for admin review. |

### Notes on Access Rules

| Rule | Behavior |
| --- | --- |
| Verification gate | `requireVerified` is applied to task posting/updating/canceling and bid place/update/accept actions. |
| Owner checks | Owner restrictions (task owner, bid owner) are enforced in controllers. |
| Admin override | Some routes are broad (`protect`) but controller checks grant admin visibility or management rights where relevant. |
| State checks | Task/bid lifecycle transitions are validated in controller logic before status updates. |

## Assignment Requirement Coverage Checklist

Status legend:

- **Implemented**: Completed in code.
- **Partial**: Exists but not fully aligned with the brief.
- **Missing**: Not implemented.

Last reviewed: **2026-03-18**.

### 1) Core Mandatory Requirements

| Requirement                                                                     | Status      | Notes                                                        |
| ------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------ |
| Required stack: Next.js + Node.js + Express + MongoDB                           | Implemented | Matches project architecture.                                |
| Roles: User, Tasker, Admin                                                      | Implemented | Role-based access exists in backend and frontend.            |
| bcrypt password hashing                                                         | Implemented | Password hashing in user model middleware.                   |
| JWT authentication                                                              | Implemented | Token generation and protected routes implemented.           |
| Admin approval for users/taskers/tasks                                          | Implemented | Verification and task approval workflows exist.              |
| Cloudinary integration for uploads                                              | Missing     | Project currently uses AWS S3 instead.                       |
| Full MVP outcome (auth + verification + posting + bidding + assignment + admin) | Implemented | Core assignment lifecycle is fully working in code.          |

### 2) User Responsibilities

| Requirement                                      | Status      | Notes                                                                  |
| ------------------------------------------------ | ----------- | ---------------------------------------------------------------------- |
| Register and log in                              | Implemented | End-to-end auth UI + API in place.                                     |
| Create, edit, delete own tasks before assignment | Implemented | Ownership checks and task APIs implemented.                            |
| View all bids on posted tasks                    | Implemented | Task owner can view all bids per task.                                 |
| Compare amount, delivery, proposal               | Implemented | Bid details shown in task detail UI.                                   |
| Accept one bid and assign tasker                 | Implemented | Accept flow implemented with assignment update.                        |
| Reject unwanted bids and track progress          | Implemented | Manual bid rejection (task owner) and admin bid moderation now available. |
| Mark task as completed                           | Implemented | Completion endpoint and UI action available.                           |

### 3) Tasker Responsibilities

| Requirement                                        | Status      | Notes                                                                              |
| -------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------- |
| Register and log in                                | Implemented | Tasker role supported at registration and login.                                   |
| Profile with bio, skills, optional supporting docs | Implemented | Tasker profile now supports uploading verification documents for review.           |
| Browse approved tasks open for bidding             | Implemented | Task discovery page and backend filters available.                                 |
| Place, update, withdraw bids                       | Implemented | Place/update/withdraw flows are implemented end-to-end.                            |
| View assigned tasks and update progress            | Implemented | Dedicated assigned-task dashboard page and start/complete actions are available.   |

### 4) Admin Responsibilities

| Requirement                                         | Status      | Notes                                                         |
| --------------------------------------------------- | ----------- | ------------------------------------------------------------- |
| Admin dashboard access                              | Implemented | Admin pages and route protections exist.                      |
| Verify/reject users and taskers                     | Implemented | Verification actions implemented.                             |
| Approve/reject tasks before visibility              | Implemented | Pending tasks queue + approve/reject actions exist.           |
| Manage users/taskers/tasks/bids                     | Implemented | Users/tasks/bids all fully manageable via Admin page; admin can approve/reject pending bids. |
| Block/unblock accounts and review platform activity | Implemented | Block/unblock + verification logs are available.              |

### 5) Functional Modules

| Requirement                                             | Status      | Notes                                                                                                                        |
| ------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Authentication and authorization (role middleware)      | Implemented | JWT + protect/authorize middleware implemented.                                                                              |
| Verification system (pending/verified/rejected/blocked) | Implemented | User lifecycle status managed by admin APIs.                                                                                 |
| Task management with attachments                        | Implemented | Upload + attachment persistence + display are wired across task create/detail flows.                                         |
| Bidding system for verified taskers                     | Implemented | Verified taskers can bid; constraints enforced.                                                                              |
| Assignment flow + auto-reject remaining bids            | Implemented | Accepting one bid rejects other pending bids.                                                                                |
| Admin dashboard metrics and oversight                   | Implemented | Admin dashboard plus dedicated bid monitoring page and API are available.                                                    |

### 6) Lifecycle Coverage

| Lifecycle                                                                       | Status      | Notes                                                            |
| ------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------- |
| Verification states: pending/verified/rejected/blocked                          | Implemented | Fully represented in model + admin actions.                      |
| Task approval states: pending_admin_approval/approved/rejected                  | Implemented | Implemented in task model + admin APIs.                          |
| Task progress states: open_for_bidding/assigned/in_progress/completed/cancelled | Implemented | Full lifecycle including cancel flow is available in API/UI.     |
| Bid states: pending/accepted/rejected/withdrawn                                 | Implemented | Full state flow present.                                         |

### 7) Recommended Extra Features

| Feature                                         | Status      | Notes                                                                   |
| ----------------------------------------------- | ----------- | ----------------------------------------------------------------------- |
| Task category system                            | Implemented | Categories available in schema and forms.                               |
| Search/filter by title/category/location/budget | Implemented | Title/category/location/budget filters are supported in task discovery. |
| Ratings/reviews                                 | Missing     | Not implemented.                                                        |
| Notifications                                   | Missing     | Not implemented.                                                        |
| Chat between user and assigned tasker           | Missing     | Not implemented.                                                        |
| Report/dispute module                           | Missing     | Not implemented.                                                        |
| Payment/escrow placeholder                      | Missing     | Not implemented.                                                        |
| Profile strength indicator                      | Missing     | Not implemented.                                                        |

### 8) Expected Deliverables Coverage

| Deliverable                                            | Status      | Notes                                                   |
| ------------------------------------------------------ | ----------- | ------------------------------------------------------- |
| Responsive Next.js frontend for all roles              | Implemented | Role-specific pages and responsive styling exist.       |
| Modular Node/Express backend                           | Implemented | Routes/controllers/middleware/models are modularized.   |
| MongoDB schemas for users/tasks/bids/verification logs | Implemented | All expected core collections are present.              |
| Working bcrypt + JWT auth                              | Implemented | Operational in backend and frontend integration.        |
| Cloudinary upload integration                          | Missing     | Uses AWS S3 currently.                                  |
| README with setup, env, structure, API list            | Implemented | Setup/env/structure plus endpoint matrix are documented. |
| Final lifecycle demo artifact                          | Missing     | No demo link/artifact included in repository.           |

### 9) Suggested Backend Collections Alignment

| Collection              | Status      | Notes                                                                 |
| ----------------------- | ----------- | --------------------------------------------------------------------- |
| User fields             | Implemented | Fields match assignment intent.                                       |
| Task fields             | Implemented | Fields include approval/task lifecycle and assignment references.     |
| Bid fields              | Partial     | Equivalent fields exist but naming differs (`amount` vs `bidAmount`). |
| Verification log fields | Implemented | Decision trail is stored with reviewer and remarks.                   |

### 10) Intern Coding Rules Alignment

| Rule                                     | Status      | Notes                                                                    |
| ---------------------------------------- | ----------- | ------------------------------------------------------------------------ |
| Clean folder structure and naming        | Implemented | Project is clearly split into backend/frontend modules.                  |
| Modular/reusable code                    | Implemented | Shared API client/context/layouts and backend module separation present. |
| Input validation on frontend and backend | Implemented | Backend task/bid validation is now strengthened; frontend forms enforce required constraints. |
| Secrets in environment variables         | Implemented | Env-based config pattern used.                                           |
| Do not expose sensitive secrets          | Partial     | Pattern is correct, but care is needed to avoid committing real secrets. |
| Error handling/loading/protected routes  | Partial     | Mostly present; a few user-facing error messages can still be improved.  |
| Easy to maintain and extend              | Partial     | Strong base architecture with identified cleanup tasks below.            |

### Coverage Summary

| Status      | Count |
| ----------- | ----: |
| Implemented |    47 |
| Partial     |     4 |
| Missing     |     9 |

## Prioritized Action Plan (Top 10)

1. Replace S3 with Cloudinary to match assignment requirement, or formally document S3 as an approved deviation.
2. Implement ratings/reviews module.
3. Implement in-app notifications for lifecycle events.
4. Implement direct chat between task owner and assigned tasker.
5. Add report/dispute workflow.
6. Add payment/escrow placeholder module.
7. Add baseline automated tests.
10. Add and publish a final lifecycle demo artifact.

## 📜 License

This project is built for the ExLabour Internship assignment.
