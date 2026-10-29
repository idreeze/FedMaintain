# FedMaintain One-Click Launcher for Windows
$ErrorActionPreference = "Continue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "           Launching FedMaintain Local Stack              " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start Docker Containers (TimescaleDB & Mosquitto)
Write-Host "[1/4] Starting Docker infrastructure (Database & Mosquitto)..." -ForegroundColor Yellow
docker compose up -d database mosquitto

# 2. Check and Start Backend
$backendPort = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if (-not $backendPort) {
    Write-Host "[2/4] Starting Spring Boot Backend (Java 21)..." -ForegroundColor Yellow
    $env:JAVA_HOME = "C:\Users\IDREEZE\.gemini\antigravity\scratch\.tools\jdk-21\jdk-21.0.12.1+1"
    $mvnPath = "C:\Users\IDREEZE\.gemini\antigravity\scratch\.tools\apache-maven-3.9.9\bin\mvn.cmd"
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "`$env:JAVA_HOME='C:\Users\IDREEZE\.gemini\antigravity\scratch\.tools\jdk-21\jdk-21.0.12.1+1'; cd '$PSScriptRoot\backend'; & '$mvnPath' spring-boot:run" -WindowStyle Minimized
} else {
    Write-Host "[2/4] Spring Boot Backend is already running on port 8080." -ForegroundColor Green
}

# 3. Check and Start Frontend
$frontendPort = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if (-not $frontendPort) {
    Write-Host "[3/4] Starting Vite React Frontend..." -ForegroundColor Yellow
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm.cmd run dev" -WindowStyle Minimized
} else {
    Write-Host "[3/4] Vite React Frontend is already running on port 5173." -ForegroundColor Green
}

# 4. Wait for Backend Health
Write-Host "[4/4] Waiting for FedMaintain Backend to be UP..." -ForegroundColor Yellow
$retries = 25
$isUp = $false
while ($retries -gt 0 -and -not $isUp) {
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:8080/api/health" -TimeoutSec 2 -ErrorAction Stop
        if ($res.status -eq "UP") {
            $isUp = $true
        }
    } catch {
        Start-Sleep -Seconds 2
        $retries--
    }
}

if ($isUp) {
    Write-Host "`n FedMaintain is ready!" -ForegroundColor Green
    Write-Host "Frontend URL:     http://localhost:5173" -ForegroundColor White
    Write-Host "Digital Twin URL: http://localhost:5173/digital-twins" -ForegroundColor White
    Write-Host "Backend API:      http://localhost:8080" -ForegroundColor White
    Write-Host "Swagger / Docs:   http://localhost:8080/swagger-ui/index.html" -ForegroundColor White
    Write-Host "`nDefault Credentials:" -ForegroundColor Cyan
    Write-Host "Admin:    admin@fedmaintain.com    / Admin@123" -ForegroundColor Gray
    Write-Host "Engineer: engineer@fedmaintain.com / Engineer@123" -ForegroundColor Gray
    Write-Host "Operator: operator@fedmaintain.com / Operator@123" -ForegroundColor Gray

    # Open Chrome
    Start-Process "chrome.exe" "http://localhost:5173/digital-twins"
} else {
    Write-Host "`n[WARNING] Backend took longer to start. Please check terminal windows." -ForegroundColor Red
    Start-Process "chrome.exe" "http://localhost:5173"
}
