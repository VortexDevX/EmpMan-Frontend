# Frontend and Pi-Gateway Integration

## Trust boundaries

- The React bundle is public and contains no API credentials.
- Human users authenticate with password plus TOTP and receive a short-lived, session-bound JWT.
- The Pi gateway, ML worker, and local agent use different server-side API keys with narrow service roles.
- Admin and manager permissions come from the authenticated employee record, never from browser-controlled role data.

## Direct browser login

```text
React -> POST /api/v1/auth/preflight (employee_code + password)
  existing TOTP -> POST /api/v1/auth/login (+ TOTP)
  first login   -> setup_token -> /register -> /confirm-totp -> login
FastAPI -> session-bound access JWT
React -> Authorization: Bearer <JWT>
```

The preflight response is generic on invalid credentials. TOTP enrollment requires the password-verified, short-lived setup token.

## Captive portal and SSO

```text
Employee -> Pi portal (password + TOTP)
Pi -> FastAPI login and gateway-token request using its server key
Browser -> FastAPI gateway-login with one-time gateway token
FastAPI -> frontend#code=<one-time-exchange-code>
React -> POST /api/v1/auth/exchange
FastAPI -> session-bound access JWT
```

The exchange code expires after 60 seconds and is single-use. Access JWTs and employee data are not included in the redirect URL.

## Configuration

Frontend:

```env
VITE_API_URL=https://api.example.com
VITE_GATEWAY_API_URL=http://gateway.local
VITE_GATEWAY_WITH_CREDENTIALS=true
```

Backend configuration belongs only on the server. See `docs/SECRETS_AND_ROTATION.md`; do not add `VITE_*_API_KEY` variables.

## Authorization behavior

- Employee-scoped reads/writes: self only unless a manager owns the direct-report relationship or the user is an admin.
- Approvals and task review: manager of the target employee or admin.
- Raw ML features and prediction writes: ML service or admin.
- Gateway TOTP verification and gateway-token creation: Pi service only.
- Telemetry ingestion: service identities; registered device ownership must match the submitted employee.

## Deployment checks

- Configure explicit CORS and redirect origins.
- Use HTTPS for internet-facing API/frontend traffic.
- Set a strong Flask `SECRET_KEY`; enable secure cookies when the gateway is served over HTTPS.
- Rotate any key ever committed or shared in documentation.
- Run frontend build/lint, backend tests, gateway tests, local-agent tests, ML tests, and dependency audits before release.
