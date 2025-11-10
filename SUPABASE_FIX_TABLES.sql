-- =========================================================
-- PuppyHotel 필수 테이블 생성 SQL
-- Supabase Dashboard → SQL Editor에서 실행하세요
-- =========================================================

-- 1. Calendar Settings 테이블
CREATE TABLE IF NOT EXISTS public.calendar_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  business_hours JSONB NOT NULL DEFAULT '{"start": "09:00", "end": "20:00"}'::jsonb,
  available_days TEXT[] NOT NULL DEFAULT ARRAY['monday','tuesday','wednesday','thursday','friday','saturday','sunday'],
  max_bookings_per_day INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Weekly Grooming Schedule 테이블
CREATE TABLE IF NOT EXISTS public.weekly_grooming_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week TEXT NOT NULL UNIQUE,
  is_open BOOLEAN NOT NULL DEFAULT true,
  time_slots TEXT[] NOT NULL DEFAULT '{}',
  max_bookings INTEGER NOT NULL DEFAULT 8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Admin Profiles 테이블
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  email TEXT,
  security_question TEXT,
  security_answer_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 4. Updated_at 트리거 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. 트리거 적용
DROP TRIGGER IF EXISTS update_calendar_settings_updated_at ON calendar_settings;
CREATE TRIGGER update_calendar_settings_updated_at 
BEFORE UPDATE ON calendar_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_weekly_grooming_schedule_updated_at ON weekly_grooming_schedule;
CREATE TRIGGER update_weekly_grooming_schedule_updated_at 
BEFORE UPDATE ON weekly_grooming_schedule
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_profiles_updated_at ON admin_profiles;
CREATE TRIGGER update_admin_profiles_updated_at 
BEFORE UPDATE ON admin_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS 정책 설정
ALTER TABLE calendar_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_grooming_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 읽기 가능
CREATE POLICY "Enable read for authenticated" ON calendar_settings
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read for authenticated" ON weekly_grooming_schedule
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read for authenticated" ON admin_profiles
FOR SELECT TO authenticated USING (true);

-- 인증된 사용자가 쓰기 가능
CREATE POLICY "Enable write for authenticated" ON calendar_settings
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable write for authenticated" ON weekly_grooming_schedule
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable write for authenticated" ON admin_profiles
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. 기본 데이터 삽입 (캘린더 설정)
INSERT INTO calendar_settings (is_enabled, business_hours, available_days, max_bookings_per_day)
VALUES (false, '{"start": "09:00", "end": "20:00"}'::jsonb, ARRAY['monday','tuesday','wednesday','thursday','friday','saturday','sunday'], 20)
ON CONFLICT DO NOTHING;

-- 8. 기본 데이터 삽입 (주간 미용 스케줄)
INSERT INTO weekly_grooming_schedule (day_of_week, is_open, time_slots, max_bookings) VALUES
('monday', true, ARRAY['09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'], 8),
('tuesday', true, ARRAY['09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'], 8),
('wednesday', true, ARRAY['09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'], 8),
('thursday', true, ARRAY['09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'], 8),
('friday', true, ARRAY['09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'], 8),
('saturday', true, ARRAY['09:00','10:00','11:00','13:00','14:00','15:00'], 6),
('sunday', false, ARRAY[]::text[], 0)
ON CONFLICT (day_of_week) DO NOTHING;

-- 9. 확인 쿼리
SELECT 'calendar_settings' as table_name, COUNT(*) as count FROM calendar_settings
UNION ALL
SELECT 'weekly_grooming_schedule', COUNT(*) FROM weekly_grooming_schedule
UNION ALL
SELECT 'admin_profiles', COUNT(*) FROM admin_profiles;
