@echo off
echo ============================================
echo   VisualAI - Multimodal Visual Search Engine
echo ============================================
echo.

REM Copy .env if it doesn't exist
if not exist "backend\.env" (
    copy backend\.env.example backend\.env
    echo [INFO] Created backend\.env from example.
    echo [ACTION] Please edit backend\.env and add your GEMINI_API_KEY
    echo.
)

echo [1/3] Starting Backend (FastAPI)...
start "VisualAI Backend" cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --reload --port 8000"

timeout /t 4 /nobreak > nul

echo [2/3] Starting Frontend (Vite)...
start "VisualAI Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 3 /nobreak > nul

echo [3/3] Opening browser...
start http://localhost:5173

echo.
echo Both servers are starting...
echo   Backend API:  http://localhost:8000
echo   Frontend:     http://localhost:5173
echo   API Docs:     http://localhost:8000/docs
echo.
pause
