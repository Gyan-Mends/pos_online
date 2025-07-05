@echo off
echo Starting Store Information API Tests...
echo =====================================

echo.
echo 1. Starting POS Server...
start cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo 2. Waiting for server to start...
timeout /t 10 /nobreak > nul

echo.
echo 3. Running Store API Tests...
node scripts/testStoreAPI.cjs

echo.
echo 4. Test completed! Press any key to exit...
pause > nul 