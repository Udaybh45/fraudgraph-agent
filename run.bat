@echo off
title FraudGraph Agent - Hackathon Launcher
echo ========================================================
echo   FRAUDGRAPH AGENT: TIGERGRAPH AGENTIC FRAUD PLATFORM
echo ========================================================
echo.

echo [1/3] Priming Knowledge Graph and Benchmark Suite...
python scripts\seed_demo.py
if errorlevel 1 (
    echo [ERROR] Failed to prime knowledge graph.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Starting FastAPI Backend on http://localhost:8000 ...
start "FraudGraph Backend" cmd /k "cd backend && python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 2 >nul

echo.
echo [3/3] Starting React Analyst Dashboard on http://localhost:3000 ...
start "FraudGraph Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo   FraudGraph Agent is running!
echo   Dashboard: http://localhost:3000
echo   API Docs:  http://localhost:8000/docs
echo ========================================================
pause
