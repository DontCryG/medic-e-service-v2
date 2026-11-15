@echo off
title Medic E-Service V2 Starter
echo ==============================================
echo   Medic E-Service V2 - Starting Dev Servers
echo ==============================================
echo.

echo [*] Checking and freeing ports 3001 and 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001 "') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 "') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo [1/2] Starting Rust Backend on http://localhost:3001 ...
start "Medic E-Service: Rust Backend (Port 3001)" cmd /k "cargo run --manifest-path backend/Cargo.toml"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Vite Frontend on http://localhost:5173 ...
start "Medic E-Service: Vite Frontend (Port 5173)" cmd /k "npm run dev"

echo.
echo ==============================================
echo   All services have been launched!
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:3001
echo ==============================================
echo.
pause
