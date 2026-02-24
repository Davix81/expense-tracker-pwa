# Biometric Credential Invalidation Testing Guide

This guide explains how to test the device biometric setting change detection and handling functionality (Task 6.3).

## Overview

The implementation detects when device biometric settings have changed and handles credential invalidation gracefully by:
1. Detecting credential invalidation during authentication attempts
2. Automatically removing invalid credentials
3. Prompting users to re-register with clear error messages
4. Performing health checks on stored credentials

## Implementation Details

### WebAuthn Service Changes

#### New Interfaces
- `CredentialValidationResult`: Result of credential validation checks

#### New Methods
1. **`validateCredential(username: string)`**: Validates if a stored credential is still valid
   - Attempts a test authentication to verify credential accessibility
   - Returns validation result with reregistration flag
   - Detects specific errors indicating credential invalidation

2. **`checkCredentialHealth(username: string)`**: Non-intrusive credential health check
   - Checks if credential exists and device capability is available
   - Attempts to decrypt stored password as a health indicator
   - Returns boolean indicating credential health

#### Updated Methods
1. **`authenticate()`**: Enhanced error handling
   - Detects credential invalidation errors (InvalidStateError, NotAllowedError)
   - Automatically removes invalid credentials
   - Returns specific error message prompting re-registration

### Login Page Component Changes

#### Updated Methods
1. **`checkBiometricAvailability()`**: Added credential health check
   - Performs health check before showing biometric button
   - Removes invalid credentials automatically
   - Hides biometric button if credential is unhealthy

2. **`handleBiometricError()`**: Enhanced error detection
   - Detects credential invalidation error messages
   - Displays user-friendly message about device setting changes
   - Hides biometric button when credential is invalid
   - Prompts user to use password and re-register

## Testing Scenarios

### Scenario 1: Credential Invalidation Detection During Login

**Steps:**
1. Register biometric authentication successfully
2. Simulate device biometric setting change (see methods below)
3. Attempt biometric login
4. Verify error message indicates credential is no longer valid
5. Verify biometric button is hidden
6. Login with password
7. Verify biometric prompt appears for re-registration

**Expected Results:**
- Error message: "La credencial biomètrica ja no és vàlida (possiblement per canvis en la configuració del dispositiu)..."
- Biometric button disappears from login screen
- User can still login with password
- After password login, biometric prompt appears for re-registration

### Scenario 2: Credential Health Check on Page Load

**Steps:**
1. Register biometric authentication successfully
2. Close the application
3. Simulate device biometric setting change
4. Reopen the application and navigate to login page
5. Verify biometric button does not appear (credential health check failed)

**Expected Results:**
- Biometric button is not shown on login page
- Console shows warning: "Biometric credential is no longer valid and has been removed"
- User can login with password
- After password login, biometric prompt appears for re-registration

### Scenario 3: Successful Credential Validation

**Steps:**
1. Register biometric authentication successfully
2. Close and reopen the application
3. Verify biometric button appears
4. Perform biometric login
5. Verify successful authentication

**Expected Results:**
- Biometric button is shown on login page
- Biometric authentication succeeds
- User is logged in and redirected to dashboard

## How to Simulate Device Biometric Setting Changes

Since actual device biometric setting changes are difficult to simulate in a development environment, here are some approaches:

### Method 1: Browser DevTools (Recommended for Testing)
1. Open browser DevTools
2. Go to Application > Local Storage
3. Find the `webauthn_credentials` key
4. Modify the `credentialId` value to an invalid string
5. Refresh the page and attempt biometric login

### Method 2: Clear Browser Credentials
1. In Chrome: Settings > Privacy and security > Security > Manage passkeys
2. Remove the passkey for the application
3. Refresh the page and attempt biometric login

### Method 3: Actual Device Changes (Real Testing)
1. On iOS: Settings > Face ID & Passcode > Reset Face ID
2. On Android: Settings > Security > Face unlock > Delete face data
3. Re-enroll biometric data
4. Attempt biometric login in the application

### Method 4: Code Modification (Development Only)
Temporarily modify the `authenticate()` method to throw an `InvalidStateError`:
```typescript
// In webauthn.service.ts, at the start of authenticate()
throw new DOMException('Credential not found', 'InvalidStateError');
```

## Verification Checklist

- [ ] Invalid credentials are detected during authentication
- [ ] Invalid credentials are automatically removed from storage
- [ ] User-friendly error message is displayed
- [ ] Biometric button is hidden after credential invalidation
- [ ] User can still login with password
- [ ] Biometric prompt appears after password login for re-registration
- [ ] Credential health check runs on page load
- [ ] Unhealthy credentials are removed before showing biometric button
- [ ] Console warnings are logged for debugging

## Error Messages

### Spanish (Catalan)
- **Credential invalidation**: "La credencial biomètrica ja no és vàlida (possiblement per canvis en la configuració del dispositiu). Si us plau, utilitza la contrasenya per iniciar sessió i registra de nou l'autenticació biomètrica."
- **Console warning**: "Biometric credential is no longer valid and has been removed"

### Error Detection Patterns
The implementation detects these error patterns:
- Error names: `InvalidStateError`, `NotAllowedError`
- Error messages containing: "credential", "authenticator", "ya no es válida", "no longer valid", "regístrate de nuevo", "re-register"

## Requirements Validation

This implementation satisfies **Requirement 4.5**:
> "WHEN the device biometric settings change, THE WebAuthn_Service SHALL detect and handle credential invalidation appropriately"

### How Requirements Are Met:
1. **Detection**: Errors during authentication are analyzed to detect credential invalidation
2. **Handling**: Invalid credentials are automatically removed from storage
3. **User Experience**: Clear error messages guide users to re-register
4. **Graceful Degradation**: Password authentication remains available as fallback
5. **Proactive Checking**: Health checks prevent showing invalid biometric options

## Notes

- The implementation uses error detection rather than proactive validation to minimize user prompts
- Credential health checks use password decryption as a non-intrusive indicator
- The `validateCredential()` method may prompt for biometric verification and should be used sparingly
- All error messages are in Catalan to match the application language
- The implementation maintains backward compatibility with existing credentials
