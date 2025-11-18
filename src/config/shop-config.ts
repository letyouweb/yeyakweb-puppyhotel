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
  puppyhotel: {
    id: "puppyhotel",
    name: "PuppyHotel",
    title: "PuppyHotel | 프리미엄 반려동물 호텔 & 미용",
    description: "안전하고 전문적인 반려동물 호텔, 미용, 데이케어 서비스를 제공합니다",
    address: "경기도 성남시 분당구 판교로 123",
    phone: "031-123-4567",
    hours: "평일 09:00-20:00, 주말 09:00-18:00",
    services: ["프리미엄 호텔", "전문 미용", "데이케어", "24시간 CCTV", "픽업 서비스"],
    instagram: "@puppyhotel",
    color: "#14B8A6"
  }
};

export function getShopConfig(shopId?: string | null): ShopConfig {
  // URL 쿼리 파라미터에서 shop 가져오기
  const params = new URLSearchParams(window.location.search);
  const shopParam = shopId || params.get('shop');
  
  if (shopParam && SHOP_CONFIGS[shopParam]) {
    return SHOP_CONFIGS[shopParam];
  }
  
  // 기본값 (puppyhotel)
  return SHOP_CONFIGS.puppyhotel;
}
