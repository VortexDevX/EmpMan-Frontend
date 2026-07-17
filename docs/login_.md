# Login Workflow

The React application authenticates against the FastAPI service. Browser code never contains or sends a shared API key.

## Normal login

1. `POST /api/v1/auth/preflight` sends `employee_code` and `password`.
2. Existing TOTP users enter their six-digit code and call `POST /api/v1/auth/login` with `employee_code`, `password`, and `totp_code`.
3. First-time users receive a ten-minute, purpose-limited setup token. That token is required by `POST /api/v1/auth/register`; an employee ID alone cannot enroll TOTP.
4. The setup QR is shown once. `POST /api/v1/auth/confirm-totp` verifies the authenticator code.
5. Successful login returns an access JWT bound to an active `auth_sessions` database record. Logout revokes that one session.

All protected API requests send `Authorization: Bearer <access_token>`. The backend loads the employee and active session, then enforces self/admin/direct-report access. Client-side route guards are only presentation; they are not the authorization boundary.

## Gateway SSO

The Pi gateway requests a 60-second one-time gateway token. The API validates it and redirects the browser with a separate one-time exchange code in the URL fragment. The frontend removes the fragment immediately and posts the code to `/api/v1/auth/exchange`. A reusable access token is never placed in the redirect URL.

## Password reset

HR import creates a one-time reset link containing a random token ID and token. `/reset-password` submits both values and the new password. The backend stores only a password hash of the reset token, expires it after seven days, marks it used after success, and revokes existing sessions.

## Storage

The current frontend stores the access token and display-safe user summary in `localStorage`. This is protected from the previous shared-key vulnerability, but an HttpOnly same-site session cookie would further reduce token exposure if frontend/API hosting is consolidated.

Key files:

- `src/contexts/AuthContext.tsx`: login, setup state, SSO exchange, logout.
- `src/lib/api.ts`: bearer-token interceptor and auth contracts.
- `src/pages/SetupTotpPage.tsx`: one-time TOTP setup.
- `src/pages/ResetPasswordPage.tsx`: one-time password reset.
