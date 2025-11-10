@echo off
echo ====================================
echo Git Push to GitHub
echo ====================================
echo.

cd /d C:\Users\mongshilymom\dev\letyou\templates\yeyakweb-puppyhotel

echo [1/5] 현재 Git 상태 확인...
git status
echo.

echo [2/5] 변경사항 추가...
git add .
echo.

echo [3/5] 커밋 생성...
git commit -m "Add SMS functionality and bug fixes"
echo.

echo [4/5] GitHub Remote 확인...
git remote -v
echo.

echo 아직 remote가 없으면 다음 명령어 실행:
echo git remote add origin https://github.com/본인계정/yeyakweb-puppyhotel.git
echo.

echo [5/5] GitHub에 Push...
git branch -M main
git push -u origin main

echo.
echo ====================================
echo Push 완료!
echo ====================================
echo.
echo GitHub 저장소 확인:
echo https://github.com/본인계정/yeyakweb-puppyhotel
echo.
pause
