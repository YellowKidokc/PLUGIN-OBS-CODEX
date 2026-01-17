@echo off
REM Theophysics Sync Manager - Python Backend Startup
REM This connects your Obsidian vault to PostgreSQL

echo ========================================
echo   Theophysics Sync Manager Backend
echo ========================================
echo.

REM Set environment variables
set POSTGRES_HOST=192.168.1.177
set POSTGRES_PORT=2665
set POSTGRES_DB=theophysics
set POSTGRES_USER=Yellowkid
set POSTGRES_PASSWORD=Moss9pep28$

REM Your Obsidian vault path
set VAULT_PATH=O:\Theophysics_Master\TMSUB

REM API settings
set API_HOST=localhost
set API_PORT=8000
set WATCH_MODE=true

echo PostgreSQL: %POSTGRES_HOST%:%POSTGRES_PORT%/%POSTGRES_DB%
echo Vault Path: %VAULT_PATH%
echo API: http://%API_HOST%:%API_PORT%
echo.

cd /d "%~dp0"

echo Starting Python backend...
python -m src.main

pause
