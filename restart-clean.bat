@echo off
echo ==========================================
echo 완전 초기화 시작...
echo ==========================================

echo [1/4] 모든 Vite 프로세스 종료...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5174') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5175') do taskkill /F /PID %%a 2>nul

echo [2/4] 빌드 캐시 삭제...
if exist node_modules\.vite rmdir /s /q node_modules\.vite
if exist node_modules\.vite-temp rmdir /s /q node_modules\.vite-temp
if exist dist rmdir /s /q dist
if exist out rmdir /s /q out

echo [3/4] 대기 중... (2초)
timeout /t 2 >nul

echo [4/4] 개발 서버 시작...
npm run dev

pause
