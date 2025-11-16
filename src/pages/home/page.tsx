import { useState, useEffect } from 'react';
import ReservationCalendar from '../../components/feature/ReservationCalendar';
import GroomingCalendar from '../../components/feature/GroomingCalendar';
import HotelCalendar from '../../components/feature/HotelCalendar';
import RealtimeReservationSync, { updateReservationData } from '../../components/feature/RealtimeReservationSync';
import ChatbotReservationAPI from '../../components/ChatbotReservationAPI';
import { reservationService } from '../../lib/supabase';
import { convertToLegacyFormat } from '../../lib/dashboardHelper';
import { getShopConfig, type ShopConfig } from '../../config/shop-config';

export default function HomePage() {
  const [shopConfig, setShopConfig] = useState<ShopConfig>(getShopConfig());
  const [activeService, setActiveService] = useState('hotel');
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarType, setCalendarType] = useState<'all' | 'grooming' | 'hotel'>('all');
  const [showAppModal, setShowAppModal] = useState(false);
  
  // 샵 정보에 따라 페이지 제목 변경
  useEffect(() => {
    document.title = shopConfig.title;
    
    // 메타 태그 업데이트
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', shopConfig.description);
    }
  }, [shopConfig]);
  
  const HOTEL_FORM_INITIAL = {
    petName: '',
    breed: '',
    age: '',
    weight: '',
    checkIn: '',
    checkOut: '',
    notes: '',
    ownerContact: ''
  };
  const GROOMING_FORM_INITIAL = {
    petName: '',
    breed: '',
    age: '',
    weight: '',
    date: '',
    time: '',
    style: '',
    ownerContact: ''
  };

  const [hotelForm, setHotelForm] = useState(HOTEL_FORM_INITIAL);
  const [groomingForm, setGroomingForm] = useState(GROOMING_FORM_INITIAL);
  const [isHotelSubmitting, setIsHotelSubmitting] = useState(false);
  const [isGroomingSubmitting, setIsGroomingSubmitting] = useState(false);
  const [hotelFeedback, setHotelFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [groomingFeedback, setGroomingFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleHotelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isHotelSubmitting) return;
    setHotelFeedback(null);
    setIsHotelSubmitting(true);

    try {
      const created = await reservationService.create({
        pet_name: hotelForm.petName,
        owner_name: '고객',
        service: 'hotel',
        reservation_date: hotelForm.checkIn,
        status: 'pending',
        phone: hotelForm.ownerContact,
        room_type: getRoomTypeByWeight(hotelForm.weight),
        check_in: hotelForm.checkIn,
        check_out: hotelForm.checkOut,
        special_notes: hotelForm.notes
      });

      try {
        const legacy = convertToLegacyFormat(created);
        updateReservationData(legacy, 'hotel');
      } catch (syncError) {
        console.warn('로컬 캘린더 동기화 실패:', syncError);
      }

      setHotelForm({ ...HOTEL_FORM_INITIAL });
      setHotelFeedback({
        type: 'success',
        message: '호텔 예약 신청이 접수되었습니다. 관리자가 확인 후 연락드립니다.'
      });
      alert('호텔 예약 신청이 접수되었습니다. 관리자가 확인 후 연락드립니다.');
    } catch (error) {
      console.error('호텔 예약 실패:', error);
      setHotelFeedback({
        type: 'error',
        message: '예약 처리 중 문제가 발생했습니다. 다시 시도해주세요.'
      });
    } finally {
      setIsHotelSubmitting(false);
    }
  };

  const handleGroomingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGroomingSubmitting) return;
    setGroomingFeedback(null);
    setIsGroomingSubmitting(true);

    try {
      const created = await reservationService.create({
        pet_name: groomingForm.petName,
        owner_name: '고객',
        service: 'grooming',
        reservation_date: groomingForm.date,
        reservation_time: groomingForm.time,
        status: 'pending',
        phone: groomingForm.ownerContact,
        grooming_style: groomingForm.style,
        special_notes: ''
      });

      try {
        const legacy = convertToLegacyFormat(created);
        updateReservationData(legacy, 'grooming');
      } catch (syncError) {
        console.warn('로컬 캘린더 동기화 실패:', syncError);
      }

      setGroomingForm({ ...GROOMING_FORM_INITIAL });
      setGroomingFeedback({
        type: 'success',
        message: '미용 예약 신청이 접수되었습니다. 관리자가 확인 후 연락드립니다.'
      });
      alert('미용 예약 신청이 접수되었습니다. 관리자가 확인 후 연락드립니다.');
    } catch (error) {
      console.error('미용 예약 실패:', error);
      setGroomingFeedback({
        type: 'error',
        message: '예약 처리 중 문제가 발생했습니다. 다시 시도해주세요.'
      });
    } finally {
      setIsGroomingSubmitting(false);
    }
  };

  const getRoomTypeByWeight = (weight: string): 'small' | 'medium' | 'large' | 'cat' => {
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum)) return 'medium';
    if (weightNum <= 7) return 'small';
    if (weightNum <= 15) return 'medium';
    return 'large';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 실시간 예약 동기화 컴포넌트 */}
      <RealtimeReservationSync />
      
      {/* 챗봇 예약 조회 API */}
      <ChatbotReservationAPI />

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Pacifico, serif' }}>
                PuppyHotel
              </h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#services" className="text-gray-700 hover:text-teal-600 font-medium">
                서비스
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-teal-600 font-medium">
                요금안내
              </a>
              <a href="#facilities" className="text-gray-700 hover:text-teal-600 font-medium">
                시설소개
              </a>
              <a href="#reviews" className="text-gray-700 hover:text-teal-600 font-medium">
                후기
              </a>
              <a href="#contact" className="text-gray-700 hover:text-teal-600 font-medium">
                오시는길
              </a>
            </nav>
            <div className="flex items-center space-x-4">
              <a
                href="tel:031-123-4567"
                className="bg-teal-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer"
              >
                <i className="ri-phone-line mr-2"></i>전화상담
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="relative h-screen flex flex-col justify-between bg-cover bg-center"
        style={{
          backgroundImage:
            'url(https://readdy.ai/api/search-image?query=Happy%20golden%20retriever%20and%20small%20dogs%20playing%20together%20in%20a%20bright%2C%20clean%2C%20modern%20pet%20daycare%20facility%20with%20pastel%20yellow%20and%20mint%20green%20accents%2C%20professional%20pet%20care%20environment%2C%20warm%20lighting%2C%20joyful%20atmosphere%2C%20high%20quality%20photography&width=1920&height=1080&seq=hero1&orientation=landscape)',
        }}
      >
        <div className="absolute inset-0 bg-black/30"></div>

        {/* 상단 제목 */}
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4 pt-48">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            우리 아이의 <span className="text-yellow-300">행복한 시간</span>
          </h1>
        </div>

        {/* 하단 텍스트와 버튼 */}
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4 pb-20">
          <p className="text-xl md:text-2xl mb-8 text-gray-100">
            안전한 놀이방에서 소중한 반려동물을 돌봐드립니다
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#reservation"
              className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-full text-lg font-bold hover:bg-yellow-300 transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-hotel-line mr-2"></i>호텔 예약하기
            </a>
            <a
              href="#reservation"
              className="bg-teal-500 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-teal-600 transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-scissors-line mr-2"></i>미용 예약하기
            </a>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">프리미엄 펫케어 서비스</h2>
            <p className="text-xl text-gray-600">전문적이고 안전한 반려동물 케어 서비스를 제공합니다</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Hotel Service */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-6">
                <i className="ri-hotel-line text-2xl text-teal-600"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">반려동물 호텔</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <i className="ri-check-line text-teal-500 mr-3"></i>
                  24시간 CCTV 모니터링
                </li>
                <li className="flex items-center">
                  <i className="ri-check-line text-teal-500 mr-3"></i>
                  개별 룸 (소/중/대형견)
                </li>
                <li className="flex items-center">
                  <i className="ri-check-line text-teal-500 mr-3"></i>
                  산책 2회/일
                </li>
                <li className="flex items-center">
                  <i className="ri-check-line text-teal-500 mr-3"></i>
                  식사 제공 (사료 지참 가능)
                </li>
              </ul>
            </div>

            {/* Grooming Service */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                <i className="ri-scissors-line text-2xl text-yellow-600"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">미용 서비스</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <i className="ri-check-line text-yellow-500 mr-3"></i>
                  전문 미용사 3명 상주
                </li>
                <li className="flex items-center">
                  <i className="ri-check-line text-yellow-500 mr-3"></i>
                  위생적인 1:1 미용
                </li>
                <li className="flex items-center">
                  <i className="ri-check-line text-yellow-500 mr-3"></i>
                  약욕 옵션 제공
                </li>
                <li className="flex items-center">
                  <i className="ri-check-line text-yellow-500 mr-3"></i>
                  견종별 전문 케어
                </li>
              </ul>
            </div>

            {/* Daycare Service */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-6">
                <i className="ri-gamepad-line text-2xl text-teal-600"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">놀이방 데이케어</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <i className="ri-check-line text-teal-500 mr-3"></i>
                  낮 시간 맡기기
                </li>
                <li className="flex items-center">
                  <i className="ri-check-line text-teal-5
                  mr-3"></i>
                  친구들과 놀이
                </li>
                <li className="flex items-center">
                  <i className="ri-check-line text-teal-500 mr-3"></i>
                  사회성 훈련
                </li>
                <li className="flex items-center">
                  <i className="ri-check-line text-teal-500 mr-3"></i>
                  전문 관리사 케어
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">투명한 요금 안내</h2>
            <p className="text-xl text-gray-600">합리적이고 투명한 가격으로 최고의 서비스를 제공합니다</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Hotel Pricing */}
            <div className="bg-teal-50 rounded-2xl p-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">호텔 요금표</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                  <div>
                    <span className="font-semibold text-gray-900">소형견 (7kg 이하)</span>
                    <p className="text-sm text-gray-600">치와와, 요크셔테리어 등</p>
                  </div>
                  <span className="text-2xl font-bold text-teal-600">30,000원/1박</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                  <div>
                    <span className="font-semibold text-gray-900">중형견 (7-15kg)</span>
                    <p className="text-sm text-gray-600">코기, 비글 등</p>
                  </div>
                  <span className="text-2xl font-bold text-teal-600">40,000원/1박</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                  <div>
                    <span className="font-semibold text-gray-900">대형견 (15kg 이상)</span>
                    <p className="text-sm text-gray-600">골든리트리버, 래브라도 등</p>
                  </div>
                  <span className="text-2xl font-bold text-teal-600">50,000원/1박</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                  <div>
                    <span className="font-semibold text-gray-900">고양이</span>
                    <p className="text-sm text-gray-600">모든 고양이</p>
                  </div>
                  <span className="text-2xl font-bold text-teal-600">35,000원/1박</span>
                </div>
              </div>
              <div className="mt-6 p-4 bg-yellow-100 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">할인 혜택</h4>
                <p className="text-sm text-gray-700">• 7일 이상 장기 이용 시 10% 할인</p>
                <p className="text-sm text-gray-700">• 목욕 서비스 +15,000원</p>
                <p className="text-sm text-gray-700">• 특별 간식 +5,000원</p>
              </div>
            </div>

            {/* Grooming Pricing */}
            <div className="bg-yellow-50 rounded-2xl p-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">미용 요금표</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                  <div>
                    <span className="font-semibold text-gray-900">소형견 기본</span>
                    <p className="text-sm text-gray-600">목욕+컷+발톱정리</p>
                  </div>
                  <span className="text-2xl font-bold text-yellow-600">40,000원</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                  <div>
                    <span className="font-semibold text-gray-900">중형견 기본</span>
                    <p className="text-sm text-gray-600">목욕+컷+발톱정리</p>
                  </div>
                  <span className="text-2xl font-bold text-yellow-600">60,000원</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                  <div>
                    <span className="font-semibold text-gray-900">대형견 기본</span>
                    <p className="text-sm text-gray-600">목욕+컷+발톱정리</p>
                  </div>
                  <span className="text-2xl font-bold text-yellow-600">80,000원</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                  <div>
                    <span className="font-semibold text-gray-900">특수견종</span>
                    <p className="text-sm text-gray-600">푸들, 비숑 등</p>
                  </div>
                  <span className="text-2xl font-bold text-yellow-600">100,000원~</span>
                </div>
              </div>
              <div className="mt-6 p-4 bg-teal-100 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">추가 서비스</h4>
                <p className="text-sm text-gray-700">• 발바닥 정리 10,000원</p>
                <p className="text-sm text-gray-700">• 얼굴 부분컷 15,000원</p>
                <p className="text-sm text-gray-700">• 약욕 서비스 +20,000원</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Facilities Section */}
      <section id="facilities" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">최고급 시설 소개</h2>
            <p className="text-xl text-gray-600">반려동물이 편안하고 안전하게 지낼 수 있는 프리미엄 시설</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div 
                className="w-full h-48 bg-cover bg-center rounded-lg mb-6"
                style={{
                  backgroundImage: 'url(https://readdy.ai/api/search-image?query=Modern%20luxury%20pet%20hotel%20room%20with%20comfortable%20bed%2C%20toys%2C%20and%20clean%20environment%2C%20bright%20lighting%2C%20professional%20pet%20care%20facility%20interior%20design%2C%20high%20quality%20photography&width=400&height=300&seq=facility1&orientation=landscape)'
                }}
              ></div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">프리미엄 개별룸</h3>
              <p className="text-gray-600">크기별 맞춤 개별룸으로 편안한 휴식 공간을 제공합니다.</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div 
                className="w-full h-48 bg-cover bg-center rounded-lg mb-6"
                style={{
                  backgroundImage: 'url(https://readdy.ai/api/search-image?query=Professional%20pet%20grooming%20salon%20with%20modern%20equipment%2C%20clean%20workspace%2C%20bright%20lighting%2C%20professional%20grooming%20tools%20and%20stations%2C%20high%20quality%20photography&width=400&height=300&seq=facility2&orientation=landscape)'
                }}
              ></div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">전문 미용실</h3>
              <p className="text-gray-600">최신 장비와 전문 미용사가 상주하는 위생적인 미용 공간입니다.</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div 
                className="w-full h-48 bg-cover bg-center rounded-lg mb-6"
                style={{
                  backgroundImage: 'url(https://readdy.ai/api/search-image?query=Spacious%20indoor%20pet%20playground%20with%20colorful%20toys%2C%20safe%20play%20equipment%2C%20bright%20natural%20lighting%2C%20clean%20modern%20design%2C%20high%20quality%20photography&width=400&height=300&seq=facility3&orientation=landscape)'
                }}
              ></div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">실내 놀이공간</h3>
              <p className="text-gray-600">넓고 안전한 실내 놀이터에서 친구들과 즐겁게 놀 수 있습니다.</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div 
                className="w-full h-48 bg-cover bg-center rounded-lg mb-6"
                style={{
                  backgroundImage: 'url(https://readdy.ai/api/search-image?query=Outdoor%20pet%20exercise%20area%20with%20green%20grass%2C%20walking%20paths%2C%20safe%20fencing%2C%20natural%20environment%20for%20dogs%20to%20play%20and%20exercise%2C%20high%20quality%20photography&width=400&height=300&seq=facility4&orientation=landscape)'
                }}
              ></div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">야외 운동장</h3>
              <p className="text-gray-600">자연 친화적인 야외 공간에서 자유롭게 뛰어놀 수 있습니다.</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div 
                className="w-full h-48 bg-cover bg-center rounded-lg mb-6"
                style={{
                  backgroundImage: 'url(https://readdy.ai/api/search-image?query=Modern%20pet%20medical%20examination%20room%20with%20veterinary%20equipment%2C%20clean%20white%20interior%2C%20professional%20medical%20setup%2C%20bright%20lighting%2C%20high%20quality%20photography&width=400&height=300&seq=facility5&orientation=landscape)'
                }}
              ></div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">의료 시설</h3>
              <p className="text-gray-600">응급상황에 대비한 기본 의료 시설과 수의사 연계 서비스를 제공합니다.</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div 
                className="w-full h-48 bg-cover bg-center rounded-lg mb-6"
                style={{
                  backgroundImage: 'url(https://readdy.ai/api/search-image?query=Pet%20food%20preparation%20area%20with%20clean%20stainless%20steel%20equipment%2C%20organized%20storage%2C%20hygienic%20food%20service%20setup%2C%20professional%20kitchen%20design%2C%20high%20quality%20photography&width=400&height=300&seq=facility6&orientation=landscape)'
                }}
              ></div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">급식 시설</h3>
              <p className="text-gray-600">위생적인 급식 시설에서 개별 맞춤 식단을 제공합니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Management Section */}
      <section className="py-20 bg-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">안전한 관리 시스템</h2>
            <p className="text-xl text-gray-600">24시간 전문 관리로 소중한 반려동물을 안전하게 돌봅니다</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-shield-check-line text-2xl text-teal-600"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">24시간 관리</h3>
              <p className="text-gray-600">전문 관리사가 24시간 상주하여 반려동물을 돌봅니다</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-heart-pulse-line text-2xl text-yellow-600"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">건강 체크</h3>
              <p className="text-gray-600">매일 건강 상태를 체크하고 이상 시 즉시 연락드립니다</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-phone-line text-2xl text-teal-600"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">실시간 소통</h3>
              <p className="text-gray-600">반려동물 상태를 정기적으로 사진과 함께 전달해드립니다</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-first-aid-kit-line text-2xl text-yellow-600"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">응급 대응</h3>
              <p className="text-gray-600">응급상황 시 즉시 병원 연계 및 보호자 연락 시스템</p>
            </div>
          </div>

          <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">안심 서비스 약속</h3>
              <p className="text-gray-600">PuppyHotel만의 특별한 케어 서비스를 경험해보세요</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-camera-line text-3xl text-teal-600"></i>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">일일 사진 전송</h4>
                <p className="text-gray-600">매일 우리 아이의 모습을 사진으로 전송해드립니다</p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-file-text-line text-3xl text-yellow-600"></i>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">일일 케어 리포트</h4>
                <p className="text-gray-600">식사, 놀이, 휴식 등 하루 일과를 상세히 기록해드립니다</p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-customer-service-line text-3xl text-teal-600"></i>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">24시간 상담</h4>
                <p className="text-gray-600">언제든지 궁금한 점이나 걱정사항을 상담받으실 수 있습니다</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">고객 후기</h2>
            <p className="text-xl text-gray-600">PuppyHotel을 이용하신 고객들의 생생한 후기를 확인해보세요</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-yellow-50 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mr-4">
                  <i className="ri-user-line text-xl text-teal-600"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">김민수님</h4>
                  <p className="text-sm text-gray-600">골든리트리버 '해피' 보호자</p>
                </div>
              </div>
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className="ri-star-fill text-yellow-400"></i>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed">
                "출장으로 일주일간 맡겼는데 정말 안심이 되었어요. 매일 사진도 보내주시고 
                해피가 스트레스 받지 않고 잘 지내는 모습을 볼 수 있어서 감사했습니다."
              </p>
            </div>

            <div className="bg-teal-50 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                  <i className="ri-user-line text-xl text-yellow-600"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">박지영님</h4>
                  <p className="text-sm text-gray-600">말티즈 '코코' 보호자</p>
                </div>
              </div>
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className="ri-star-fill text-yellow-400"></i>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed">
                "미용 서비스가 정말 훌륭해요! 코코가 예뻐져서 돌아왔어요. 
                직원분들도 친절하시고 시설도 깨끗해서 재방문 의사 100%입니다."
              </p>
            </div>

            <div className="bg-yellow-50 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mr-4">
                  <i className="ri-user-line text-xl text-teal-600"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">이준호님</h4>
                  <p className="text-sm text-gray-600">비글 '바둑이' 보호자</p>
                </div>
              </div>
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className="ri-star-fill text-yellow-400"></i>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed">
                "처음에는 걱정이 많았는데 바둑이가 너무 좋아해요. 
                다른 강아지들과도 잘 어울리고 집에 와서도 기분이 좋아 보여요."
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <div className="bg-gray-50 rounded-2xl p-8 max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">더 많은 후기가 궁금하다면?</h3>
              <p className="text-gray-600 mb-6">
                네이버, 구글 리뷰에서 PuppyHotel의 더 많은 생생한 후기를 확인해보세요
              </p>
              <div className="flex justify-center space-x-4">
                <button className="bg-green-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-700 transition-colors whitespace-nowrap cursor-pointer">
                  <i className="ri-search-line mr-2"></i>네이버 리뷰 보기
                </button>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap cursor-pointer">
                  <i className="ri-google-line mr-2"></i>구글 리뷰 보기
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 예약하기 섹션 */}
      <section id="reservation" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">예약하기</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              우리 아이를 위한 최고의 서비스를 예약하세요
            </p>

            {/* 달력 확인 버튼 추가 */}
            <div className="mb-8">
              <button
                onClick={() => {
                  setCalendarType('all');
                  setShowCalendar(true);
                }}
                className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-full font-semibold hover:bg-yellow-500 transition-colors shadow-md whitespace-nowrap cursor-pointer mr-4"
              >
                <i className="ri-calendar-line mr-2"></i>예약 현황 먼저 확인하기
              </button>
              <span className="text-sm text-gray-600">원하는 날짜가 예약 가능한지 미리 확인해보세요</span>
            </div>
          </div>

          {/* Reservation Form */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="flex border-b">
                <button
                  onClick={() => setActiveService('hotel')}
                  className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                    activeService === 'hotel'
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <i className="ri-hotel-line mr-2"></i>호텔 예약
                </button>
                <button
                  onClick={() => setActiveService('grooming')}
                  className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                    activeService === 'grooming'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <i className="ri-scissors-line mr-2"></i>미용 예약
                </button>
              </div>

              <div className="p-8">
                {activeService === 'hotel' && (
                  <form onSubmit={handleHotelSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Pet Name */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          반려동물 이름 *
                        </label>
                        <input
                          type="text"
                          required
                          value={hotelForm.petName}
                          onChange={(e) => setHotelForm({ ...hotelForm, petName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                          placeholder="반려동물 이름을 입력하세요"
                        />
                      </div>

                      {/* Breed */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          견종/묘종 *
                        </label>
                        <input
                          type="text"
                          required
                          value={hotelForm.breed}
                          onChange={(e) => setHotelForm({ ...hotelForm, breed: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                          placeholder="골든리트리버, 말티즈 등"
                        />
                      </div>

                      {/* Age */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          나이 *
                        </label>
                        <input
                          type="text"
                          required
                          value={hotelForm.age}
                          onChange={(e) => setHotelForm({ ...hotelForm, age: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                          placeholder="3세, 1년 6개월 등"
                        />
                      </div>

                      {/* Weight */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          체중 *
                        </label>
                        <input
                          type="text"
                          required
                          value={hotelForm.weight}
                          onChange={(e) => setHotelForm({ ...hotelForm, weight: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                          placeholder="5kg, 12kg 등"
                        />
                      </div>

                      {/* Check-in */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          체크인 날짜 *
                        </label>
                        <input
                          type="date"
                          required
                          value={hotelForm.checkIn}
                          onChange={(e) => setHotelForm({ ...hotelForm, checkIn: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                        />
                      </div>

                      {/* Check-out */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          체크아웃 날짜 *
                        </label>
                        <input
                          type="date"
                          required
                          value={hotelForm.checkOut}
                          onChange={(e) => setHotelForm({ ...hotelForm, checkOut: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>

                    {/* Owner Contact */}
                    <div className="mt-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        보호자 연락처 *
                      </label>
                      <input
                        type="tel"
                        required
                        value={hotelForm.ownerContact}
                        onChange={(e) => setHotelForm({ ...hotelForm, ownerContact: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                        placeholder="010-1234-5678"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="text-center mt-8">
                      <button
                        type="submit"
                        className="bg-teal-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-teal-700 transition-colors"
                      >
                        예약 신청
                      </button>
                    </div>
                  </form>
                )}

                {activeService === 'grooming' && (
                  <form onSubmit={handleGroomingSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Pet Name */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          반려동물 이름 *
                        </label>
                        <input
                          type="text"
                          required
                          value={groomingForm.petName}
                          onChange={(e) => setGroomingForm({ ...groomingForm, petName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                          placeholder="반려동물 이름"
                        />
                      </div>

                      {/* Breed */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          견종/묘종 *
                        </label>
                        <input
                          type="text"
                          required
                          value={groomingForm.breed}
                          onChange={(e) => setGroomingForm({ ...groomingForm, breed: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                          placeholder="견종/묘종"
                        />
                      </div>

                      {/* Date */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          예약 날짜 *
                        </label>
                        <input
                          type="date"
                          required
                          value={groomingForm.date}
                          onChange={(e) => setGroomingForm({ ...groomingForm, date: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                          placeholder="예약 날짜"
                        />
                      </div>

                      {/* Time */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          시간 *
                        </label>
                        <input
                          type="time"
                          required
                          value={groomingForm.time}
                          onChange={(e) => setGroomingForm({ ...groomingForm, time: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                          placeholder="시간"
                        />
                      </div>

                      {/* Style */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          스타일 (선택)
                        </label>
                        <input
                          type="text"
                          value={groomingForm.style}
                          onChange={(e) => setGroomingForm({ ...groomingForm, style: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                          placeholder="예: 미니멀, 프릴 등"
                        />
                      </div>

                      {/* Owner Contact */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          보호자 연락처 *
                        </label>
                        <input
                          type="tel"
                          required
                          value={groomingForm.ownerContact}
                          onChange={(e) => setGroomingForm({ ...groomingForm, ownerContact: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                          placeholder="010-1234-5678"
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="text-center mt-8">
                      <button
                        type="submit"
                        className="bg-yellow-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-yellow-700 transition-colors"
                      >
                        예약 신청
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">오시는 길</h2>
            <p className="text-xl text-gray-600">PuppyHotel을 찾아오시는 방법을 안내해드립니다</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">연락처 정보</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mr-4">
                      <i className="ri-phone-line text-xl text-teal-600"></i>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">전화번호</p>
                      <p className="text-gray-600">031-123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                      <i className="ri-map-pin-line text-xl text-yellow-600"></i>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">주소</p>
                      <p className="text-gray-600">경기도 성남시 분당구 판교로 123</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mr-4">
                      <i className="ri-time-line text-xl text-teal-600"></i>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">운영시간</p>
                      <p className="text-gray-600">평일 09:00 - 20:00</p>
                      <p className="text-gray-600">주말 09:00 - 18:00</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                      <i className="ri-mail-line text-xl text-yellow-600"></i>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">이메일</p>
                      <p className="text-gray-600">info@puppyhotel.com</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">교통편 안내</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      <i className="ri-subway-line mr-2 text-teal-600"></i>지하철
                    </h4>
                    <p className="text-gray-600">신분당선 판교역 2번 출구에서 도보 5분</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      <i className="ri-bus-line mr-2 text-yellow-600"></i>버스
                    </h4>
                    <p className="text-gray-600">판교역 정류장 하차 (9407, 1560, 8109)</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      <i className="ri-car-line mr-2 text-teal-600"></i>자가체
                    </h4>
                    <p className="text-gray-600">무료 주차장 완비 (30대 주차 가능)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">위치</h3>
              <div className="w-full h-96 bg-gray-200 rounded-lg overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3165.8947!2d127.1056!3d37.3947!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzfCsDIzJzQxLjAiTiAxMjfCsDA2JzIwLjIiRQ!5e0!3m2!1sko!2skr!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="PuppyHotel 위치"
                ></iframe>
              </div>
              <div className="mt-4 p-4 bg-teal-50 rounded-lg">
                <p className="text-sm text-teal-700">
                  <i className="ri-information-line mr-2"></i>
                  정확한 위치는 예약 확정 후 상세 주소를 안내해드립니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 앱 다운로드 모달 */}
      {showAppModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 relative">
            <button
              onClick={() => setShowAppModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>

            <div className="text-center">
              <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-smartphone-line text-3xl text-teal-600"></i>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">PuppyHotel 앱</h3>
              <p className="text-gray-600 mb-6">
                실시간 CCTV 모니터링과 예약 관리를 위한 전용 앱을 다운로드하세요
              </p>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <i className="ri-camera-line text-teal-600 mr-3"></i>
                    <span className="text-gray-700">실시간 CCTV 확인</span>
                  </div>
                  <i className="ri-check-line text-green-500"></i>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <i className="ri-calendar-line text-teal-600 mr-3"></i>
                    <span className="text-gray-700">예약 현황 관리</span>
                  </div>
                  <i className="ri-check-line text-green-500"></i>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <i className="ri-notification-line text-teal-600 mr-3"></i>
                    <span className="text-gray-700">실시간 알림</span>
                  </div>
                  <i className="ri-check-line text-green-500"></i>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => alert('iOS 앱은 현재 개발 중입니다. 출시 시 알려드리겠습니다.')}
                  className="flex-1 bg-black text-white px-4 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center cursor-pointer"
                >
                  <i className="ri-apple-line mr-2"></i>
                  App Store
                </button>
                <button
                  onClick={() => alert('Android 앱은 현재 개발 중입니다. 출시 시 알려드리겠습니다.')}
                  className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center cursor-pointer"
                >
                  <i className="ri-google-play-line mr-2"></i>
                  Google Play
                </button>
              </div>

              <p className="text-sm text-gray-500 mt-4">
                앱 출시 예정입니다. 예약 확정 시 앱 출시 알림을 받으실 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Pacifico, serif' }}>
                PuppyHotel
              </h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                반려동물과 보호자가 모두 행복한 시간을 만들어가는 프리미엄 펫케어 서비스입니다. 
                24시간 안전한 돌봄으로 소중한 가족을 책임지겠습니다.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center hover:bg-teal-700 transition-colors cursor-pointer">
                  <i className="ri-facebook-fill"></i>
                </a>
                <a href="#" className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center hover:bg-teal-700 transition-colors cursor-pointer">
                  <i className="ri-instagram-line"></i>
                </a>
                <a href="#" className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center hover:bg-teal-700 transition-colors cursor-pointer">
                  <i className="ri-youtube-line"></i>
                </a>
                <a href="#" className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center hover:bg-teal-700 transition-colors cursor-pointer">
                  <i className="ri-kakao-talk-fill"></i>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">빠른 링크</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#services" className="text-gray-300 hover:text-white transition-colors cursor-pointer">
                    서비스 소개
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-gray-300 hover:text-white transition-colors cursor-pointer">
                    요금 안내
                  </a>
                </li>
                <li>
                  <a href="#facilities" className="text-gray-300 hover:text-white transition-colors cursor-pointer">
                    시설 소개
                  </a>
                </li>
                <li>
                  <a href="#reservation" className="text-gray-300 hover:text-white transition-colors cursor-pointer">
                    예약하기
                  </a>
                </li>
                <li>
                  <a href="#contact" className="text-gray-300 hover:text-white transition-colors cursor-pointer">
                    오시는 길
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-semibold mb-4">연락처</h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <i className="ri-phone-line mr-3 text-teal-400"></i>
                  <span className="text-gray-300">031-123-4567</span>
                </div>
                <div className="flex items-center">
                  <i className="ri-mail-line mr-3 text-teal-400"></i>
                  <span className="text-gray-300">info@puppyhotel.com</span>
                </div>
                <div className="flex items-start">
                  <i className="ri-map-pin-line mr-3 text-teal-400 mt-1"></i>
                  <span className="text-gray-300">
                    경기도 성남시 분당구<br />
                    판교로 123
                  </span>
                </div>
                <div className="flex items-center">
                  <i className="ri-time-line mr-3 text-teal-400"></i>
                  <span className="text-gray-300">
                    평일 09:00-20:00<br />
                    주말 09:00-18:00
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2025 PuppyHotel. All rights reserved.
                <a href="/admin/dashboard" className="ml-4 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer">
                  관리자 로그인
                </a>
              </p>
            </div>
          </div>

        </div>
      </footer>

      {/* 캘린더 모달 */}
      {showCalendar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-900">
                {calendarType === 'all' && '전체 예약 현황'}
                {calendarType === 'grooming' && '미용 예약 현황'}
                {calendarType === 'hotel' && '호텔 예약 현황'}
              </h2>
              <button
                onClick={() => setShowCalendar(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
            
            <div className="p-6">
              {calendarType === 'all' && <ReservationCalendar />}
              {calendarType === 'grooming' && <GroomingCalendar />}
              {calendarType === 'hotel' && <HotelCalendar />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
