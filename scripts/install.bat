@echo off
echo ============================================
echo   SpitOclock Installer for Windows
echo ============================================
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH.
    echo         Download it from: https://www.python.org/downloads/
    echo         IMPORTANT: Check "Add Python to PATH" during installation!
    echo.
    pause
    exit /b 1
)
echo [OK] Python found:
python --version

:: Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo         Download it from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js found:
node --version
echo.

:: Find repo root (script is in scripts/)
cd /d "%~dp0.."
echo [INFO] Installing from: %cd%
echo.

:: Install Python package
echo [1/3] Installing Python dependencies...
pip install -e . --quiet
if errorlevel 1 (
    echo [ERROR] pip install failed. Try running as Administrator.
    pause
    exit /b 1
)
echo [OK] Python dependencies installed.
echo.

:: Build frontend
echo [2/3] Installing frontend dependencies...
cd frontend
call npm install --silent
if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)

echo [3/3] Building frontend...
call npm run build
if errorlevel 1 (
    echo [ERROR] Frontend build failed.
    pause
    exit /b 1
)
cd ..
echo [OK] Frontend built.
echo.

echo ============================================
echo   Installation complete!
echo.
echo   To start SpitOclock, open a terminal and run:
echo.
echo       spitoclock
echo.
echo   It will open http://localhost:8421 in your browser.
echo ============================================
echo.
pause
