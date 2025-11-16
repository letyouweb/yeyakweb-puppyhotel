export interface ShopConfig {
  id: string;
  name: string;
  title: string;
  description: string;
  address: string;
  phone: string;
  hours: string;
  services: string[];
  instagram: string;
  color: string;
}

export const SHOP_CONFIGS: Record<string, ShopConfig> = {
  ordinarymung: {
    id: "ordinarymung",
    name: "오니너리 멍",
    title: "오니너리 멍 | 프리미엄 애견미용 & 호텔",
    description: "강남구 최고의 애견미용 서비스",
    address: "서울 강남구 역삼동 123-45",
    phone: "02-1234-5678",
    hours: "매일 10:00 - 20:00",
    services: ["프리미엄 가위컷", "스타일컷", "SPA 목욕", "애견호텔", "픽업 서비스"],
    instagram: "@ordinarymung",
    color: "#FF6B9D"
  },
  chardor: {
    id: "chardor",
    name: "샤도르 애견미용",
    title: "샤도르 | 봉천동 1등 애견미용실",
    description: "봉천동에서 가장 사랑받는 애견미용실",
    address: "서울 관악구 봉천동 987-65",
    phone: "02-2345-6789",
    hours: "화-일 09:30 - 19:30 (월요일 휴무)",
    services: ["가위컷 전문", "노견 케어", "피부 트러블 케어", "발톱 관리"],
    instagram: "@chardor_petcare",
    color: "#4ECDC4"
  },
  hallohund: {
    id: "hallohund",
    name: "할로훈트",
    title: "할로훈트 | 독일식 애견미용",
    description: "독일 그루밍 기법으로 특별한 케어",
    address: "서울 관악구 봉천동 456-78",
    phone: "02-3456-7890",
    hours: "매일 10:00 - 20:00",
    services: ["독일식 그루밍", "대형견 전문", "쇼컷", "위생미용"],
    instagram: "@hallohund_grooming",
    color: "#95E1D3"
  },
  dgroo_o: {
    id: "dgroo_o",
    name: "디그루오",
    title: "디그루오 | 스타일리시 펫살롱",
    description: "트렌디한 스타일컷의 명가",
    address: "서울 관악구 봉천동 234-56",
    phone: "02-4567-8901",
    hours: "매일 11:00 - 21:00",
    services: ["트렌디 스타일컷", "컬러링", "네일아트", "스파 패키지"],
    instagram: "@dgroo_o",
    color: "#FFE66D"
  },
  groomingtime: {
    id: "groomingtime",
    name: "그루밍타임",
    title: "그루밍타임 | 프리미엄 펫케어",
    description: "당신의 반려견을 위한 특별한 시간",
    address: "서울 관악구 봉천동 345-67",
    phone: "02-5678-9012",
    hours: "화-일 10:00 - 19:00 (월요일 휴무)",
    services: ["1:1 맞춤 미용", "아로마 테라피", "치석 제거", "피부 진정 케어"],
    instagram: "@groomingtime_official",
    color: "#A8DADC"
  },
  petsalon: {
    id: "petsalon",
    name: "펫살롱",
    title: "펫살롱 | 왕십리 프리미엄 애견미용",
    description: "왕십리역 3번 출구 1분 거리",
    address: "서울 성동구 왕십리로 567-89",
    phone: "02-6789-0123",
    hours: "매일 09:00 - 20:00",
    services: ["프리미엄 컷", "매직 SPA", "애견호텔", "유치원"],
    instagram: "@petsalon_wangsimni",
    color: "#F1FAEE"
  },
  oodangdang: {
    id: "oodangdang",
    name: "우댕댕펫살롱",
    title: "우댕댕펫살롱 | 신당동 애견미용",
    description: "신당역 근처 따뜻한 케어의 시작",
    address: "서울 중구 신당동 678-90",
    phone: "02-7890-1234",
    hours: "화-토 10:00 - 19:00 (일월 휴무)",
    services: ["가위컷", "위생미용", "목욕&드라이", "발톱&귀 관리"],
    instagram: "@oodangdang_pet",
    color: "#FFB4A2"
  },
  "미용하는강아지": {
    id: "미용하는강아지",
    name: "미용하는강아지",
    title: "미용하는강아지 | 봉천동 애견미용",
    description: "10년 경력 원장의 섬세한 손길",
    address: "서울 관악구 봉천동 890-12",
    phone: "02-8901-2345",
    hours: "매일 10:00 - 20:00",
    services: ["10년 경력", "소형견 전문", "노견 케어", "스트레스 최소화"],
    instagram: "@mung_grooming",
    color: "#E3B5A4"
  },
  puppy: {
    id: "puppy",
    name: "퍼피 펫케어",
    title: "퍼피 | 강아지 종합 케어",
    description: "24시간 예약 시스템, 편리한 펫케어",
    address: "서울 강남구 논현동 111-22",
    phone: "02-1111-2222",
    hours: "매일 09:00 - 21:00",
    services: ["종합 미용", "건강검진", "호텔", "놀이방"],
    instagram: "@puppy_care",
    color: "#C9ADA7"
  },
  puppycare: {
    id: "puppycare",
    name: "퍼피케어",
    title: "퍼피케어 | 토탈 펫 서비스",
    description: "반려견의 모든 것을 한 곳에서",
    address: "서울 송파구 잠실동 222-33",
    phone: "02-2222-3333",
    hours: "매일 08:00 - 22:00",
    services: ["미용", "호텔", "유치원", "훈련"],
    instagram: "@puppycare_seoul",
    color: "#9A8C98"
  },
  pet: {
    id: "pet",
    name: "펫 그루밍",
    title: "펫 | 프리미엄 그루밍 살롱",
    description: "세심한 케어, 완벽한 스타일",
    address: "서울 마포구 합정동 333-44",
    phone: "02-3333-4444",
    hours: "화-일 10:00 - 19:00 (월 휴무)",
    services: ["프리미엄 컷", "스타일링", "SPA", "아로마"],
    instagram: "@pet_grooming",
    color: "#4A4E69"
  },
  petcare: {
    id: "petcare",
    name: "펫케어",
    title: "펫케어 | 종합 반려동물 케어",
    description: "건강하고 아름다운 반려생활",
    address: "서울 영등포구 여의도동 444-55",
    phone: "02-4444-5555",
    hours: "매일 09:00 - 20:00",
    services: ["미용", "건강관리", "상담", "용품"],
    instagram: "@petcare_total",
    color: "#22223B"
  },
  pethotel: {
    id: "pethotel",
    name: "펫호텔",
    title: "펫호텔 | 24시간 프리미엄 호텔",
    description: "CCTV 실시간 확인, 안심 케어",
    address: "서울 서초구 반포동 555-66",
    phone: "02-5555-6666",
    hours: "24시간 운영",
    services: ["24시간 호텔", "실시간 CCTV", "픽업/배송", "놀이방"],
    instagram: "@pethotel_premium",
    color: "#F2E9E4"
  }
};

export function getShopConfig(shopId?: string | null): ShopConfig {
  // URL 쿼리 파라미터에서 shop 가져오기
  const params = new URLSearchParams(window.location.search);
  const shopParam = shopId || params.get('shop');
  
  if (shopParam && SHOP_CONFIGS[shopParam]) {
    return SHOP_CONFIGS[shopParam];
  }
  
  // 기본값 (ordinarymung)
  return SHOP_CONFIGS.ordinarymung;
}
