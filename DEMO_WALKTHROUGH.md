# ExLabour — Project Walkthrough & Demo Artifact

This document provides a step-by-step walkthrough of the **ExLabour** freelance marketplace, demonstrating the full lifecycle from user registration to task completion and reviews.

---

## 🚀 1. Authentication & Role Selection
ExLabour supports three distinct roles: **User (Task Owner)**, **Tasker (Service Provider)**, and **Admin**.

- **Registration:** Users choose their role during signup.
- **Login:** Secure JWT-based authentication with auto-refresh logic.
- **Initial State:** New accounts are set to `pending` verification and are restricted from posting or bidding until approved by an Admin.

---

## 🛡️ 2. Admin Verification Flow
To ensure platform quality, all accounts must be reviewed.

1.  **Admin Login:** Access the dedicated Admin Dashboard.
2.  **Review Queue:** View pending users and taskers.
3.  **Verification:** Admin reviews profiles (and tasker supporting docs) and selects **Approve** or **Reject**.
4.  **Action:** Once verified, the user/tasker receives full access to the marketplace.

---

## 📝 3. Task Posting (User Flow)
Verified Users can post new service requests.

1.  **Creation:** Fill in the task title, description, category, budget range, and deadline.
2.  **Attachments:** Upload relevant files or images (stored securely on Cloudinary).
3.  **Admin Approval:** New tasks start as `pending_admin_approval`. The Admin must approve the task before it appears in the public marketplace.

---

## 🔨 4. Bidding System (Tasker Flow)
Verified Taskers can browse and bid on approved tasks.

1.  **Discovery:** Taskers use the **Browse Tasks** page with search and category filters.
2.  **Placing a Bid:** Taskers submit a bid including:
    - **Bid Amount**
    - **Delivery Days**
    - **Proposal Message**
3.  **Management:** Taskers can update or withdraw their bids as long as the task is open.

---

## 🤝 5. Assignment & Lifecycle
The core matching happens when a User selects a Tasker.

1.  **Bid Comparison:** The Task Owner reviews all received bids on their task dashboard.
2.  **Acceptance:** The User clicks **Accept Bid** on the preferred proposal.
3.  **Auto-Logic:**
    - The selected Tasker is assigned.
    - The task status moves to `assigned`.
    - **All other pending bids are automatically rejected.**
4.  **Execution:** The Tasker marks the task as `in_progress` once they start work.
5.  **Completion:** Once finished, either the User or Tasker marks the task as `completed`.

---

## 💬 6. Communication & Bonus Features
- **Chat:** A dedicated polling-based chat becomes available between the owner and the assigned tasker once the task is `assigned`.
- **Notifications:** In-app notifications alert users about bid updates, assignments, and status changes.
- **Reviews:** After completion, both parties can leave a star rating and written review.
- **Reports:** Users can report issues or disputes for Admin moderation.

---

## 📊 7. Admin Oversight
The **Admin Dashboard** provides full visibility:
- **Metrics:** Total users, active tasks, total bids, and platform earnings.
- **Moderation:** Monitor all bids, tasks, and reports.
- **User Management:** Block or unblock accounts to maintain community standards.

---

*This walkthrough serves as the final deliverable for the ExLabour Internship Assignment.*
