# Login Workflow

## Overview

The login flow is handled by `LoginPage.tsx` (UI) and `AuthContext.tsx` (state/logic), consuming the remote API at `https://manan.digimeck.in`.

---

## Normal Login (form-based)

### 1. User fills the form (`LoginPage.tsx`)

Three fields are collected simultaneously:
- **Employee Code** — e.g. `EMP101` (force-uppercased)
- **Password**
- **Authenticator Code** — 6-digit TOTP from Google Authenticator

> Submit button is disabled until all three fields are filled and `totpCode.length === 6`.

---

### 2. `login()` is called (`AuthContext.tsx:login`)

Two sequential API calls are made:

#### API Call 1 — Resolve employee code to ID
```
GET /api/v1/employees/by-code/{employeeCode}
Headers: X-API-Key: <VITE_WEB_API_KEY>
```
Returns: `{ id, employee_code, role, is_active, full_name, ... }`

- If `is_active === false` → throws `"Your account is inactive."`

#### API Call 2 — Full authentication
```
POST /api/v1/auth/login
Headers: X-API-Key: <VITE_WEB_API_KEY>
Body: { employee_id, password, totp_code }
```
Returns (success `200`): `{ access_token, employee_id, employee_code, role, full_name }`

Possible error codes:
| Status | Meaning |
|--------|---------|
| `401` | Wrong password or TOTP code |
| `400` | TOTP not registered / password not set |
| `404` | Employee not found |

---

### 3. Token & user stored in `localStorage`

```js
localStorage.setItem("access_token", data.access_token);  // JWT
localStorage.setItem("auth_user", JSON.stringify({
  employee_id: data.employee_id,
  employee_code: data.employee_code,
  role: data.role,          // "admin" | "manager" | "employee"
  full_name: data.full_name
}));
```

> **Important:** The `role` is taken from the login API response, **not** decoded from the JWT client-side.

---

### 4. Redirect after login

`LoginPage` reads role from `localStorage` and calls `getDefaultRoute(role)`.  
Currently all roles redirect to `/dashboard`.

---

## Session Restore (page reload)

On every page load, `AuthContext` (in a `useEffect`) reads from `localStorage`:

```js
const storedToken = localStorage.getItem("access_token");
const storedUser  = localStorage.getItem("auth_user");
if (storedToken && storedUser) {
  setUser(JSON.parse(storedUser));   // no JWT validation — trusts localStorage
}
```

No server call is made to validate the token on restore.

---

## SSO Login (captive portal redirect)

When a user authenticates via the Pi-Gateway captive portal, they are redirected to:
```
/app/#token=<jwt>&employee_id=<id>&role=<role>&employee_code=<code>&full_name=<name>
```

`AuthContext` detects `#token=` in the URL hash, parses the params, stores them in `localStorage`, and skips the login form entirely.

---

## Every Subsequent API Call

Every request through the `api` Axios instance (remote API) automatically attaches:

```
X-API-Key: <VITE_WEB_API_KEY>        ← always
Authorization: Bearer <access_token>  ← from localStorage, if present
```

If the server returns `401` and the request is not an auth call, the interceptor clears `localStorage` and redirects to `/app/login`.

---

## Role-Based Access

| Role | Employees list (`/api/v1/employees/`) | Dashboard | Admin Devices |
|------|---------------------------------------|-----------|---------------|
| `employee` | ❌ 403 | ✅ | ❌ |
| `manager`  | ✅ 200 | ✅ | ❌ |
| `admin`    | ✅ 200 | ✅ | ✅ |

> The backend enforces roles via the **JWT payload**. The `X-API-Key` alone is not sufficient for role-restricted endpoints.

---

## Key Files

| File | Purpose |
|------|---------|
| `src/pages/LoginPage.tsx` | Login form UI and error handling |
| `src/contexts/AuthContext.tsx` | Auth state, `login()`, `logout()`, session restore |
| `src/lib/api.ts` | Axios instances, `X-API-Key` + Bearer token interceptors |
| `src/lib/routes.ts` | `getDefaultRoute(role)` — post-login redirect logic |
| `.env` | `VITE_WEB_API_KEY`, `VITE_API_URL` |
