@echo off
echo ====================================
echo Supabase Edge Function 배포
echo ====================================
echo.

cd /d C:\Users\mongshilymom\dev\letyou\templates\yeyakweb-puppyhotel

echo [1/3] Supabase CLI 설치 확인 중...
where supabase >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Supabase CLI가 설치되지 않았습니다.
    echo 설치 중...
    npm install -g supabase
)

echo.
echo [2/3] Supabase 로그인...
supabase login

echo.
echo [3/3] Edge Function 배포 중...
supabase functions deploy send-sms --project-ref ssvkmyscxjhrkbulujvq

echo.
echo ====================================
echo 배포 완료!
echo ====================================
echo.
echo 테스트 방법:
echo 1. npm run dev
echo 2. http://localhost:5173/admin/dashboard
echo 3. 예약 '확정' 버튼 클릭
echo 4. 문자 발송 확인
echo.
pause
