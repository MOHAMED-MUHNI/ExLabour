# Pull Request: Add Ratings/Reviews System

## 🎯 Overview
This PR implements a comprehensive ratings and reviews system for the ExLabour marketplace, allowing users and taskers to provide feedback after task completion.

## ✨ Features Added

### Backend Changes
- **Review Model** (`backend/models/Review.js`)
  - 5-star rating system
  - Optional comments (max 500 chars)
  - Anonymous review option
  - Unique constraint: one review per reviewer per task
  - Automatic user rating statistics calculation

- **Review Controller** (`backend/controllers/reviewController.js`)
  - `createReview()` - Post review for completed tasks
  - `getUserReviews()` - Get reviews for a specific user with pagination
  - `getMyReviews()` - Get reviews submitted by current user
  - `getTaskReviews()` - Get all reviews for a task
  - `updateReview()` - Edit own review
  - `deleteReview()` - Delete own review (or admin deletion)

- **Review Routes** (`backend/routes/reviewRoutes.js`)
  - POST `/api/reviews/task/:taskId` - Create review (protected)
  - GET `/api/reviews/user/:userId` - Get user reviews
  - GET `/api/reviews/my` - Get my submitted reviews (protected)
  - GET `/api/reviews/task/:taskId` - Get task reviews
  - PUT `/api/reviews/:reviewId` - Update review (protected)
  - DELETE `/api/reviews/:reviewId` - Delete review (protected)

- **User Model Updates**
  - Added `averageRating` field (0-5)
  - Added `totalReviews` count
  - Auto-updated when reviews are created/modified/deleted

### Frontend Changes
- **ReviewForm Component** (`frontend/src/components/ReviewForm.js`)
  - Interactive 5-star rating with hover effects
  - Optional comment textarea (500 char limit)
  - Anonymous checkbox option
  - Form validation and toast notifications
  - Loading state during submission

- **ReviewsList Component** (`frontend/src/components/ReviewsList.js`)
  - Display user profile with average rating and review count
  - Show individual reviews with reviewer info and timestamp
  - Star rating visualization
  - Pagination for user reviews
  - Delete button for own reviews
  - Support for both user and task review views

## 🔒 Security & Validation
- ✅ Only authorized users (task owner or assigned tasker) can create reviews
- ✅ Only completed tasks can be reviewed
- ✅ One review per reviewer per task (unique index)
- ✅ Review author can only update/delete their own reviews
- ✅ Admin can delete any review
- ✅ Rating validated between 1-5
- ✅ Comment limited to 500 characters

## 📊 Data Validation
- Express-validator rules for all inputs
- MongoDB indexes for performance:
  - Compound index on `(taskId, reviewerId)` for uniqueness
  - Index on `(targetUserId, createdAt)` for user review queries
  - Index on `(taskId, createdAt)` for task review queries

## 🧪 Testing Checklist
- [ ] Create task and complete it
- [ ] Submit review as task owner (⭐ to tasker)
- [ ] Submit review as tasker (⭐ to owner)
- [ ] View user ratings on profile
- [ ] Edit own review
- [ ] Delete own review
- [ ] Verify rating stats auto-update

## 📝 Files Changed
- `backend/models/Review.js` (NEW)
- `backend/controllers/reviewController.js` (NEW)
- `backend/routes/reviewRoutes.js` (NEW)
- `backend/server.js` (MODIFIED - added review routes)
- `backend/models/User.js` (MODIFIED - added rating fields)
- `frontend/src/components/ReviewForm.js` (NEW)
- `frontend/src/components/ReviewsList.js` (NEW)

## 🚀 Usage
1. After task completion, navigate to task detail
2. Click "Leave Review" button
3. Select rating (1-5 stars)
4. Add optional comment
5. Choose to review anonymously
6. Submit review

## 📈 Future Enhancements
- Email notifications for new reviews
- Review moderation (flag inappropriate reviews)
- Review helpful/unhelpful voting
- Filter reviews by rating
- Review photos/media support
- Auto-suspend users with low ratings

## 🤝 Related Issues
Implements feature: "Ratings/Reviews System" from Assignment Requirements

## Version Info
- Target Version: v1.1.0
- Breaking Changes: None
- Database Migrations: New Review collection (created automatically)
