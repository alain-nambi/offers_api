# Authentication Improvements

## Overview

I've implemented comprehensive authentication improvements to solve the session timeout issues you were experiencing. Your account will now stay connected for much longer periods with automatic token refresh.

## Changes Made

### Backend Changes

#### 1. Extended JWT Token Lifetimes (`backend/config/base.py`)
- **Access Token**: Extended from 1 hour to **24 hours**
- **Refresh Token**: Extended from 1 day to **7 days**
- **Redis Cache**: Tokens cached for 24 hours to match access token lifetime

#### 2. Added Token Refresh Endpoint (`backend/authentication/views.py`)
- New endpoint: `POST /api/v1/auth/refresh/`
- Automatically generates new access tokens using refresh tokens
- Includes comprehensive Swagger documentation
- Handles token rotation and caching

### Frontend Changes

#### 1. Enhanced Token Management (`frontend/src/services/auth.ts`)
- Added `tokenManager` utility for centralized token handling
- Token expiration checking
- Secure token storage and retrieval

#### 2. Automatic Token Refresh (`frontend/src/services/api.ts`)
- **Automatic refresh**: When a request fails with 401, automatically tries to refresh the token
- **Request queuing**: Multiple failed requests are queued and retried after token refresh
- **Graceful fallback**: If refresh fails, automatically redirects to login page
- **No duplicate refresh attempts**: Prevents multiple simultaneous refresh requests

#### 3. Proactive Token Refresh (`frontend/src/utils/tokenRefresh.ts`)
- **Background refresh**: Automatically refreshes tokens 5 minutes before expiry
- **Periodic checks**: Runs every 30 minutes to ensure tokens stay fresh
- **Smart timing**: Only refreshes when necessary

#### 4. Enhanced Auth Context (`frontend/src/services/auth-context.tsx`)
- Better error handling and recovery
- Automatic token refresh integration
- Improved loading states
- Session persistence across browser refreshes

#### 5. Debug Tools (Development Only)
- `AuthDebugger` component shows auth status in development
- Console functions: `testAuth()` and `logTokenInfo()`
- Token inspection utilities

## How It Works

### 1. Login Process
1. User logs in with credentials
2. Backend returns access token (24h) and refresh token (7d)
3. Tokens are stored securely in localStorage
4. Proactive refresh manager starts monitoring token expiry

### 2. Automatic Token Refresh
1. **Proactive Refresh**: Every 30 minutes, checks if token expires within 5 minutes
2. **Reactive Refresh**: If API request fails with 401, automatically refreshes token
3. **Seamless Experience**: User never sees authentication errors or gets logged out unexpectedly

### 3. Session Persistence
1. **Browser Refresh**: Auth state is restored from localStorage on page reload
2. **Long Sessions**: With 24-hour access tokens and 7-day refresh tokens, users stay logged in for up to a week
3. **Automatic Cleanup**: If refresh fails, tokens are cleared and user is redirected to login

## Benefits

### ✅ Extended Session Duration
- **24-hour access tokens** instead of 1 hour
- **7-day refresh tokens** instead of 1 day
- Users can stay logged in for up to a week without re-entering credentials

### ✅ Seamless User Experience
- **No unexpected logouts** while using the application
- **Automatic token refresh** happens in the background
- **Instant recovery** from temporary network issues

### ✅ Robust Error Handling
- **Graceful degradation** when refresh fails
- **Automatic retry** for failed requests after token refresh
- **Clear feedback** when manual login is required

### ✅ Security Maintained
- **Token rotation** ensures old tokens are invalidated
- **Secure storage** in localStorage with proper cleanup
- **Blacklisting** of refresh tokens on logout

## Testing the Improvements

### 1. Basic Testing
1. Log in to your application
2. Navigate to different pages (offers, subscriptions, etc.)
3. Leave the application open for several hours
4. Continue using - you should not be logged out

### 2. Development Testing
In development mode, you'll see a debug panel in the top-right corner showing:
- Loading state
- Authentication status
- Current user

Open browser console and run:
```javascript
// Test authentication flow
testAuth()

// View token information
logTokenInfo()
```

### 3. Network Testing
1. Open browser DevTools → Network tab
2. Use the application normally
3. Look for automatic refresh requests to `/auth/refresh/`
4. Verify that failed requests are automatically retried

## Configuration

### Adjusting Token Lifetimes
Edit `backend/config/base.py`:
```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),  # Adjust as needed
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),   # Adjust as needed
    # ... other settings
}
```

### Adjusting Refresh Timing
Edit `frontend/src/utils/tokenRefresh.ts`:
```typescript
private readonly REFRESH_INTERVAL = 30 * 60 * 1000; // Check every 30 minutes
private readonly REFRESH_THRESHOLD = 5 * 60 * 1000; // Refresh 5 minutes before expiry
```

## Troubleshooting

### Issue: Still getting logged out
**Solution**: Check browser console for errors. Run `testAuth()` to diagnose.

### Issue: Tokens not refreshing
**Solution**: Verify refresh endpoint is working: `curl -X POST http://localhost:8000/api/v1/auth/refresh/ -H "Content-Type: application/json" -d '{"refresh":"your_refresh_token"}'`

### Issue: Redirect loop to login
**Solution**: Clear localStorage and log in again. Check if backend is running.

## Security Considerations

1. **Token Storage**: Tokens are stored in localStorage. For higher security, consider httpOnly cookies.
2. **Token Rotation**: Refresh tokens are rotated on each use to prevent replay attacks.
3. **Automatic Cleanup**: Tokens are cleared on logout and authentication failures.
4. **HTTPS**: Always use HTTPS in production to protect tokens in transit.

## Production Deployment

1. **Environment Variables**: Set appropriate token lifetimes for production
2. **HTTPS**: Ensure all communication is over HTTPS
3. **Monitoring**: Monitor token refresh rates and authentication failures
4. **Backup**: Consider implementing remember-me functionality for longer sessions

Your authentication system is now much more robust and user-friendly! Users will experience seamless, long-lasting sessions without unexpected logouts.