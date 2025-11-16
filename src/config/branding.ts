// src/config/branding.ts
// 사이트별 브랜딩 설정을 관리합니다

export interface SiteBranding {
  name: string;
  nameEn: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  phone: string;
  email: string;
  address: string;
  businessHours: string;
  services: {
    hotel: boolean;
    grooming: boolean;
    daycare: boolean;
  };
  logoText: string;
  slogan: string;
}

export const SITE_CONFIGS: Record<string, SiteBranding> = {
  // 오니너리 멍 설정
  ordinarymung: {
    name: '오니너리 멍',
    nameEn: 'Ordinary Mung',
    description: '평범하지만 특별한 우리 아이를 위한 공간',
    primaryColor: '#FF6B6B', // 따뜻한 코랄 레드
    secondaryColor: '#4ECDC4', // 민트 그린
    phone: '010-7235-9479',
    email: 'info@ordinarymung.com',
    // 실제 위치를 업데이트했습니다: 관악구 봉천동 쑥고개 E편한세상 아파트 5단지 정문 근처
    address: '서울특별시 관악구 참숯1길 4, 1층 (봉천동)',
    businessHours: '평일 09:00-20:00, 주말 09:00-18:00',
    services: {
      hotel: true,
      grooming: true,
      daycare: true,
    },
    logoText: 'Ordinary 멍',
    slogan: '평범한 일상 속 특별한 순간',
  },

  // 기존 PuppyHotel 설정 (기본값)
  puppyhotel: {
    name: 'PuppyHotel',
    nameEn: 'PuppyHotel',
    description: '안전하고 전문적인 반려동물 호텔, 미용, 데이케어 서비스를 제공합니다',
    primaryColor: '#14B8A6', // Teal
    secondaryColor: '#FBBF24', // Yellow
    phone: '031-123-4567',
    email: 'info@puppyhotel.com',
    address: '경기도 성남시 분당구 판교로 123',
    businessHours: '평일 09:00-20:00, 주말 09:00-18:00',
    services: {
      hotel: true,
      grooming: true,
      daycare: true,
    },
    logoText: 'PuppyHotel',
    slogan: '우리 아이의 행복한 시간',
  },

  // 나머지 사이트들도 동일한 설정 사용 (추후 개별 커스터마이징 가능)
  chardor: {
    name: 'Chardor',
    nameEn: 'Chardor',
    description: '프리미엄 반려동물 케어 서비스',
    primaryColor: '#8B5CF6', // Purple
    secondaryColor: '#EC4899', // Pink
    // 관악구 봉천동 차르도르 애견카페 전화번호
    phone: '02-875-1999',
    email: 'info@chardor.com',
    // 실제 주소로 업데이트: 보라매로 지하 1층
    address: '서울특별시 관악구 보라매로 17, 지하1층 (봉천동)',
    businessHours: '평일 09:00-20:00, 주말 09:00-18:00',
    services: { hotel: true, grooming: true, daycare: true },
    logoText: 'Chardor',
    slogan: '특별한 케어, 특별한 시간',
  },

  hallohund: {
    name: 'HalloHund',
    nameEn: 'HalloHund',
    description: '독일식 프리미엄 펫케어',
    primaryColor: '#EF4444', // Red
    secondaryColor: '#F59E0B', // Amber
    phone: '031-456-7890',
    email: 'info@hallohund.com',
    // 정확한 위치를 찾을 수 없어 기존 주소를 유지합니다.
    address: '경기도 성남시 분당구',
    businessHours: '평일 09:00-20:00, 주말 09:00-18:00',
    services: { hotel: true, grooming: true, daycare: true },
    logoText: 'HalloHund',
    slogan: 'Deutsche Qualität für Ihren Hund',
  },

  dgroo_o: {
    name: '디그루',
    nameEn: 'D.Groo',
    description: '반려동물과 함께하는 행복',
    primaryColor: '#10B981', // Green
    secondaryColor: '#3B82F6', // Blue
    phone: '031-567-8901',
    email: 'info@dgroo.com',
    // 정확한 위치를 찾을 수 없어 기존 주소를 유지합니다.
    address: '경기도 성남시 분당구',
    businessHours: '평일 09:00-20:00, 주말 09:00-18:00',
    services: { hotel: true, grooming: true, daycare: true },
    logoText: 'D.Groo',
    slogan: '당신의 반려동물, 우리의 가족',
  },

  groomingtime: {
    name: '그루밍타임',
    nameEn: 'Grooming Time',
    description: '전문 미용 서비스',
    primaryColor: '#F59E0B', // Amber
    secondaryColor: '#8B5CF6', // Purple
    // 서초구 방배동 잇츠그루밍타임 전화번호
    phone: '02-533-8086',
    email: 'info@groomingtime.com',
    // 실제 주소로 업데이트: 방배동 잇츠그루밍타임
    address: '서울특별시 서초구 효령로 99 (방배동 915-12)',
    businessHours: '평일 09:00-20:00, 주말 09:00-18:00',
    services: { hotel: false, grooming: true, daycare: false },
    logoText: 'Grooming Time',
    slogan: '아름다움을 위한 시간',
  },

  petsalon: {
    name: '펫살롱',
    nameEn: 'Pet Salon',
    description: '프리미엄 펫 뷰티 살롱',
    primaryColor: '#EC4899', // Pink
    secondaryColor: '#8B5CF6', // Purple
    phone: '031-789-0123',
    email: 'info@petsalon.com',
    // 실제 주소로 업데이트: 왕십리 펫살롱
    address: '서울특별시 성동구 마장로 137, 221동 1층 1112호 (상왕십리동, 텐즈힐)',
    businessHours: '평일 09:00-20:00, 주말 09:00-18:00',
    services: { hotel: false, grooming: true, daycare: true },
    logoText: 'Pet Salon',
    slogan: '반려동물 전문 뷰티 케어',
  },

  oodangdang: {
    name: '우당탕',
    nameEn: 'OoDangDang',
    description: '활기찬 반려동물 놀이터',
    primaryColor: '#F59E0B', // Amber
    secondaryColor: '#EF4444', // Red
    phone: '031-890-1234',
    email: 'info@oodangdang.com',
    // 실제 주소로 업데이트: 신당역 근처 우댕댕펫살롱
    address: '서울특별시 중구 퇴계로88길 58, 1층 (신당동)',
    businessHours: '평일 09:00-20:00, 주말 09:00-18:00',
    services: { hotel: true, grooming: true, daycare: true },
    logoText: '우당탕',
    slogan: '신나는 하루, 즐거운 시간',
  },

  puppy: {
    name: 'Puppy',
    nameEn: 'Puppy',
    description: '강아지 전문 케어',
    primaryColor: '#3B82F6', // Blue
    secondaryColor: '#10B981', // Green
    phone: '031-901-2345',
    email: 'info@puppy.com',
    address: '경기도 성남시 분당구',
    businessHours: '평일 09:00-20:00, 주말 09:00-18:00',
    services: { hotel: true, grooming: true, daycare: true },
    logoText: 'Puppy',
    slogan: '강아지가 행복한 공간',
  },

  puppycare: {
    name: 'PuppyCare',
    nameEn: 'PuppyCare',
    description: '전문 강아지 케어 센터',
    primaryColor: '#14B8A6', // Teal
    secondaryColor: '#F59E0B', // Amber
    phone: '031-012-3456',
    email: 'info@puppycare.com',
    address: '경기도 성남시 분당구',
    businessHours: '평일 09:00-20:00, 주말 09:00-18:00',
    services: { hotel: true, grooming: true, daycare: true },
    logoText: 'PuppyCare',
    slogan: '사랑과 전문성의 만남',
  },

  pet: {
    name: 'Pet',
    nameEn: 'Pet',
    description: '반려동물 토탈 케어',
    primaryColor: '#8B5CF6', // Purple
    secondaryColor: '#EC4899', // Pink
    phone: '031-123-4567',
    email: 'info@pet.com',
    address: '경기도 성남시 분당구',
    businessHours: '평일 09:00-20:00, 주말 09:00-18:00',
    services: { hotel: true, grooming: true, daycare: true },
    logoText: 'Pet',
    slogan: '반려동물과 함께하는 삶',
  },

  petcare: {
    name: 'PetCare',
    nameEn: 'PetCare',
    description: '종합 펫케어 서비스',
    primaryColor: '#10B981', // Green
    secondaryColor: '#3B82F6', // Blue
    phone: '031-234-5678',
    email: 'info@petcare.com',
    address: '경기도 성남시 분당구',
    businessHours: '평일 09:00-20:00, 주말 09:00-18:00',
    services: { hotel: true, grooming: true, daycare: true },
    logoText: 'PetCare',
    slogan: '전문가의 손길',
  },

  pethotel: {
    name: 'PetHotel',
    nameEn: 'PetHotel',
    description: '프리미엄 펫 호텔',
    primaryColor: '#EF4444', // Red
    secondaryColor: '#F59E0B', // Amber
    phone: '031-345-6789',
    email: 'info@pethotel.com',
    address: '경기도 성남시 분당구',
    businessHours: '평일 09:00-20:00, 주말 09:00-18:00',
    services: { hotel: true, grooming: true, daycare: true },
    logoText: 'PetHotel',
    slogan: '5성급 펫 호텔',
  },

  // 미용하는 강아지 살롱 설정
  '미용하는강아지': {
    name: '미용하는 강아지',
    nameEn: 'Mi-yong-haneun Gangaji',
    description: '전문 반려견 미용 서비스',
    primaryColor: '#F59E0B', // Amber
    secondaryColor: '#EC4899', // Pink
    phone: '02-373-3887',
    email: 'info@miyongdog.com',
    address: '서울특별시 관악구 서림길 17, 1층 (신림동)',
    businessHours: '평일 10:00-20:00, 주말 10:00-18:00',
    services: { hotel: false, grooming: true, daycare: false },
    logoText: '미용하는 강아지',
    slogan: '전문가의 손길로 아름다움을 더하다',
  },
};

// 현재 사이트 식별 함수
export function getCurrentSite(): string {
  if (typeof window === 'undefined') return 'puppyhotel';
  
  const pathname = window.location.pathname;
  const match = pathname.match(/^\/(ordinarymung|chardor|hallohund|dgroo_o|groomingtime|petsalon|oodangdang|미용하는강아지|puppy|puppycare|pet|petcare|pethotel)/);
  
  return match ? match[1] : 'puppyhotel';
}

// 현재 사이트의 브랜딩 정보 가져오기
export function getSiteBranding(): SiteBranding {
  const siteId = getCurrentSite();
  return SITE_CONFIGS[siteId] || SITE_CONFIGS.puppyhotel;
}