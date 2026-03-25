# Email Verification System - Phase 2 Implementation

## Overview

Email verification is now integrated into the ExLabour platform as a critical security measure. Users must verify their email address before they can log in to the system. This ensures that registered emails are valid and belong to the user.

## Architecture

### Backend Components

#### 1. Utility: `backend/utils/emailToken.js`
Handles generation and validation of email verification tokens.

```javascript
// Generate a new token (valid for 24 hours)
const { token, expiresAt } = generateEmailToken();

// Verify a token
const { valid, message } = verifyEmailToken(tokenValue, expiresAtDate);
```

**Token Properties:**
- **Format:** Random hexadecimal string (64 characters)
- **Validity:** 24 hours from generation
- **Usage:** One-time use (cleared after email verification)

#### 2. Utility: `backend/utils/emailService.js`
Handles transactional email delivery using nodemailer.

```javascript
// Send verification email
await sendVerificationEmail(email, token, userName);

// Send welcome email (after verification)
await sendWelcomeEmail(email, userName);
```

**Features:**
- Production/development environment detection
- Ethereal for development (temporary email testing)
- SMTP support for production
- HTML and plain text email templates
- Styled verification links with 24-hour countdown

#### 3. Model Update: `backend/models/User.js`
Added three fields for email verification tracking:

```javascript
emailVerified: { type: Boolean, default: false },
emailVerificationToken: { type: String, default: null },
emailVerificationExpires: { type: Date, default: null },
```

#### 4. Controller: `backend/controllers/authController.js`
Updated with new email verification endpoints and logic.

**Register Function:**
- Generates email verification token
- Sends verification email
- Returns `requiresEmailVerification: true`
- User cannot log in until email is verified

**Login Function:**
- Checks if `emailVerified === true` before allowing login
- Returns `requiresEmailVerification: true` if email not verified

**New: `verifyEmail()` Function:**
- Accepts verification token
- Validates token and expiration
- Marks user's email as verified
- Sends welcome email
- Clears verification token fields

**New: `resendVerificationEmail()` Function:**
- Accepts user's email
- Regenerates new verification token
- Resends verification email
- Used when user didn't receive email or token expired

### Frontend Components

#### 1. Page: `frontend/src/app/verify-email/page.js`
Confirmation page that user visits via email link.

**Flow:**
1. Extract verification token from URL (`?token=xxx`)
2. Display "Verifying..." state
3. Call POST `/api/auth/verify-email` with token
4. Show success/error message
5. Auto-redirect to login on success
6. Offer resend option if token expired

**Features:**
- Loading spinner during verification
- Color-coded success/error messages
- Error recovery with resend functionality
- Auto-redirect after 3 seconds

#### 2. Page: `frontend/src/app/verify-email-pending/page.js`
Page displayed immediately after registration.

**Flow:**
1. Shows user's registered email
2. Explains verification process
3. Offers "Resend Verification Email" button
4. Shows 24-hour token expiration notice
5. Allows navigation to login when ready

**Features:**
- Visual email reminder
- Step-by-step instructions
- Resend button with loading state
- Link to login when verified
- Link to register again if wrong email

#### 3. Context: `frontend/src/context/AuthContext.js`
Updated authentication logic to handle email verification.

**Register Function:**
- Stores registration email in localStorage
- Redirect to `verify-email-pending?email=xxx`
- Shows success toast message

**Login Function:**
- Detects `requiresEmailVerification` error response
- Redirects to `verify-email-pending?email=xxx`
- Shows error toast message

## API Endpoints

### Public Endpoints (No Authentication Required)

#### POST `/api/auth/register`
Register new user and initiate email verification.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "user",
  "phone": "+1234567890",
  "bio": "Optional bio",
  "skills": [],
  "location": "City, Country"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "requiresEmailVerification": true,
  "email": "john@example.com"
}
```

#### POST `/api/auth/verify-email`
Verify user's email with verification token.

**Request:**
```json
{
  "token": "hex_token_from_email_link"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Email verified successfully! You can now login.",
  "email": "john@example.com"
}
```

**Response (Error - Token Expired):**
```json
{
  "success": false,
  "message": "Verification token has expired"
}
```

#### POST `/api/auth/resend-verification-email`
Resend verification email with new token.

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Verification email resent. Please check your inbox."
}
```

#### POST `/api/auth/login`
Login user (requires email verification).

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "jwt_token",
  "user": { /* user object */ }
}
```

**Response (Error - Email Not Verified):**
```json
{
  "success": false,
  "message": "Please verify your email before logging in",
  "requiresEmailVerification": true,
  "email": "john@example.com"
}
```

## User Flow Diagrams

### First-Time Registration Flow

```
┌─────────────────────┐
│  User Registration  │
│      Form           │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────┐
│  POST /api/auth/register │
│  - Create user           │
│  - Generate token        │
│  - Send email            │
└──────────┬───────────────┘
           │
           ▼
┌────────────────────────────────────┐
│  Redirect to verify-email-pending  │
│  - Show registration email         │
│  - Explain verification            │
│  - Offer resend option             │
└──────────┬─────────────────────────┘
           │
      [User checks email]
           │
           ▼
┌────────────────────────────────────┐
│  Click Link in Email               │
│  [APP_URL]/verify-email?token=xxx  │
└──────────┬─────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  POST /api/auth/verify-email         │
│  - Validate token                    │
│  - Mark email as verified            │
│  - Send welcome email                │
└──────────┬───────────────────────────┘
           │
           ▼
┌────────────────────────────────┐
│  Success Page                  │
│  - Show success message        │
│  - Auto-redirect to /login     │
└──────────┬─────────────────────┘
           │
           ▼
┌────────────────────────────────┐
│  Login Page                    │
│  Enter email & password        │
└──────────┬─────────────────────┘
           │
           ▼
┌──────────────────────┐
│  POST /api/auth/login│
│  ✓ Email verified    │
│  ✓ Valid credentials │
└──────────┬───────────┘
           │
           ▼
┌────────────────────────────────┐
│  Logged In                     │
│  Redirect to dashboard         │
└────────────────────────────────┘
```

### Resend Verification Email Flow

```
┌─────────────────────────────────┐
│  User Missing Email?            │
│  - Click Resend button          │
│  - Or failed login attempt      │
└──────────┬──────────────────────┘
           │
           ▼
┌────────────────────────────────────┐
│  POST /api/auth/resend-verification│
│  - Find user by email              │
│  - Check if already verified       │
│  - Generate new token              │
│  - Send new email                  │
└──────────┬─────────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│  Success Toast                   │
│  "Email resent to inbox"         │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│  User Receives New Email         │
│  Click New Link with New Token   │
└──────────┬───────────────────────┘
           │
           ▼
[Continue with verify-email flow]
```

## Configuration

### Environment Variables

**Required:**
```env
# Client URL for verification link
CLIENT_URL=http://localhost:3000

# Sender email address
SENDER_EMAIL=noreply@exlabour.local
```

**Development (Ethereal - Auto-used):**
Automatically uses Ethereal for testing. No configuration needed.

**Production (SMTP):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Dependencies

- `nodemailer@^6.9.7` - Email service

## Testing

### Manual Testing Steps

1. **Register a new account:**
   ```bash
   POST http://localhost:5000/api/auth/register
   {
     "name": "Test User",
     "email": "test@example.com",
     "password": "Test@123",
     "role": "user"
   }
   ```

2. **Check Ethereal inbox:**
   - Development mode auto-creates Ethereal account
   - Preview URL in console logs

3. **Extract verification token:**
   - Visit verification URL from email
   - Or manually call verify-email endpoint with token

4. **Test login without verification:**
   ```bash
   POST http://localhost:5000/api/auth/login
   {
     "email": "test@example.com",
     "password": "Test@123"
   }
   ```
   Expected: 403 error with `requiresEmailVerification: true`

5. **Verify email:**
   ```bash
   POST http://localhost:5000/api/auth/verify-email
   {
     "token": "extracted_token"
   }
   ```

6. **Login after email verification:**
   ```bash
   POST http://localhost:5000/api/auth/login
   {
     "email": "test@example.com",
     "password": "Test@123"
   }
   ```
   Expected: 200 success with accessToken

### Frontend Testing

1. Navigate to http://localhost:3000/register
2. Fill form and submit
3. Redirected to verify-email-pending
4. Check email for verification link
5. Click link and auto-verify
6. Redirected to login
7. Login with verified email

## Security Considerations

1. **Token Expiration:** 24-hour expiration prevents indefinite token validity
2. **One-Time Use:** Tokens are cleared after verification
3. **Database Validation:** Tokens verified against stored database values
4. **Email Validation:** Uses express-validator for email format
5. **Password Requirements:** Minimum 6 characters with bcrypt hashing
6. **HTTP-Only Cookies:** Refresh tokens stored securely
7. **CORS Protection:** Cross-origin requests validated

## Rate Limiting

The following endpoints should have rate limiting added (optional):
- `/api/auth/resend-verification-email` - 3 attempts per hour per email
- `/api/auth/register` - Already limited via registerLimiter middleware

## Error Handling

| Error | Status | Message | Action |
|-------|--------|---------|--------|
| Token missing | 400 | "Verification token is required" | Show form to enter token |
| Token invalid | 400 | "Invalid verification token" | Offer resend |
| Token expired | 400 | "Verification token has expired" | Offer resend |
| Email not verified | 403 | "Please verify your email before logging in" | Redirect to verify-email-pending |
| Email already verified | 400 | "Email is already verified" | Redirect to login |
| User not found | 404 | "User not found" | Redirect to register |
| Email sending failed | 500 | "Failed to send verification email" | Show error with retry option |

## Future Enhancements

1. **Email Webhook Verification:** Confirm bounce/complaint notifications
2. **SPF/DKIM Configuration:** Improve email deliverability
3. **Email Notification Service Integration:** Track verification events
4. **Admin Dashboard:** View unverified users and resend options
5. **Bulk Verification:** Admin tool to resend emails to multiple users
6. **SMS Verification Option:** Alternative verification method
7. **Social Login Integration:** Skip email verification for OAuth users
8. **Email Templates in Database:** Dynamic template management

## Monitoring

Monitor these metrics in production:
- Email delivery success rate
- Verification completion rate
- Token expiration rate
- Resend request frequency
- Time to email verification

## Support

For issues or questions about email verification:
1. Check `.env` for proper configuration
2. Verify MongoDB connection
3. Check email service logs
4. Review browser console for frontend errors
5. Check server logs for backend errors
