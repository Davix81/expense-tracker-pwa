# PWA Lifecycle Testing Guide

This guide provides instructions for manually testing the PWA lifecycle event handling and WebAuthn functionality in installed PWA context on iOS Safari and Android Chrome.

## Requirements Tested

- **Requirement 4.1**: WebAuthn service functions correctly when running as installed PWA
- **Requirement 4.2**: Support iOS Safari and Android Chrome biometric authentication
- **Requirement 4.4**: Handle PWA lifecycle events without losing authentication state

## Prerequisites

1. Build the app in production mode: `npm run build`
2. Deploy to a server with HTTPS (required for WebAuthn and PWA)
3. Access the app from mobile devices

## Test Scenarios

### Test 1: iOS Safari PWA Installation and Authentication State

**Platform**: iOS Safari (iPhone/iPad)

**Steps**:
1. Open the app in Safari on iOS
2. Tap the Share button
3. Select "Add to Home Screen"
4. Open the app from the home screen icon
5. Log in with password
6. Accept biometric enrollment when prompted
7. Complete biometric registration (Face ID/Touch ID)
8. Log out
9. Close the PWA completely (swipe up from app switcher)
10. Reopen the PWA from home screen
11. Verify biometric login button is visible
12. Tap biometric login button
13. Complete biometric authentication

**Expected Results**:
- ✅ PWA installs successfully
- ✅ Biometric enrollment works in PWA context
- ✅ WebAuthn credentials persist after closing/reopening PWA
- ✅ Biometric login works after PWA restart
- ✅ Authentication state is preserved across PWA lifecycle events
- ✅ Console logs show "Running as installed PWA"
- ✅ Console logs show "WebAuthn verified in PWA context"

### Test 2: Android Chrome PWA Installation and Authentication State

**Platform**: Android Chrome

**Steps**:
1. Open the app in Chrome on Android
2. Tap the menu (three dots)
3. Select "Add to Home screen" or "Install app"
4. Open the app from the home screen icon
5. Log in with password
6. Accept biometric enrollment when prompted
7. Complete biometric registration (fingerprint/face unlock)
8. Log out
9. Close the PWA completely (swipe away from recent apps)
10. Reopen the PWA from home screen
11. Verify biometric login button is visible
12. Tap biometric login button
13. Complete biometric authentication

**Expected Results**:
- ✅ PWA installs successfully
- ✅ Biometric enrollment works in PWA context
- ✅ WebAuthn credentials persist after closing/reopening PWA
- ✅ Biometric login works after PWA restart
- ✅ Authentication state is preserved across PWA lifecycle events
- ✅ Console logs show "Running as installed PWA"
- ✅ Console logs show "WebAuthn verified in PWA context"

### Test 3: Service Worker Update with Active Session

**Platform**: iOS Safari or Android Chrome (installed PWA)

**Steps**:
1. Install and open the PWA
2. Log in with biometric authentication
3. Navigate to dashboard (authenticated state)
4. Deploy a new version of the app (update service worker)
5. Wait for update detection (or force check)
6. Accept the update prompt
7. App reloads with new version

**Expected Results**:
- ✅ Authentication state is preserved before update
- ✅ Console logs show "Authentication state preserved"
- ✅ After reload, user remains logged in (or can re-authenticate with biometrics)
- ✅ WebAuthn credentials remain accessible after update
- ✅ No data loss occurs during service worker update

### Test 4: PWA Lifecycle Event Handling

**Platform**: iOS Safari or Android Chrome (installed PWA)

**Steps**:
1. Install and open the PWA
2. Log in with password and register biometric credentials
3. Open browser DevTools/Console (if available)
4. Monitor console logs for lifecycle events
5. Put app in background (switch to another app)
6. Return to PWA
7. Lock device screen
8. Unlock device and return to PWA
9. Force close and reopen PWA

**Expected Results**:
- ✅ Console logs show "PWA lifecycle service initialized"
- ✅ Console logs show platform detection (iOS/Android)
- ✅ Console logs show "Authentication state preserved" during lifecycle events
- ✅ WebAuthn credentials remain accessible throughout
- ✅ Encryption key verification succeeds after lifecycle events
- ✅ No authentication errors occur during transitions

### Test 5: Platform Detection

**Platform**: iOS Safari and Android Chrome

**Steps**:
1. Open browser DevTools/Console
2. Check console logs on app initialization
3. Verify platform information is logged correctly

**Expected Results for iOS**:
```
Platform info: { platform: 'ios', browser: 'safari', isPwaCapable: true }
```

**Expected Results for Android Chrome**:
```
Platform info: { platform: 'android', browser: 'chrome', isPwaCapable: true }
```

## Debugging

If tests fail, check the following:

1. **HTTPS Required**: WebAuthn and PWA features require HTTPS
2. **Browser Console**: Check for error messages in console logs
3. **Storage**: Verify localStorage contains `webauthn_credentials`
4. **Service Worker**: Check if service worker is registered in DevTools
5. **Platform Support**: Verify device has biometric hardware enabled

## Console Log Checklist

During testing, you should see these console logs:

- ✅ "PWA lifecycle service initialized"
- ✅ "Platform info: { ... }"
- ✅ "WebAuthn verified in PWA context"
- ✅ "Running as installed PWA" (when installed)
- ✅ "Authentication state preserved: { ... }"
- ✅ "Encryption key verified as accessible"

## Known Limitations

1. **iOS Safari**: Service worker updates may require manual app restart
2. **Android Chrome**: Background sync may affect authentication state
3. **Both Platforms**: Biometric settings changes may invalidate credentials

## Reporting Issues

If you encounter issues during testing, please report:

1. Platform and browser version
2. Device model
3. Console error messages
4. Steps to reproduce
5. Expected vs actual behavior
