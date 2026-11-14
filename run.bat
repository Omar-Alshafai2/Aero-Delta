@echo off
title Aero-Delta Mission Terminal
echo ===================================================
echo   AERO-DELTA: LUNAR MISSION PLANNER DEV SERVER
echo ===================================================
echo.
echo Starting local development server...
cd /d "%~dp0"
call npm run dev
pause
