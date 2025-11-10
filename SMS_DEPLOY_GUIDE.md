# SMS 발송 기능 배포 가이드

## 1️⃣ Supabase Edge Function 배포

### Supabase CLI 설치 (처음 1회만)
```bash
npm install -g supabase
```

### Supabase 로그인
```bash
supabase login
```

### Edge Function 배포
```bash
cd C:\Users\mongshilymom\dev\letyou\templates\yeyakweb-puppyhotel
supabase functions deploy send-sms --project-ref ssvkmyscxjhrkbulujvq
```

## 2️⃣ 테스트

### 로컬에서 테스트
```bash
# 서버 재시작
npm run dev

# 관리자 대시보드 접속
http://localhost:5173/admin/dashboard

# '확정' 버튼 클릭
# F12 콘솔에서 SMS 발송 로그 확인
```

### SMS 발송 확인 사항
- ✅ SOLAPI 대시보드에서 발송 내역 확인
- ✅ 고객 휴대폰으로 문자 수신 확인
- ✅ F12 콘솔에서 에러 없는지 확인

## 3️⃣ 문제 해결

### Edge Function이 작동하지 않으면:

1. **Supabase Dashboard에서 확인**
   ```
   https://supabase.com/dashboard/project/ssvkmyscxjhrkbulujvq/functions
   
   - send-sms 함수가 배포되어 있는지 확인
   - Logs 탭에서 에러 확인
   ```

2. **수동으로 함수 생성**
   ```
   Supabase Dashboard → Functions → Create Function
   
   Name: send-sms
   Code: supabase/functions/send-sms/index.ts 내용 복사
   ```

3. **SOLAPI API 키 확인**
   ```
   https://solapi.com
   
   - API 키가 유효한지 확인
   - 크레딧이 충분한지 확인
   - 발신번호가 등록되어 있는지 확인
   ```

## 4️⃣ Git Push

### GitHub에 푸시
```bash
# git-push.bat 파일 수정
notepad git-push.bat

# GitHub 계정 이름을 실제 계정으로 변경:
git remote add origin https://github.com/실제계정/yeyakweb-puppyhotel.git

# 배치 파일 실행
git-push.bat
```

또는 수동으로:
```bash
cd C:\Users\mongshilymom\dev\letyou\templates\yeyakweb-puppyhotel

git add .
git commit -m "Add SMS functionality"
git remote add origin https://github.com/실제계정/yeyakweb-puppyhotel.git
git branch -M main
git push -u origin main
```

## 5️⃣ 완료!

모든 단계가 완료되면:
- ✅ 예약 확정 시 자동 SMS 발송
- ✅ GitHub에 코드 백업
- ✅ Supabase에 Edge Function 배포
