# Frontend Integration Guide
## Integrating Vite Frontend with Pi-Gateway Captive Portal

---

## 🎯 Goal

After employee authenticates on Pi-Gateway captive portal (172.17.1.1), 
automatically redirect them to the Vite dashboard (https://manan.digimeck.in/app) 
with seamless auto-login using a secure token exchange.

---

## 📋 Prerequisites

- ✅ Pi-Gateway running and working (TOTP auth functional)
- ✅ Remote FastAPI backend running at https://manan.digimeck.in
- ✅ Vite frontend built and ready (uses same backend API)
- ✅ All three share the same PostgreSQL database

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION FLOW                          │
└─────────────────────────────────────────────────────────────────┘

1. Employee WiFi Connection
   └─> Captive Portal (172.17.1.1)
       └─> Employee enters: EMP101 + TOTP code

2. Pi-Gateway Validates
   └─> POST /api/v1/auth/verify → Remote API
       └─> Response: { "valid": true, "employee_id": 1, "role": "employee" }

3. Pi-Gateway Grants Internet
   └─> iptables rule added for MAC address
       └─> Employee now has internet access

4. Pi-Gateway Gets Gateway Token (NEW)
   └─> POST /api/v1/auth/gateway-token?employee_id=1
       └─> Response: { "token": "short-lived-token-xyz" }

5. Pi-Gateway Redirects
   └─> Browser redirects to:
       https://manan.digimeck.in/api/v1/auth/gateway-login?token=xyz

6. Remote API Validates Token
   └─> Token valid (60 sec window)
       └─> Creates JWT access token
           └─> Redirects to frontend:
               https://manan.digimeck.in/app#token=JWT&employee_id=1&role=employee

7. Vite Frontend Auto-Login
   └─> Reads token from URL hash
       └─> Stores in localStorage
           └─> Employee sees dashboard (logged in automatically)
```

---

## 📦 PART 1: Remote Server Setup (Ubuntu)

### Step 1.1 — Build Vite Frontend

On your **Windows/dev machine** where frontend code lives:

```bash
cd frontend
npm run build
```

This creates `frontend/dist/` folder with compiled assets.

---

### Step 1.2 — Copy Frontend to Ubuntu Server

```bash
# From your Windows/dev machine terminal
scp -r dist/ ubuntu@YOUR_UBUNTU_IP:/tmp/frontend-dist/
```

On **Ubuntu server**:

```bash
sudo mkdir -p /opt/employee-api/frontend
sudo mv /tmp/frontend-dist/* /opt/employee-api/frontend/
sudo chown -R ubuntu:ubuntu /opt/employee-api/frontend
```

Verify files copied:
```bash
ls -la /opt/employee-api/frontend/
# Should show: index.html, assets/, vite.svg, etc.
```

---

### Step 1.3 — Install Python Package for Static Files

```bash
cd /opt/employee-api
source venv/bin/activate
pip install aiofiles --break-system-packages
```

---

### Step 1.4 — Update FastAPI to Serve Frontend

Backup current main.py:
```bash
cp /opt/employee-api/app/main.py /opt/employee-api/app/main.py.backup
```

Create new main.py with frontend serving:

```bash
cat > /opt/employee-api/app/main.py << 'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from app.api.v1.routes import (
    health, auth, employees, departments,
    devices, tasks, surveys, holidays,
    telemetry, ml, hr_import, dashboard
)

app = FastAPI(
    title="Employee API",
    description="Smart Workforce Optimization Backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== API ROUTES ====================
app.include_router(health.router,       prefix="/api/v1",              tags=["Health"])
app.include_router(auth.router,         prefix="/api/v1/auth",         tags=["Auth"])
app.include_router(employees.router,    prefix="/api/v1/employees",    tags=["Employees"])
app.include_router(departments.router,  prefix="/api/v1/departments",  tags=["Departments"])
app.include_router(devices.router,      prefix="/api/v1/devices",      tags=["Devices"])
app.include_router(tasks.router,        prefix="/api/v1/tasks",        tags=["Tasks"])
app.include_router(surveys.router,      prefix="/api/v1/surveys",      tags=["Surveys"])
app.include_router(holidays.router,     prefix="/api/v1/holidays",     tags=["Holidays"])
app.include_router(telemetry.router,    prefix="/api/v1/telemetry",    tags=["Telemetry"])
app.include_router(ml.router,           prefix="/api/v1/ml",           tags=["ML"])
app.include_router(hr_import.router,    prefix="/api/v1/hr",           tags=["HR Import"])
app.include_router(dashboard.router,    prefix="/api/v1/dashboard",    tags=["Dashboard"])

@app.get("/")
def root():
    return {
        "message": "Employee API is running",
        "docs": "/docs",
        "app": "/app",
        "version": "1.0.0"
    }

# ==================== FRONTEND SERVING ====================
FRONTEND_DIR = "/opt/employee-api/frontend"

if os.path.exists(FRONTEND_DIR):
    # Serve static assets (JS, CSS, images)
    app.mount("/app/assets", StaticFiles(directory=f"{FRONTEND_DIR}/assets"), name="assets")
    
    # Serve index.html for all /app/* routes (SPA routing)
    @app.get("/app/{full_path:path}")
    async def serve_spa(full_path: str):
        index_path = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"error": "Frontend not found"}
else:
    @app.get("/app")
    def frontend_not_deployed():
        return {"error": "Frontend not deployed yet"}
EOF
```

---

### Step 1.5 — Add Gateway Token Endpoints to Auth

Add these endpoints to `/opt/employee-api/app/api/v1/routes/auth.py`:

```bash
cat >> /opt/employee-api/app/api/v1/routes/auth.py << 'EOF'


# ═══════════════════════════════════════════════════════════════
# GATEWAY REDIRECT — Pi-Gateway SSO Integration
# ═══════════════════════════════════════════════════════════════

from fastapi.responses import RedirectResponse
from fastapi import Security
from app.core.auth import require_role
import secrets
from datetime import datetime, timedelta

# In-memory token store (short-lived gateway tokens)
# In production, use Redis for multi-server deployments
_gateway_tokens: dict = {}

def _cleanup_expired_tokens():
    """Remove expired tokens from memory."""
    now = datetime.utcnow()
    expired = [k for k, v in _gateway_tokens.items() if now > v["expires"]]
    for k in expired:
        _gateway_tokens.pop(k, None)


@router.post("/gateway-token")
def create_gateway_token(
    employee_id: int,
    db: Session = Depends(get_db),
    role: str = Security(require_role("pi_gateway", "admin"))
):
    """
    Pi-Gateway calls this after successful TOTP verification.
    Returns a short-lived token (60 seconds) for SSO redirect.
    """
    _cleanup_expired_tokens()
    
    employee = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.is_active == True
    ).first()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Generate secure random token
    token = secrets.token_urlsafe(32)
    
    # Store token with 60 second expiry
    _gateway_tokens[token] = {
        "employee_id": employee_id,
        "expires": datetime.utcnow() + timedelta(seconds=60)
    }
    
    return {
        "token": token,
        "redirect_url": f"/api/v1/auth/gateway-login?token={token}",
        "expires_in": 60
    }


@router.get("/gateway-login")
def gateway_login(token: str, db: Session = Depends(get_db)):
    """
    Browser redirects here with gateway token.
    Validates token → creates JWT → redirects to frontend with JWT.
    """
    _cleanup_expired_tokens()
    
    # Validate token
    data = _gateway_tokens.get(token)
    if not data:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token. Please login again from captive portal."
        )
    
    if datetime.utcnow() > data["expires"]:
        _gateway_tokens.pop(token, None)
        raise HTTPException(
            status_code=401,
            detail="Token expired. Please login again from captive portal."
        )
    
    # Consume token (single-use)
    _gateway_tokens.pop(token, None)
    employee_id = data["employee_id"]
    
    # Get employee info
    employee = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.is_active == True
    ).first()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Create JWT access token
    access_token = create_access_token({
        "sub": str(employee.id),
        "role": employee.role,
        "employee_code": employee.employee_code
    })
    
    # Redirect to frontend with token in URL hash
    # Hash (#) prevents token from being sent to server logs
    frontend_url = (
        f"https://manan.digimeck.in/app"
        f"#token={access_token}"
        f"&employee_id={employee.id}"
        f"&employee_code={employee.employee_code}"
        f"&role={employee.role}"
        f"&full_name={employee.full_name}"
    )
    
    return RedirectResponse(url=frontend_url, status_code=302)
EOF
```

Restart API:
```bash
sudo systemctl restart employee-api
sudo systemctl status employee-api
```

Verify frontend loads:
```bash
curl -I https://manan.digimeck.in/app
# Should return 200 OK
```

---

## 🔧 PART 2: Pi-Gateway Updates

### Step 2.1 — Add Gateway Token Function to api_client.py

On **Pi-Gateway machine**, edit `/opt/pi-gateway/pi-gateway-v2/portal/api_client.py`:

Add this function:

```python
def get_gateway_token(employee_id: int) -> str | None:
    """
    Get a short-lived gateway token for SSO redirect.
    Called after successful TOTP verification.
    """
    try:
        logger.info(f"[API] Getting gateway token for employee_id={employee_id}")
        r = requests.post(
            f"{API_BASE_URL}/api/v1/auth/gateway-token",
            params={"employee_id": employee_id},
            headers=HEADERS,
            timeout=10
        )
        
        if r.status_code == 200:
            token = r.json().get("token")
            logger.info(f"[API] Gateway token obtained for employee_id={employee_id}")
            return token
        else:
            logger.warning(
                f"[API] Failed to get gateway token: {r.status_code} - {r.text}"
            )
            return None
            
    except requests.exceptions.ConnectionError:
        logger.error("[API] Connection error getting gateway token")
        return None
    except Exception as e:
        logger.error(f"[API] Exception getting gateway token: {e}")
        return None
```

---

### Step 2.2 — Update Login Success Redirect in main.py

Edit `/opt/pi-gateway/pi-gateway-v2/portal/main.py`:

Find the login success section (after `add_firewall_rule(mac)` succeeds) and replace:

```python
# OLD CODE:
return redirect(url_for("main.success"))

# NEW CODE:
# Get gateway token for SSO redirect
gateway_token = get_gateway_token(employee_id)

if gateway_token:
    # Redirect to remote API gateway-login endpoint
    redirect_url = f"https://manan.digimeck.in/api/v1/auth/gateway-login?token={gateway_token}"
    current_app.logger.info(
        f"Redirecting employee {employee_id} to dashboard via gateway token"
    )
    return redirect(redirect_url)
else:
    # Fallback to local success page if token fetch fails
    # Employee still has internet access via iptables
    current_app.logger.warning(
        f"Failed to get gateway token for employee {employee_id}, "
        f"using fallback success page"
    )
    return redirect(url_for("main.success"))
```

Make sure to import `get_gateway_token` at the top of `main.py`:

```python
from .api_client import (
    verify_totp,
    register_employee,
    get_employee_by_code,
    register_device,
    check_device_registered,
    start_session,
    get_gateway_token  # ← ADD THIS
)
```

---

### Step 2.3 — Restart Pi-Gateway

```bash
sudo systemctl restart pi-gateway
sudo systemctl status pi-gateway
```

Check logs:
```bash
tail -f /opt/pi-gateway/pi-gateway-v2/data/app.log
```

---

## 🎨 PART 3: Vite Frontend Updates

### Step 3.1 — Handle Auto-Login from URL Hash

Edit `frontend/src/contexts/AuthContext.tsx`:

Add this in the `useEffect` that runs on component mount:

```typescript
useEffect(() => {
  // Check for gateway SSO token in URL hash
  const hash = window.location.hash;
  
  if (hash.includes('token=')) {
    // Parse URL hash parameters
    const params = new URLSearchParams(hash.slice(1)); // Remove '#'
    const token = params.get('token');
    const employeeId = params.get('employee_id');
    const employeeCode = params.get('employee_code');
    const role = params.get('role');
    const fullName = params.get('full_name');
    
    if (token) {
      // Store authentication data
      localStorage.setItem('auth_token', token);
      localStorage.setItem('employee_id', employeeId || '');
      localStorage.setItem('employee_code', employeeCode || '');
      localStorage.setItem('role', role || '');
      localStorage.setItem('full_name', fullName || '');
      
      // Clean URL (remove sensitive token from address bar)
      window.history.replaceState({}, document.title, '/app');
      
      // Update auth state
      setIsAuthenticated(true);
      setUserRole(role || 'employee');
      setUser({
        id: parseInt(employeeId || '0'),
        employee_code: employeeCode || '',
        full_name: fullName || '',
        role: role || 'employee'
      });
      
      console.log('✅ Auto-login successful via gateway token');
    }
  } else {
    // Normal flow — check if already logged in
    const savedToken = localStorage.getItem('auth_token');
    const savedRole = localStorage.getItem('role');
    
    if (savedToken) {
      setIsAuthenticated(true);
      setUserRole(savedRole || 'employee');
      // Load user details from localStorage or API call
    }
  }
}, []);
```

---

### Step 3.2 — Update .env in Frontend

Make sure your frontend `.env` has:

```env
VITE_API_URL=https://manan.digimeck.in
VITE_WEB_API_KEY=ba856e28ce4dc39dd2439b19b652432642562e908debcd010861bc77b93b027a
VITE_ADMIN_API_KEY=8576c764b96b02c40abce1a711dd0fcb89dbf32e10124d5408abf9575f03dd5b
```

---

### Step 3.3 — Rebuild and Redeploy Frontend

```bash
cd frontend
npm run build
```

Copy new `dist/` to Ubuntu server:

```bash
scp -r dist/* ubuntu@YOUR_UBUNTU_IP:/tmp/frontend-new/
```

On **Ubuntu server**:

```bash
sudo rm -rf /opt/employee-api/frontend/*
sudo mv /tmp/frontend-new/* /opt/employee-api/frontend/
sudo chown -R ubuntu:ubuntu /opt/employee-api/frontend
```

No need to restart FastAPI — static files are served directly.

---

## ✅ PART 4: Testing End-to-End

### Test 1 — Verify Frontend Loads

Open browser:
```
https://manan.digimeck.in/app
```

Should show your Vite app (even if not logged in).

---

### Test 2 — Test Gateway Token Endpoint

In Postman:

```
POST https://manan.digimeck.in/api/v1/auth/gateway-token?employee_id=1
X-API-Key: e111df3f18b96d2235c6715b83b5cf46c53b3a5b4e8fb40e9d4c57aad4dc748f
```

Response should be:
```json
{
  "token": "random-token-here",
  "redirect_url": "/api/v1/auth/gateway-login?token=...",
  "expires_in": 60
}
```

---

### Test 3 — Test Gateway Login Redirect

Copy the token from above and visit in browser:
```
https://manan.digimeck.in/api/v1/auth/gateway-login?token=PASTE_TOKEN_HERE
```

Should redirect to:
```
https://manan.digimeck.in/app#token=JWT_HERE&employee_id=1&...
```

And you should be logged into the dashboard automatically.

---

### Test 4 — Full Captive Portal Flow

1. Connect phone/laptop to Pi-Gateway WiFi
2. Captive portal appears: `http://172.17.1.1/`
3. Click Login or Register
4. Enter: `EMP101` + TOTP code from Google Authenticator
5. Click Submit

**Expected behavior:**
- Pi-Gateway verifies TOTP ✓
- Pi-Gateway adds iptables rule (internet granted) ✓
- Pi-Gateway redirects browser to remote API
- Remote API creates JWT and redirects to frontend
- Frontend auto-logs in and shows dashboard ✓

---

## 🐛 Troubleshooting

### Issue 1: Frontend Shows 404

**Symptom:** `https://manan.digimeck.in/app` returns 404

**Fix:**
```bash
# Verify files exist
ls -la /opt/employee-api/frontend/
# Should show: index.html, assets/, etc.

# Restart API
sudo systemctl restart employee-api
```

---

### Issue 2: Gateway Token Fails

**Symptom:** Pi-Gateway logs show "Failed to get gateway token"

**Fix:**
```bash
# Check remote API is running
curl https://manan.digimeck.in/api/v1/health

# Test gateway-token endpoint manually (Postman)
POST https://manan.digimeck.in/api/v1/auth/gateway-token?employee_id=1
X-API-Key: e111df3f18b96d2235c6715b83b5cf46c53b3a5b4e8fb40e9d4c57aad4dc748f
```

---

### Issue 3: Frontend Doesn't Auto-Login

**Symptom:** Frontend loads but doesn't detect token in URL

**Fix:**

Check browser console for errors. Make sure:
- Token is in URL hash: `#token=...`
- AuthContext useEffect runs on mount
- localStorage stores the token

Debug by adding console.log:
```typescript
console.log('URL hash:', window.location.hash);
```

---

### Issue 4: Redirect Loops

**Symptom:** Browser keeps redirecting between captive portal and frontend

**Fix:**

This happens if `check_device_authenticated()` in Pi-Gateway fails.

Check Pi-Gateway logs:
```bash
tail -f /opt/pi-gateway/pi-gateway-v2/data/app.log
```

Ensure iptables rule was added:
```bash
sudo iptables -S AUTHENTICATED | grep MAC_ADDRESS
```

---

## 📊 Complete Flow Diagram

```
┌──────────────┐
│   Employee   │
│  (Phone/PC)  │
└──────┬───────┘
       │ Connects to WiFi
       ▼
┌─────────────────────────────────────────┐
│      Pi-Gateway (172.17.1.1)            │
│                                         │
│  1. Captive portal appears              │
│  2. Employee enters: EMP101 + TOTP      │
│  3. Verify via remote API ✓             │
│  4. Add iptables rule (internet) ✓      │
│  5. Get gateway token ✓                 │
│  6. Redirect to remote API              │
└──────────────┬──────────────────────────┘
               │
               │ https://manan.digimeck.in/
               │ api/v1/auth/gateway-login?token=xyz
               ▼
┌─────────────────────────────────────────┐
│   Remote API (manan.digimeck.in)        │
│                                         │
│  1. Validate gateway token ✓            │
│  2. Create JWT access token ✓           │
│  3. Redirect to frontend with JWT       │
└──────────────┬──────────────────────────┘
               │
               │ https://manan.digimeck.in/app
               │ #token=JWT&employee_id=1...
               ▼
┌─────────────────────────────────────────┐
│   Vite Frontend (/app)                  │
│                                         │
│  1. Read token from URL hash ✓          │
│  2. Store in localStorage ✓             │
│  3. Set authenticated state ✓           │
│  4. Show dashboard ✓                    │
└─────────────────────────────────────────┘
       │
       ▼
   Employee sees their personalized dashboard
   with ML predictions, tasks, surveys, etc.
```

---

## 🔒 Security Notes

1. **Gateway tokens are short-lived (60 seconds)**
   - Single-use only
   - Expired tokens are rejected
   - Cleanup runs automatically

2. **JWT in URL hash (not query parameter)**
   - Hash fragment (`#token=...`) is not sent to server
   - Not logged in server access logs
   - Removed from browser history via `replaceState()`

3. **HTTPS everywhere**
   - Cloudflare tunnel encrypts all traffic
   - JWT transmitted over encrypted connection

4. **API key authentication**
   - Pi-Gateway uses dedicated `PI_GATEWAY_API_KEY`
   - Frontend uses `WEB_CLIENT_API_KEY`
   - Admin uses `ADMIN_API_KEY`

---

## 📝 Maintenance

### Updating Frontend

```bash
# On dev machine
cd frontend
npm run build

# Copy to server
scp -r dist/* ubuntu@SERVER_IP:/tmp/frontend-new/

# On server
sudo rm -rf /opt/employee-api/frontend/*
sudo mv /tmp/frontend-new/* /opt/employee-api/frontend/
```

No restart needed — FastAPI serves static files directly.

---

### Monitoring Gateway Tokens

Add this endpoint to check active gateway tokens (debug only):

```python
@router.get("/gateway-tokens/debug")
def debug_gateway_tokens(role: str = Security(require_role("admin"))):
    """Admin-only: View active gateway tokens."""
    _cleanup_expired_tokens()
    return {
        "active_tokens": len(_gateway_tokens),
        "tokens": [
            {
                "token": k[:10] + "...",
                "employee_id": v["employee_id"],
                "expires": v["expires"].isoformat()
            }
            for k, v in _gateway_tokens.items()
        ]
    }
```

---

## ✨ Summary

After this integration:

✅ Employees authenticate once on captive portal
✅ Automatically logged into web dashboard
✅ No double login required
✅ Seamless SSO experience
✅ All data in one database
✅ Pi-Gateway, API, Frontend fully integrated

---

## 📞 Support

If you encounter issues:

1. Check logs:
   - Pi-Gateway: `/opt/pi-gateway/pi-gateway-v2/data/app.log`
   - Remote API: `journalctl -u employee-api -n 50`
   
2. Verify services running:
   ```bash
   # Pi-Gateway
   sudo systemctl status pi-gateway
   
   # Remote API
   sudo systemctl status employee-api
   ```

3. Test each component individually using the test steps above

---

**Integration complete! 🎉**
