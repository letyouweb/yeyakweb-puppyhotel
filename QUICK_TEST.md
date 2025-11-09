# ⚡ 5분 테스트 가이드

## 1️⃣ 지금 바로 테스트 (2분)

### 관리자 로그인
```
URL: http://localhost:5173/admin
ID: admin
PW: puppyhotel2024
```

### 예약 추가 (테스트용)
브라우저 콘솔에서 실행:

```javascript
// Supabase에 테스트 예약 추가
const { data, error } = await supabase
  .from('reservations')
  .insert({
    pet_name: '테스트강아지',
    owner_name: '홍길동',
    service: 'grooming',
    reservation_date: '2024-12-25',
    reservation_time: '10:00',
    status: 'pending',
    phone: '010-1234-5678'
  })
  .select()
  .single();

console.log('예약 생성:', data);
```

---

## 2️⃣ SMS 발송 테스트 (1분)

### 방법 1: 관리자 대시보드에서
1. 대시보드에서 "대기" 상태 예약 찾기
2. "확정" 버튼 클릭
3. 알림창 확인: "문자가 발송되었습니다"

### 방법 2: 직접 호출
```javascript
// 브라우저 콘솔에서
const response = await fetch('YOUR_SUPABASE_URL/functions/v1/send-sms', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer YOUR_ANON_KEY`
  },
  body: JSON.stringify({
    to: '010-1234-5678',
    message: '테스트 문자입니다'
  })
});

console.log(await response.json());
```

---

## 3️⃣ 실시간 업데이트 테스트 (2분)

### 두 개 브라우저로 테스트
1. **브라우저 1**: 관리자 대시보드 열기
2. **브라우저 2**: 관리자 대시보드 열기
3. **브라우저 1**에서 예약 상태 변경
4. **브라우저 2**에서 즉시 반영 확인 ✅

---

## 4️⃣ 챗봇 예약 조회 테스트

### 홈페이지 콘솔에서
```javascript
// 예약 가능 시간 조회
const result1 = await window.getAvailableSlots('2024-12-25', 'grooming');
console.log('가능한 시간:', result1);

// 전체 예약 현황
const result2 = await window.getReservationStatus('2024-12-25');
console.log('예약 현황:', result2);
```

---

## 🔥 문제 해결

### "supabase is not defined"
→ `import { supabase } from './lib/supabase'` 추가

### "Function not found"
→ Supabase Dashboard → Functions에서 send-sms 배포 확인

### 로그인 실패
→ Supabase Dashboard → Table Editor → admin_users 확인

---

## ✅ 체크리스트

- [ ] Supabase SQL 실행 완료
- [ ] 관리자 로그인 성공
- [ ] 대시보드에서 예약 목록 보임
- [ ] 상태 변경 후 실시간 업데이트됨
- [ ] SMS 발송 알림 뜸
- [ ] 비밀번호 찾기 작동
- [ ] 챗봇 API 함수 호출 가능

**모두 체크되면 완성!** 🎉
