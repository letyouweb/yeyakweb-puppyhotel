@echo off
cd C:\Users\mongshilymom\dev\letyou\templates\yeyakweb-puppyhotel
echo ========================================
echo Git 상태 확인...
echo ========================================
git status
echo.
echo ========================================
echo Commit 및 Push 진행...
echo ========================================
git add .
git commit -m "fix: use Vercel API for SMS instead of Supabase Edge Function"
git push origin feat/admin-merge-r-ui
echo.
echo ========================================
echo ✅ Push 완료! Vercel 자동 배포 시작
echo ========================================
pause
