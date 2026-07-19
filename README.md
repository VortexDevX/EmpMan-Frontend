# Workforce OS Frontend

React/Vite frontend for Employee Management. The production site uses the Employee API at `https://emp-manan.mvlab.cloud` and supports employee, manager, and administrator views.

## Authentication

Browser authentication uses an HttpOnly, Secure, SameSite session cookie. The frontend does not persist access tokens in Local Storage. State-changing API requests include a session-bound CSRF token held only in memory; refreshing the page restores both the user and CSRF state through `/api/v1/auth/session`.

The API still returns a bearer token for native clients and compatibility, but this browser client intentionally ignores it.

## Environment

Copy `.env.example` to `.env` for local overrides. `VITE_*` values are public and must never contain credentials.

```env
VITE_API_URL=https://emp-manan.mvlab.cloud
VITE_ENABLE_GATEWAY_ADMIN=false
VITE_GATEWAY_API_URL=
VITE_GATEWAY_WITH_CREDENTIALS=false
VITE_BASE_PATH=/
```

The public Vercel frontend should leave gateway administration disabled. Enable it only for a trusted browser that can reach a correctly configured HTTPS Pi gateway.

## Development

```powershell
npm ci
npm run dev
```

For a local HTTP Employee API, set `AUTH_COOKIE_SECURE=false` only in the API's local development environment. Production must keep it `true`.

## Verification

```powershell
npm run lint
npm run test
npm run build
npm run test:a11y
npm audit --omit=dev
```

`npm run test:a11y` uses Microsoft Edge through Playwright. It checks desktop/mobile login accessibility and authenticated mobile navigation with mocked API responses. The broader repository test and release procedure is in `../TESTING_GUIDE.md`.
