@echo off
cd /d C:\Users\mongshilymom\dev\letyou\templates\yeyakweb-puppyhotel
echo === Current Git Status ===
git status
echo.
echo === Git Remote List ===
git remote -v
echo.
echo === Adding GitHub Remote ===
git remote add origin https://github.com/형님GitHub계정/yeyakweb-puppyhotel.git
echo.
echo === Pushing to GitHub ===
git branch -M main
git push -u origin main
pause
