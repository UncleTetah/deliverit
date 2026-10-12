# =====================================================
# DeliverIt — System health check
# =====================================================

Write-Host ""
Write-Host "  DeliverIt — System Check" -ForegroundColor Cyan
Write-Host "  ─────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# ---------- 1. PostgreSQL ----------
Write-Host "  [1] PostgreSQL service..." -NoNewline
$pg = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pg -and $pg.Status -eq 'Running') {
  Write-Host " ✅ Running ($($pg.Name))" -ForegroundColor Green
} else {
  Write-Host " ❌ NOT RUNNING" -ForegroundColor Red
  Write-Host "      Fix: Restart-Service postgresql* (admin)" -ForegroundColor Yellow
}

# ---------- 2. API server (port 4000) ----------
Write-Host "  [2] API server on :4000..." -NoNewline
try {
  $health = Invoke-RestMethod -Uri "http://localhost:4000/health" -TimeoutSec 2
  Write-Host " ✅ $($health.ok) (ts=$($health.ts))" -ForegroundColor Green
} catch {
  Write-Host " ❌ NOT RESPONDING" -ForegroundColor Red
  Write-Host "      Fix: cd server && pm2 start ecosystem.config.cjs" -ForegroundColor Yellow
  Write-Host "      Or:  cd server && npm run dev" -ForegroundColor Yellow
}

# ---------- 3. API route check ----------
Write-Host "  [3] Auth route /api/auth/me..." -NoNewline
try {
  $me = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/me" -TimeoutSec 2 -ErrorAction Stop
  Write-Host " ⚠️ Unexpected 200 (auth should reject unauthenticated)" -ForegroundColor Yellow
} catch {
  $status = $_.Exception.Response.StatusCode.value__
  if ($status -eq 401) {
    Write-Host " ✅ Route exists (401 as expected)" -ForegroundColor Green
  } elseif ($status -eq 404) {
    Write-Host " ❌ Route NOT registered — server has old code" -ForegroundColor Red
    Write-Host "      Fix: restart the server" -ForegroundColor Yellow
  } else {
    Write-Host " ⚠️ Status $status" -ForegroundColor Yellow
  }
}

# ---------- 4. Couriers route ----------
Write-Host "  [4] Couriers route /api/couriers/me..." -NoNewline
try {
  Invoke-RestMethod -Uri "http://localhost:4000/api/couriers/me" -TimeoutSec 2 -ErrorAction Stop | Out-Null
  Write-Host " ⚠️ Unexpected 200" -ForegroundColor Yellow
} catch {
  $status = $_.Exception.Response.StatusCode.value__
  if ($status -eq 401) {
    Write-Host " ✅ Route exists (401 as expected)" -ForegroundColor Green
  } elseif ($status -eq 404) {
    Write-Host " ❌ Route NOT registered" -ForegroundColor Red
  } else {
    Write-Host " ⚠️ Status $status" -ForegroundColor Yellow
  }
}

# ---------- 5. Client (Live Server) ----------
Write-Host "  [5] Client on :5501..." -NoNewline
try {
  $client = Invoke-WebRequest -Uri "http://127.0.0.1:5501/client/index.html" -TimeoutSec 2 -UseBasicParsing
  if ($client.StatusCode -eq 200) {
    Write-Host " ✅ Serving" -ForegroundColor Green
  } else {
    Write-Host " ⚠️ Status $($client.StatusCode)" -ForegroundColor Yellow
  }
} catch {
  Write-Host " ⚠️ Not reachable (VS Code Live Server not running?)" -ForegroundColor Yellow
  Write-Host "      Fix: right-click client/index.html → Open with Live Server" -ForegroundColor Yellow
}

# ---------- 6. Port collisions ----------
Write-Host "  [6] Port 4000 listeners..." -NoNewline
$listeners = (netstat -ano | Select-String ":4000\s" | Measure-Object).Count
if ($listeners -gt 1) {
  Write-Host " ⚠️ $listeners listeners (possible duplicate processes)" -ForegroundColor Yellow
  netstat -ano | Select-String ":4000\s"
} elseif ($listeners -eq 1) {
  Write-Host " ✅ One listener" -ForegroundColor Green
} else {
  Write-Host " (no listener — server down)" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "  Done." -ForegroundColor Cyan
Write-Host ""