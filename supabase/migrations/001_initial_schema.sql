-- 예약 테이블
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_name VARCHAR(100) NOT NULL,
  owner_name VARCHAR(100) NOT NULL,
  service VARCHAR(20) NOT NULL CHECK (service IN ('hotel', 'grooming', 'daycare')),
  reservation_date DATE NOT NULL,
  reservation_time TIME,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('confirmed', 'pending', 'completed', 'cancelled')),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  
  -- 호텔 전용 필드
  room_type VARCHAR(50),
  check_in DATE,
  check_out DATE,
  
  -- 미용 전용 필드
  grooming_style VARCHAR(50),
  
  -- 공통 필드
  special_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 관리자 계정 테이블
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  security_question VARCHAR(200) NOT NULL,
  security_answer_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 시스템 설정 테이블
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_service ON reservations(service);
CREATE INDEX idx_reservations_phone ON reservations(phone);

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 적용
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security 활성화
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 정책 생성 (공개 읽기)
CREATE POLICY "Enable read access for all users" ON reservations
FOR SELECT USING (true);

CREATE POLICY "Enable insert for all" ON reservations
FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all" ON reservations
FOR UPDATE USING (true);

-- 관리자 테이블 정책
CREATE POLICY "Enable all for service role" ON admin_users
FOR ALL USING (true);

-- 설정 테이블 정책
CREATE POLICY "Enable read access for all users" ON settings
FOR SELECT USING (true);

CREATE POLICY "Enable write for service role" ON settings
FOR ALL USING (true);

-- 기본 관리자 계정 생성
INSERT INTO admin_users (username, password_hash, email, security_question, security_answer_hash)
VALUES (
  'admin',
  'puppyhotel2024',
  'admin@puppyhotel.com',
  '가장 좋아하는 반려동물의 이름은?',
  'puppy'
) ON CONFLICT (username) DO NOTHING;

-- 기본 설정 생성  
INSERT INTO settings (setting_key, setting_value)
VALUES 
  ('calendar_settings', '{
    "isEnabled": false,
    "businessHours": {"start": "09:00", "end": "20:00"},
    "maxBookingsPerDay": 20
  }'::jsonb),
  ('weekly_grooming_schedule', '{
    "monday": {"isOpen": true, "timeSlots": ["09:00","10:00","11:00","13:00","14:00","15:00","16:00","17:00"], "maxBookings": 8},
    "tuesday": {"isOpen": true, "timeSlots": ["09:00","10:00","11:00","13:00","14:00","15:00","16:00","17:00"], "maxBookings": 8},
    "wednesday": {"isOpen": true, "timeSlots": ["09:00","10:00","11:00","13:00","14:00","15:00","16:00","17:00"], "maxBookings": 8},
    "thursday": {"isOpen": true, "timeSlots": ["09:00","10:00","11:00","13:00","14:00","15:00","16:00","17:00"], "maxBookings": 8},
    "friday": {"isOpen": true, "timeSlots": ["09:00","10:00","11:00","13:00","14:00","15:00","16:00","17:00"], "maxBookings": 8},
    "saturday": {"isOpen": true, "timeSlots": ["09:00","10:00","11:00","13:00","14:00","15:00"], "maxBookings": 6},
    "sunday": {"isOpen": false, "timeSlots": [], "maxBookings": 0}
  }'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;
