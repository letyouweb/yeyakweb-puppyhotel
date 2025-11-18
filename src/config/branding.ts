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
  // PuppyHotel 기본 설정 (샘플 템플릿)
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
};

// 현재 사이트 식별 함수
export function getCurrentSite(): string {
  if (typeof window === 'undefined') return 'puppyhotel';
  
  const pathname = window.location.pathname;
  const match = pathname.match(/^\/(puppyhotel)/);
  
  return match ? match[1] : 'puppyhotel';
}

// 현재 사이트의 브랜딩 정보 가져오기
export function getSiteBranding(): SiteBranding {
  const siteId = getCurrentSite();
  return SITE_CONFIGS[siteId] || SITE_CONFIGS.puppyhotel;
}
