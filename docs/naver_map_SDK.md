# 네이버 지도 기반 음식점 리뷰 서비스 - Next.js 연동 가이드

## 📋 연동 개요

네이버 지도 기반 음식점 리뷰 서비스를 Next.js로 개발하기 위해 **SDK와 API**를 연동합니다. Webhook은 본 프로젝트에서 필요하지 않습니다.

| 구분 | 연동 수단 | 용도 | 실행 환경 |
|------|----------|------|----------|
| 지도 표시 | 네이버 지도 JavaScript SDK | 지도 렌더링, 마커 표시, 사용자 인터랙션 | 클라이언트 |
| 음식점 검색 | 네이버 검색 API | 키워드 기반 음식점 검색 | 서버 (API Routes) |
| 주소 변환 | 네이버 Geocoding API | 주소↔좌표 상호 변환 | 서버 (API Routes) |

---

## 1️⃣ 네이버 지도 JavaScript SDK

### 사용 기능
- 지도 렌더링 및 컨트롤
- 음식점 위치 마커 표시
- 마커 클릭 이벤트 처리
- 지도 확대/축소, 이동

### 설치 및 세팅

#### 1. TypeScript 타입 정의 설치
```bash
npm install --save-dev @types/navermaps
```

#### 2. Next.js Script 컴포넌트로 SDK 로드
```tsx
// app/layout.tsx (App Router) 또는 pages/_app.tsx (Pages Router)
import Script from 'next/script';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <Script
          strategy="afterInteractive"
          src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_CLIENT_ID}&submodules=geocoder`}
        />
        {children}
      </body>
    </html>
  );
}
```

### 인증정보 관리

#### 1. 네이버 클라우드 플랫폼에서 발급
1. [네이버 클라우드 플랫폼](https://www.ncloud.com) 로그인
2. Console → AI·NAVER API → Application 등록
3. 서비스 선택: **Web Dynamic Map** 체크
4. 서비스 URL 등록: `http://localhost:3000` (개발), `https://yourdomain.com` (배포)

#### 2. 환경변수 설정
```env
# .env.local
NEXT_PUBLIC_NAVER_CLIENT_ID=your_client_id_here
```

### 호출 방법

```tsx
// components/NaverMap.tsx
'use client';

import { useEffect, useRef } from 'react';

interface MapProps {
  width?: string;
  height?: string;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
}

export default function NaverMap({
  width = '100%',
  height = '500px',
  initialCenter = { lat: 37.5656, lng: 126.9769 },
  initialZoom = 14,
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const naverMapRef = useRef<naver.maps.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || !window.naver) return;

    const mapOptions = {
      center: new naver.maps.LatLng(initialCenter.lat, initialCenter.lng),
      zoom: initialZoom,
      zoomControl: true,
      zoomControlOptions: {
        style: naver.maps.ZoomControlStyle.SMALL,
        position: naver.maps.Position.TOP_RIGHT,
      },
    };

    // 지도 생성
    const map = new naver.maps.Map(mapRef.current, mapOptions);
    naverMapRef.current = map;

    // 마커 추가 예시
    new naver.maps.Marker({
      position: new naver.maps.LatLng(initialCenter.lat, initialCenter.lng),
      map: map,
      title: '음식점 위치',
    });

    // 클린업
    return () => {
      naverMapRef.current?.destroy();
    };
  }, [initialCenter, initialZoom]);

  return <div ref={mapRef} style={{ width, height }} />;
}
```

---

## 2️⃣ 네이버 검색 API (지역 검색)

### 사용 기능
- 키워드 기반 음식점 검색
- 검색 결과의 좌표 정보 획득
- 음식점 상세 정보 조회

### 설치 및 세팅

#### 1. 네이버 개발자 센터에서 애플리케이션 등록
1. [네이버 개발자 센터](https://developers.naver.com) 로그인
2. Application 등록
3. 사용 API 선택: **검색 → 지역** 체크
4. 웹 서비스 URL 등록

### 인증정보 관리

```env
# .env.local
NEXT_PUBLIC_NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret  # 서버 전용
```

### 호출 방법

#### API Route 생성 (서버 사이드)
```typescript
// app/api/search/places/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const display = searchParams.get('display') || '5';
  
  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    );
  }

  try {
    const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(
      query
    )}&display=${display}&sort=random`;

    const response = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': process.env.NAVER_SEARCH_CLIENT_ID!,
        'X-Naver-Client-Secret': process.env.NAVER_SEARCH_CLIENT_SECRET!,
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    
    // 음식점 데이터 가공
    const restaurants = data.items.map((item: any) => ({
      title: item.title.replace(/<[^>]*>/g, ''), // HTML 태그 제거
      address: item.address,
      roadAddress: item.roadAddress,
      mapx: item.mapx,
      mapy: item.mapy,
      category: item.category,
      telephone: item.telephone,
      link: item.link,
    }));

    return NextResponse.json({ restaurants, total: data.total });
  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json(
      { error: 'Failed to search places' },
      { status: 500 }
    );
  }
}
```

#### 클라이언트에서 호출
```typescript
// hooks/useSearchPlaces.ts
import { useState } from 'react';

interface Restaurant {
  title: string;
  address: string;
  roadAddress: string;
  mapx: string;
  mapy: string;
  category: string;
  telephone: string;
  link: string;
}

export function useSearchPlaces() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchPlaces = async (query: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/search/places?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error('검색 요청 실패');
      }

      const data = await response.json();
      return data.restaurants;
    } catch (err) {
      setError(err instanceof Error ? err.message : '검색 중 오류 발생');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { searchPlaces, loading, error };
}
```

---

## 3️⃣ 네이버 Geocoding API

### 사용 기능
- 주소 → 좌표 변환 (Geocoding)
- 좌표 → 주소 변환 (Reverse Geocoding)
- 음식점 주소 기반 정확한 위치 표시

### 설치 및 세팅

#### 1. 네이버 클라우드 플랫폼에서 서비스 추가
1. Console → AI·NAVER API → Application
2. 기존 애플리케이션 수정
3. Maps → **Geocoding**, **Reverse Geocoding** 체크

### 인증정보 관리

Geocoding API는 SDK와 동일한 Client ID를 사용하되, 헤더 키가 다릅니다:

```env
# .env.local
NEXT_PUBLIC_NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret
```

### 호출 방법

#### Geocoding API Route
```typescript
// app/api/geocode/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  
  if (!address) {
    return NextResponse.json(
      { error: 'Address parameter is required' },
      { status: 400 }
    );
  }

  try {
    const url = `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(
      address
    )}`;

    const response = await fetch(url, {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': process.env.NCP_CLIENT_ID!,
        'X-NCP-APIGW-API-KEY': process.env.NCP_CLIENT_SECRET!,
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding API responded with status ${response.status}`);
    }

    const data = await response.json();
    
    if (data.addresses && data.addresses.length > 0) {
      const location = data.addresses[0];
      return NextResponse.json({
        lat: parseFloat(location.y),
        lng: parseFloat(location.x),
        roadAddress: location.roadAddress,
        jibunAddress: location.jibunAddress,
      });
    }

    return NextResponse.json(
      { error: 'Address not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Geocoding API Error:', error);
    return NextResponse.json(
      { error: 'Failed to geocode address' },
      { status: 500 }
    );
  }
}
```

#### Reverse Geocoding API Route
```typescript
// app/api/reverse-geocode/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  
  if (!lat || !lng) {
    return NextResponse.json(
      { error: 'Coordinates are required' },
      { status: 400 }
    );
  }

  try {
    const coords = `${lng},${lat}`;
    const url = `https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=${coords}&output=json&orders=roadaddr,addr`;

    const response = await fetch(url, {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': process.env.NCP_CLIENT_ID!,
        'X-NCP-APIGW-API-KEY': process.env.NCP_CLIENT_SECRET!,
      },
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return NextResponse.json({
        address: result.region.area1.name + ' ' + 
                 result.region.area2.name + ' ' + 
                 result.region.area3.name,
        fullAddress: result.land?.addition0?.value || '',
      });
    }

    return NextResponse.json(
      { error: 'Address not found for coordinates' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Reverse Geocoding Error:', error);
    return NextResponse.json(
      { error: 'Failed to reverse geocode' },
      { status: 500 }
    );
  }
}
```

---

## 🔧 통합 구현 예시

```tsx
// app/page.tsx
'use client';

import { useState } from 'react';
import NaverMap from '@/components/NaverMap';
import SearchBar from '@/components/SearchBar';
import { useSearchPlaces } from '@/hooks/useSearchPlaces';

export default function HomePage() {
  const [markers, setMarkers] = useState<any[]>([]);
  const { searchPlaces, loading } = useSearchPlaces();

  const handleSearch = async (keyword: string) => {
    const restaurants = await searchPlaces(keyword);
    
    // 검색 결과를 지도 마커로 변환
    const newMarkers = await Promise.all(
      restaurants.map(async (restaurant: any) => {
        // 네이버 좌표를 위경도로 변환 (필요시)
        const lat = parseFloat(restaurant.mapy) / 10000000;
        const lng = parseFloat(restaurant.mapx) / 10000000;
        
        return {
          position: { lat, lng },
          title: restaurant.title,
          info: {
            address: restaurant.roadAddress || restaurant.address,
            telephone: restaurant.telephone,
            category: restaurant.category,
          },
        };
      })
    );
    
    setMarkers(newMarkers);
  };

  return (
    <div className="h-screen flex flex-col">
      <SearchBar onSearch={handleSearch} loading={loading} />
      <NaverMap markers={markers} />
    </div>
  );
}
```

---

## 📝 체크리스트

- [x] 네이버 클라우드 플랫폼 회원가입 및 결제수단 등록
- [x] Application 등록 (Web Dynamic Map, Geocoding 선택)
- [x] 네이버 개발자 센터 Application 등록 (검색 API용)
- [x] 환경변수 설정 (.env.local)
- [x] TypeScript 타입 정의 설치 (@types/navermaps)
- [x] API Routes를 통한 서버사이드 API 호출 구현
- [x] CORS 이슈 방지를 위한 서버 프록시 구현

## ⚠️ 주의사항

1. **CORS 정책**: Geocoding API는 브라우저에서 직접 호출 불가, 반드시 API Routes 사용
2. **API 호출 제한**: 검색 API는 display 최대 5개 제한
3. **환경변수**: Client Secret은 절대 클라이언트에 노출하지 말 것
4. **무료 사용량 한도**: 
   - Web Dynamic Map: 월 10,000,000건
   - Geocoding/Reverse Geocoding: 월 3,000,000건
   - 검색 API: 일 25,000건