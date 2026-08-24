# start.ps1 — Launches the SkinStreak backend (FastAPI) and frontend (Vite) together.
#
# Usage: right-click > "Run with PowerShell", or from a terminal:
#   powershell -ExecutionPolicy Bypass -File .\start.ps1
#
# Opens two new terminal windows (backend on :8000, frontend on :5173) and
# leaves them running. Close each window individually to stop that server.

$root = $PSScriptRoot

Write-Host "Starting SkinStreak backend (FastAPI on http://localhost:8000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; .\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"

Write-Host "Starting SkinStreak frontend (Vite on http://localhost:5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Write-Host ""
Write-Host "Both servers are launching in separate windows." -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "Backend:  http://localhost:8000/docs" -ForegroundColor Green
