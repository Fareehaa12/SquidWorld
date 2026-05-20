# SQUID Frontend Startup Script
Write-Host "Starting SQUID Frontend..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\frontend"
npm run dev
