# PR: Add Notifications System

## Description
Complete implementation of a real-time notification system for the ExLabour marketplace. Enables users to receive notifications about bid activity, task assignments, reviews, and account status changes.

## Features Implemented

### Backend
- ✅ **Notification Model**: MongoDB schema with support for 14 notification types
- ✅ **Notification Types**:
  - Bid notifications (placed, accepted, rejected, withdrawn)
  - Task notifications (assigned, completed, cancelled)
  - Review notifications (received, ratings)
  - Account notifications (verified, rejected)
  - Payment notifications (received, pending)
  - System alerts
  
- ✅ **Notification Controller**: 6 CRUD operations
  - Get user notifications (paginated, filterable)
  - Get unread count
  - Mark as read (single/all)
  - Delete (single/all/old)
  - Clear old read notifications

- ✅ **Notification Service**: Utility class for easy notification creation
  - `notifyBidPlaced()` - When user receives a bid
  - `notifyBidAccepted()` - Bid accepted
  - `notifyBidRejected()` - Bid not selected
  - `notifyTaskAssigned()` - Task assigned to user
  - `notifyTaskCompleted()` - Task completed
  - `notifyTaskCancelled()` - Task cancelled
  - `notifyReviewReceived()` - Review received
  - `notifyUserVerified()` - Account verified
  - `notifyUserRejected()` - Verification rejected
  - Additional admin notification methods

### API Endpoints
```
GET    /api/notifications               - Get user notifications (paginated)
GET    /api/notifications/unread/count  - Get unread notification count
PUT    /api/notifications/:id/read      - Mark single notification as read
PUT    /api/notifications/read/all      - Mark all notifications as read
DELETE /api/notifications/:id           - Delete single notification
DELETE /api/notifications/delete/all    - Delete all notifications
DELETE /api/notifications/clear/old     - Clear old read notifications
```

### Frontend
- ✅ **NotificationBell Component**: Dropdown panel showing recent notifications
  - Badge with unread count
  - Show/mark as read
  - Delete individual notifications
  - Load more pagination
  - Auto-refresh every 30 seconds
  - Click outside to close

- ✅ **Notifications Page**: Dedicated page showing all notifications
  - Filter by status (all, unread, read)
  - View notification details
  - Bulk select and delete
  - Real-time filtering
  - Responsive design

### Database Schema
**Notification Collection**:
```javascript
{
  recipientId: ObjectId,          // Who receives notification
  senderId: ObjectId,             // Who triggered it (optional)
  type: String,                   // Notification type
  title: String,                  // Short title
  message: String,                // Full message
  taskId: ObjectId,               // Related task (if applicable)
  bidId: ObjectId,                // Related bid (if applicable)
  reviewId: ObjectId,             // Related review (if applicable)
  actionUrl: String,              // URL to relevant page
  icon: String,                   // Icon type for UI
  isRead: Boolean,                // Read status
  readAt: Date,                   // When marked as read
  createdAt: Date,                // Timestamp
  updatedAt: Date                 // Last updated
}
```

Indexes:
- `{ recipientId: 1, isRead: 1 }` - Fetch unread notifications
- `{ recipientId: 1, createdAt: -1 }` - Pagination

## Technical Details

### Integration Points
The notification service is ready to be integrated into existing controllers:
- `bidController.js` - Call `notifyBidPlaced()` when bid is created
- `taskController.js` - Call `notifyTaskAssigned()` when task assigned
- `reviewController.js` - Call `notifyReviewReceived()` when review created
- `authController.js` - Call `notifyUserVerified()` on user verification

### Performance Improvements
- Compound indexes for efficient queries
- Pagination support (default 10 per page)
- Lean queries to reduce memory usage
- Unread count in separate endpoint
- Optional auto-cleanup of old read notifications

### Security
- All endpoints require authentication (`protect` middleware)
- Users can only access their own notifications
- Ownership verification before delete/update
- Input validation on all requests

## Testing Checklist

### Backend API
- [ ] GET /api/notifications returns paginated list
- [ ] Filtering works (all, unread, read)
- [ ] Unread count is accurate
- [ ] PUT /:id/read marks notification as read
- [ ] PUT /read/all marks all as read
- [ ] DELETE /:id removes notification
- [ ] DELETE /delete/all removes all
- [ ] Delete requires ownership verification
- [ ] 404 for non-existent notifications

### Frontend Components
- [ ] NotificationBell shows badge count correctly
- [ ] Dropdown opens/closes on click
- [ ] Click outside closes dropdown
- [ ] Load more pagination works
- [ ] Delete buttons remove notifications
- [ ] Read/unread toggle works
- [ ] Notifications page filters work

### Integration (Pending)
- [ ] Bidding system triggers notifications
- [ ] Task assignment triggers notifications
- [ ] Review receipt triggers notifications
- [ ] User verification triggers notifications

## Files Changed
- `backend/models/Notification.js` - NEW
- `backend/controllers/notificationController.js` - NEW
- `backend/routes/notificationRoutes.js` - NEW
- `backend/utils/notificationService.js` - NEW
- `backend/server.js` - MODIFIED (added notification routes)
- `frontend/src/components/NotificationBell.js` - NEW
- `frontend/src/components/NotificationBell.module.css` - NEW
- `frontend/src/app/dashboard/notifications/page.js` - NEW
- `frontend/src/app/dashboard/notifications/page.module.css` - NEW

## Breaking Changes
None

## Next Steps
1. Integrate notification service into existing controllers
2. Add DashboardLayout integration of NotificationBell component
3. Test end-to-end notification creation and delivery
4. Consider adding email notification feature
5. Add real-time WebSocket support (optional enhancement)

## Credits
Complete notifications system implementation with backend model, API endpoints, and React components for managing user notifications in the ExLabour marketplace.
