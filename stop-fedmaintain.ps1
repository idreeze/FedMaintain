# FedMaintain Clean Shutdown Script for Windows
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "            Stopping FedMaintain Local Stack              " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Stop Frontend & Backend processes on ports 5173 & 8080
Write-Host "Stopping Vite dev server and Spring Boot backend processes..." -ForegroundColor Yellow
$connections = Get-NetTCPConnection -LocalPort 5173,8080 -ErrorAction SilentlyContinue
if ($connections) {
    $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($p in $pids) {
        if ($p -gt 0) {
            try {
                Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
                Write-Host "Stopped process ID: $p" -ForegroundColor Gray
            } catch {}
        }
    }
}

# 2. Stop Docker Containers
Write-Host "Stopping Docker containers..." -ForegroundColor Yellow
docker compose stop

Write-Host "`n FedMaintain stack stopped cleanly." -ForegroundColor Green
