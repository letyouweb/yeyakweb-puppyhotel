@echo off
cd C:\Users\mongshilymom\dev\letyou\templates\yeyakweb-puppyhotel
echo ==========================================
echo Git Push 시작...
echo ==========================================
git add .
git commit -m "fix: simplify SMS to use Vercel API only"
git push origin main
echo.
echo ==========================================
echo ✅ Push 완료!
echo ==========================================
echo.
echo Vercel 배포 자동 시작됨 (3-5분 소요)
echo 배포 상황: https://vercel.com/dashboard
echo.
pause
