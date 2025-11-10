# SMS 문자 발송 배포 & 검증 가이드

## 1️⃣ Supabase Edge Function 배포
1. **Supabase CLI 설치(최초 1회)**  
   ```bash
   npm install -g supabase
   ```
2. **Supabase 로그인**  
   ```bash
   supabase login
   ```
3. **Edge Function 배포**  
   ```bash
   cd C:\Users\mongshilymom\dev\letyou\templates\yeyakweb-puppyhotel
   supabase functions deploy send-sms --project-ref ssvkmyscxjhrkbulujvq
   ```

## 2️⃣ 필수 테스트 시나리오
1. **예약 생성 & 확정 처리**
   - 로컬(`npm run dev`) 또는 프로덕션 관리자 페이지(`…/admin/dashboard`)에서 새 예약을 만든 뒤 `확정`을 클릭하여 SMS 트리거를 발생시킵니다.

2. **브라우저 Network 패널 캡처**
   - `F12 → Network`에서 `/functions/v1/send-sms`(또는 사용 중인 SMS 엔드포인트) 호출이 200으로 응답하는지 확인하고, 요청/응답 JSON을 캡처합니다.

3. **서버 로그 확인**
   - Supabase Edge Function(`send-sms`) 로그(또는 Vercel serverless route를 쓴다면 해당 로그)에서 Solapi 요청/응답이 기록되는지 확인하여 스크린샷을 남깁니다.

4. **Solapi 직접 호출(curl)**
   ```bash
   curl -X POST https://api.solapi.com/messages/v4/send \
     -H "Content-Type: application/json" \
     -H "Authorization: Basic $(printf '%s:%s' "$SOLAPI_API_KEY" "$SOLAPI_API_SECRET" | base64)" \
     -d '{
       "message": {
         "to": "01012345678",
         "from": "'"$SMS_SENDER"'",
         "text": "[PuppyHotel] 테스트 발송입니다."
       }
     }'
   ```
   - 성공 시 `groupId`/`messageId`가 포함된 JSON이 반환됩니다. 실패하면 응답 메시지로 원인을 확인하세요.

5. **로컬 빠른 테스트 커맨드**
   ```bash
   npm run dev
   open http://localhost:5173/admin/dashboard
   ```

## 3️⃣ 문제 해결 체크리스트
1. **Supabase 함수 배포 상태**
   - https://supabase.com/dashboard/project/ssvkmyscxjhrkbulujvq/functions  
   - `send-sms` 함수 존재 여부 & 로그 확인
2. **수동 배포(필요 시)**
   - Dashboard → Functions → Create Function  
   - Name: `send-sms` / Code: `supabase/functions/send-sms/index.ts` 내용
3. **Solapi 설정**
   - https://solapi.com  
   - API 키/시크릿 유효성, 발신번호 등록 여부, 한도 초과 여부 확인

## 4️⃣ Git Push 메모
```bash
git add .
git commit -m "Ready SMS deployment"
git push origin main
```

## 5️⃣ 완료 기준
- 예약 확정 시 자동으로 Solapi SMS 전송
- GitHub와 Supabase에 최신 코드/함수가 배포됨
- 위 테스트 시나리오(1)~(4)의 캡처가 모두 확보됨
