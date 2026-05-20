# SQUID Backend Startup Script
Write-Host "Starting SQUID Backend..." -ForegroundColor Cyan
$env:PYTHONIOENCODING = "utf-8"
Set-Location "$PSScriptRoot\backend"
& "$PSScriptRoot\backend\venv\Scripts\uvicorn.exe" app.main:app --reload --port 8000
