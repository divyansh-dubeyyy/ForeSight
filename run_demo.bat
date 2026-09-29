@echo off
TITLE BustSense Demo Runner
COLOR 0B

echo ===================================================
echo             BUSTSENSE SIH 2026 DEMO
echo ===================================================
echo.
echo [1/3] Starting FastAPI Backend on port 8000...
start "BustSense API" cmd /k "set PYTHONPATH=. && .\venv\Scripts\python.exe backend\main.py"

echo [2/3] Starting React Frontend on port 5173...
start "BustSense Dashboard" cmd /k "cd frontend && npm run dev"

echo.
echo Waiting for services to initialize...
timeout /t 5 /nobreak >nul

echo [3/3] Opening Dashboard in your default browser...
start http://localhost:5173

echo.
echo ===================================================
echo Demo is now running! 
echo Keep the backend and frontend terminal windows open.
echo Close them when you are done to stop the servers.
echo ===================================================
pause
