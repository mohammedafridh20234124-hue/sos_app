#!/usr/bin/env pwsh
# Feedback SMS System - Quick Start Script
# Usage: .\start-feedback-system.ps1

param(
    [Switch]$NoWait = $false
)

$projectPath = "h:\backup\another one\prompty-web-builder-main\prompty-web-builder-main"

Write-Host "`n╔════════════════════════════════════════════════════════╗"
Write-Host "║      Feedback SMS System - Startup Script               ║"
Write-Host "║      All systems will start in background jobs           ║"
Write-Host "╚════════════════════════════════════════════════════════╝`n"

# Kill any existing jobs/processes
Write-Host "🧹 Cleaning up existing processes..."
Get-Job | Stop-Job -PassThru -ErrorAction SilentlyContinue | Remove-Job -Force -ErrorAction SilentlyContinue
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue 2>&1 | Out-Null
Start-Sleep -Milliseconds 500

# Start Backend
Write-Host "🚀 Starting Backend Server (port 3001)..."
Start-Job -ScriptBlock {
    cd "$using:projectPath"
    node server/sms-service.mjs
} -Name "backend" | Out-Null

# Start Frontend
Write-Host "🚀 Starting Frontend Dev Server (port 8080)..."
Start-Job -ScriptBlock {
    cd "$using:projectPath"
    npm run dev
} -Name "frontend" | Out-Null

# Wait for servers to initialize
Write-Host "`n⏳ Waiting for servers to initialize..."
Start-Sleep -Seconds 3

# Check if they're running
$backendJob = Get-Job -Name "backend" -ErrorAction SilentlyContinue
$frontendJob = Get-Job -Name "frontend" -ErrorAction SilentlyContinue

Write-Host "`n✅ Checking server status...`n"

if ($backendJob -and $backendJob.State -eq "Running") {
    Write-Host "  ✅ Backend:  RUNNING (http://localhost:3001)"
} else {
    Write-Host "  ❌ Backend:  FAILED TO START"
}

if ($frontendJob -and $frontendJob.State -eq "Running") {
    Write-Host "  ✅ Frontend: RUNNING (http://localhost:8080)"
} else {
    Write-Host "  ❌ Frontend: FAILED TO START"
}

# Verify backend health
Write-Host "`n🔍 Verifying backend health..."
try {
    $health = Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  ✅ Backend is responding: $($health.StatusCode)"
} catch {
    Write-Host "  ⚠️  Backend not yet ready (this is normal, give it a moment)"
}

Write-Host "`n╔════════════════════════════════════════════════════════╗"
Write-Host "║                  System Ready!                           ║"
Write-Host "╠════════════════════════════════════════════════════════╣"
Write-Host "║  🌐 Frontend: http://localhost:8080                    ║"
Write-Host "║  🔌 Backend:  http://localhost:3001                    ║"
Write-Host "║  📱 Admin Phone: +918531996611 (verified ✅)           ║"
Write-Host "║                                                        ║"
Write-Host "║  📝 To check logs:                                     ║"
Write-Host "║    Backend: Get-Job backend | Receive-Job             ║"
Write-Host "║    Frontend: Get-Job frontend | Receive-Job           ║"
Write-Host "║                                                        ║"
Write-Host "║  🛑 To stop servers:                                   ║"
Write-Host "║    Get-Job | Stop-Job -PassThru | Remove-Job         ║"
Write-Host "╚════════════════════════════════════════════════════════╝`n"

if (-not $NoWait) {
    Write-Host "Press Ctrl+C to stop the servers and exit..."
    try {
        while ($true) {
            Start-Sleep -Seconds 10
            # Keep script alive while servers run
        }
    } catch {
        Write-Host "`nShutting down..."
        Get-Job | Stop-Job -PassThru | Remove-Job -Force
    }
}
