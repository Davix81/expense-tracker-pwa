# Offline Detection Testing Guide

## Task 6.2: Add offline detection and messaging

This document describes how to manually test the offline detection functionality for biometric authentication.

## Implementation Summary

### Changes Made

1. **WebAuthn Service** (`src/app/services/webauthn.service.ts`)
   - Added `isOnline()` private method to check `navigator.onLine` status
   - Updated `register()` method to check connectivity before attempting registration
   - Updated `authenticate()` method to check connectivity before attempting authentication
   - Returns user-friendly error message in Catalan when offline

2. **Login Page Component** (`src/app/components/login-page/login-page.component.ts`)
   - Added `isOffline` property to track connectivity status
   - Added `setupConnectivityMonitoring()` method to listen for online/offline events
   - Updated `handleBiometricError()` to display specific message for offline errors
   - Biometric button is disabled when offline

3. **Login Page Template** (`src/app/components/login-page/login-page.component.html`)
   - Added offline warning banner that displays when `isOffline` is true
   - Biometric button is disabled when offline using `[disabled]="biometricLoading || isOffline"`

4. **Login Page Styles** (`src/app/components/login-page/login-page.component.scss`)
   - Added `.offline-banner` styles with warning colors (orange background)
   - Responsive styles for mobile devices

## Manual Testing Steps

### Test 1: Offline Detection on Page Load

1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Check "Offline" checkbox
4. Navigate to the login page
5. **Expected Result**: Orange warning banner appears saying "Sense connexió a internet. L'autenticació biomètrica no està disponible."
6. **Expected Result**: Biometric login button (if visible) should be disabled

### Test 2: Going Offline While on Login Page

1. Load the login page while online
2. Open Chrome DevTools (F12)
3. Go to Network tab
4. Check "Offline" checkbox
5. **Expected Result**: Orange warning banner appears immediately
6. **Expected Result**: Biometric login button becomes disabled

### Test 3: Coming Back Online

1. Start with the page in offline mode (warning banner visible)
2. Uncheck "Offline" in Chrome DevTools Network tab
3. **Expected Result**: Warning banner disappears
4. **Expected Result**: Biometric login button becomes enabled (if user has credentials)
5. **Expected Result**: Any offline-related error messages are cleared

### Test 4: Attempting Biometric Registration While Offline

1. Log in with password while offline
2. If biometric prompt appears, accept it
3. **Expected Result**: Error message "L'autenticació biomètrica requereix connexió a internet"
4. **Expected Result**: User can retry or skip

### Test 5: Attempting Biometric Login While Offline

1. Have biometric credentials already registered
2. Go offline (Network tab > Offline)
3. Try to click the biometric login button
4. **Expected Result**: Button is disabled and cannot be clicked
5. **Expected Result**: Warning banner is visible

### Test 6: Password Authentication Works Offline

1. Go offline (Network tab > Offline)
2. Enter password in the password field
3. Click "Accedir" button
4. **Expected Result**: Login succeeds (password authentication doesn't require network)
5. **Expected Result**: User is redirected to dashboard

## Requirements Validation

✅ **Requirement 4.3**: When the PWA is offline, inform the user that biometric authentication requires network connectivity
- Implemented via offline warning banner
- Implemented via disabled biometric button
- Implemented via error messages in WebAuthn service

✅ **Password authentication works offline**
- AuthService doesn't make network calls
- Only stores encryption key in sessionStorage
- Verified by code review

## Technical Details

### Connectivity Detection

The implementation uses the standard Web API for connectivity detection:

```typescript
// Check current status
navigator.onLine // returns true/false

// Listen for changes
window.addEventListener('online', handler);
window.addEventListener('offline', handler);
```

### Error Messages

All error messages are in Catalan to match the application language:

- Offline during registration: "L'autenticació biomètrica requereix connexió a internet"
- Offline during authentication: "L'autenticació biomètrica requereix connexió a internet. Si us plau, utilitza la contrasenya per iniciar sessió sense connexió."
- Warning banner: "Sense connexió a internet. L'autenticació biomètrica no està disponible."

## Notes

- The offline detection is immediate and reactive
- Password authentication is completely offline-capable
- Biometric authentication requires network connectivity (WebAuthn API requirement)
- The UI clearly communicates the offline state to users
- Users always have the password fallback option
