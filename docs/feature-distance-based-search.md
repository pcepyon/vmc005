# 거리 기반 검색 결과 정렬 기능 기획서

## 📋 개요

현재 지도 중심점(사용자가 보고 있는 위치)을 기준으로 가까운 장소부터 검색 결과에 표시하는 기능

---

## 🎯 목표

- 사용자가 현재 보고 있는 지도 영역과 관련성 높은 검색 결과 제공
- 검색 결과를 거리순으로 정렬하여 UX 개선

---

## 🔍 현재 상태 분석

### 1. 현재 구현
- **검색**: 네이버 검색 API를 통해 키워드 기반 검색
- **정렬**: 네이버 API의 기본 정렬 (랜덤 또는 관련도순)
- **지도 중심점**: `useAppStore`의 `mapCenter` (lat, lng) 상태로 관리
- **검색 흐름**:
  1. SearchBar에서 검색어 입력
  2. `openModal('search-results', { searchQuery })` 호출
  3. SearchResultsModal에서 `useSearchPlaces(searchQuery)` 훅 사용
  4. `/api/places/search?query={searchQuery}` API 호출

### 2. 문제점
- 현재 지도 위치와 무관하게 검색 결과 표시
- 사용자가 강남을 보고 있는데 홍대 검색 결과가 상단에 나올 수 있음

---

## 💡 기능 요구사항

### FR-1: 현재 지도 중심점 전달
- 검색 시 현재 지도 중심 좌표(lat, lng)를 함께 전달
- 검색 결과 정렬의 기준점으로 사용

### FR-2: 거리 계산
- 지도 중심점과 각 검색 결과 간의 직선 거리 계산
- Haversine 공식 또는 간단한 유클리드 거리 사용

### FR-3: 거리순 정렬
- 계산된 거리를 기준으로 가까운 순으로 정렬
- 거리 정보를 검색 결과에 포함 (선택적)

### FR-4: 거리 표시 (선택사항)
- 검색 결과 목록에 "현재 위치에서 약 1.2km" 같은 정보 표시
- 사용자가 얼마나 먼 곳인지 직관적으로 파악 가능

---

## 🏗️ 구현 설계

### 1. 아키텍처 개요

```
┌─────────────┐
│ SearchBar   │
│ (검색창)    │
└──────┬──────┘
       │ 검색어 + mapCenter
       ▼
┌─────────────────────┐
│ SearchResultsModal  │
│ (검색 결과 모달)    │
└──────┬──────────────┘
       │ GET /api/places/search?query=...&lat=...&lng=...
       ▼
┌─────────────────────┐
│ Backend API         │
│ (route.ts)          │
└──────┬──────────────┘
       │ searchPlaces(query)
       ▼
┌─────────────────────┐
│ Service Layer       │
│ (service.ts)        │
├─────────────────────┤
│ 1. 네이버 API 호출  │
│ 2. 거리 계산        │
│ 3. 거리순 정렬      │
└──────┬──────────────┘
       │ 정렬된 결과 반환
       ▼
┌─────────────────────┐
│ SearchResultsModal  │
│ (가까운 순 표시)    │
└─────────────────────┘
```

---

## 📝 구현 단계별 계획

### Phase 1: 프론트엔드 - 지도 중심점 전달

#### 1-1. SearchBar 수정
**파일**: `src/features/places/components/SearchBar.tsx`

**변경사항**:
```typescript
// 변경 전
const onSubmit = (data: SearchFormData) => {
  openModal('search-results', { searchQuery: data.query });
};

// 변경 후
const mapCenter = useAppStore((state) => state.mapCenter);

const onSubmit = (data: SearchFormData) => {
  openModal('search-results', {
    searchQuery: data.query,
    mapCenter: mapCenter, // 현재 지도 중심점 추가
  });
};
```

#### 1-2. AppStore 타입 수정
**파일**: `src/stores/useAppStore.ts`

**변경사항**:
```typescript
interface ModalHistoryItem {
  type: Exclude<ModalState, 'closed'>;
  data?: {
    placeId?: string;
    naverPlaceId?: string;
    searchQuery?: string;
    mapCenter?: { lat: number; lng: number }; // 추가
  };
}
```

#### 1-3. useSearchPlaces 훅 수정
**파일**: `src/features/places/hooks/usePlaces.ts`

**변경사항**:
```typescript
// 변경 전
export const useSearchPlaces = (query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['places', 'search', query],
    queryFn: async () => {
      const response = await apiClient.get<ApiSuccessResponse<SearchPlacesResponse>>(
        '/api/places/search',
        { params: { query, display: 5 } }
      );
      return response.data.data;
    },
    enabled: !!query && enabled,
    staleTime: 1 * 60 * 1000,
  });
};

// 변경 후
export const useSearchPlaces = (
  query: string,
  mapCenter?: { lat: number; lng: number },
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['places', 'search', query, mapCenter?.lat, mapCenter?.lng],
    queryFn: async () => {
      const response = await apiClient.get<ApiSuccessResponse<SearchPlacesResponse>>(
        '/api/places/search',
        {
          params: {
            query,
            display: 5,
            ...(mapCenter && { lat: mapCenter.lat, lng: mapCenter.lng })
          }
        }
      );
      return response.data.data;
    },
    enabled: !!query && enabled,
    staleTime: 1 * 60 * 1000,
  });
};
```

#### 1-4. SearchResultsModal 수정
**파일**: `src/features/places/components/SearchResultsModal.tsx`

**변경사항**:
```typescript
const currentModal = modalHistory[modalHistory.length - 1];
const searchQuery = currentModal?.data?.searchQuery || '';
const mapCenter = currentModal?.data?.mapCenter; // 추가

const { data, isLoading, isError, error } = useSearchPlaces(
  searchQuery,
  mapCenter, // 추가
  modalState === 'search-results'
);
```

---

### Phase 2: 백엔드 - 거리 계산 및 정렬

#### 2-1. Schema 수정
**파일**: `src/features/places/backend/schema.ts`

**변경사항**:
```typescript
// 검색 쿼리 파라미터에 lat, lng 추가
export const SearchPlacesQuerySchema = z.object({
  query: z.string().min(1),
  display: z.coerce.number().int().min(1).max(5).default(5),
  lat: z.coerce.number().optional(), // 추가
  lng: z.coerce.number().optional(), // 추가
});

// NaverPlace에 distance 필드 추가 (선택사항)
export const NaverPlaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  roadAddress: z.string().optional(),
  phone: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  category: z.string().optional(),
  distance: z.number().optional(), // km 단위 거리 (추가)
});
```

#### 2-2. 거리 계산 유틸리티 함수
**파일**: `src/features/places/backend/service.ts`

**추가 함수**:
```typescript
/**
 * Haversine 공식을 사용한 두 좌표 간 거리 계산 (km)
 * @param lat1 시작점 위도
 * @param lng1 시작점 경도
 * @param lat2 종료점 위도
 * @param lng2 종료점 경도
 * @returns 거리 (km)
 */
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // 지구 반지름 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // 소수점 2자리
};
```

#### 2-3. searchPlaces 함수 수정
**파일**: `src/features/places/backend/service.ts`

**변경사항**:
```typescript
export const searchPlaces = async (
  config: AppConfig,
  query: string,
  display: number = 5,
  centerLat?: number,  // 추가
  centerLng?: number,  // 추가
): Promise<HandlerResult<SearchPlacesResponse, PlaceServiceError, unknown>> => {
  try {
    const url = new URL('https://openapi.naver.com/v1/search/local.json');
    url.searchParams.set('query', query);
    url.searchParams.set('display', display.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'X-Naver-Client-Id': config.naver.searchClientId,
        'X-Naver-Client-Secret': config.naver.searchClientSecret,
      },
    });

    if (!response.ok) {
      return failure(
        500,
        placeErrorCodes.naverApiError,
        `네이버 API 호출 실패: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as NaverSearchApiResponse;

    const places: NaverPlace[] = data.items.map((item) => {
      const { latitude, longitude } = convertNaverCoordinates(item.mapx, item.mapy);

      // 거리 계산 (중심점이 제공된 경우)
      let distance: number | undefined;
      if (centerLat !== undefined && centerLng !== undefined) {
        distance = calculateDistance(centerLat, centerLng, latitude, longitude);
      }

      return {
        id: `${item.mapx}_${item.mapy}`,
        name: htmlDecode(item.title),
        address: item.address,
        roadAddress: item.roadAddress || undefined,
        phone: item.telephone || undefined,
        latitude,
        longitude,
        category: item.category || undefined,
        distance, // 거리 추가
      };
    });

    // 거리 기준 정렬 (중심점이 제공된 경우)
    if (centerLat !== undefined && centerLng !== undefined) {
      places.sort((a, b) => {
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
    }

    const searchResponse: SearchPlacesResponse = {
      places,
      total: data.total,
    };

    return success(searchResponse);
  } catch (error) {
    return failure(
      500,
      placeErrorCodes.searchError,
      `장소 검색 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    );
  }
};
```

#### 2-4. Route Handler 수정
**파일**: `src/features/places/backend/route.ts`

**변경사항**:
```typescript
app.get('/api/places/search', async (c) => {
  const parsedQuery = SearchPlacesQuerySchema.safeParse({
    query: c.req.query('query'),
    display: c.req.query('display'),
    lat: c.req.query('lat'),    // 추가
    lng: c.req.query('lng'),    // 추가
  });

  if (!parsedQuery.success) {
    return respond(
      c,
      failure(
        400,
        'INVALID_SEARCH_PARAMS',
        '검색 파라미터가 유효하지 않습니다.',
        parsedQuery.error.format(),
      ),
    );
  }

  const config = getConfig(c);
  const logger = getLogger(c);

  const result = await searchPlaces(
    config,
    parsedQuery.data.query,
    parsedQuery.data.display,
    parsedQuery.data.lat,   // 추가
    parsedQuery.data.lng,   // 추가
  );

  if (!result.ok) {
    const errorResult = result as ErrorResult<PlaceServiceError, unknown>;

    if (errorResult.error.code === placeErrorCodes.naverApiError) {
      logger.error('네이버 API 호출 실패', errorResult.error.message);
    }

    return respond(c, result);
  }

  return respond(c, result);
});
```

---

### Phase 3: UI 개선 (선택사항)

#### 3-1. 거리 표시
**파일**: `src/features/places/components/SearchResultsModal.tsx`

**변경사항**:
```typescript
{data && data.places.length > 0 && (
  <div className="divide-y">
    {data.places.map((place) => {
      // ... 기존 코드 ...

      return (
        <div key={place.id} className="p-4 hover:bg-gray-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{place.name}</h3>

              {/* 거리 표시 추가 */}
              {place.distance !== undefined && (
                <p className="text-sm text-blue-600 font-medium mt-1">
                  📍 현재 위치에서 약 {place.distance}km
                </p>
              )}

              {place.category && (
                <p className="text-sm text-gray-600 mt-1">{place.category}</p>
              )}
              {/* ... 나머지 코드 ... */}
            </div>
          </div>
        </div>
      );
    })}
  </div>
)}
```

---

## 📊 데이터 흐름

### 1. 검색 요청
```
사용자 입력 "강남 맛집"
→ SearchBar
→ mapCenter: { lat: 37.498095, lng: 127.02761 }
→ openModal('search-results', { searchQuery: "강남 맛집", mapCenter })
```

### 2. API 호출
```
GET /api/places/search?query=강남 맛집&display=5&lat=37.498095&lng=127.02761
```

### 3. 백엔드 처리
```
1. 네이버 API 호출 → 10개 결과 받음
2. 각 결과에 대해 거리 계산
   - 장소A: 0.5km
   - 장소B: 2.3km
   - 장소C: 1.1km
   ...
3. 거리순 정렬
   - 장소A (0.5km)
   - 장소C (1.1km)
   - 장소B (2.3km)
   ...
4. 상위 5개 반환
```

### 4. UI 렌더링
```
검색 결과 모달:
1. 장소A - 0.5km
2. 장소C - 1.1km
3. 장소B - 2.3km
4. 장소D - 3.2km
5. 장소E - 4.1km
```

---

## 🧪 테스트 계획

### 1. 단위 테스트
- `calculateDistance()` 함수 정확도 테스트
  - 알려진 두 지점 간 거리 계산 검증
  - 같은 위치일 때 0km 반환 확인

### 2. 통합 테스트
- 검색 API 엔드포인트 테스트
  - 중심점 없이 호출 → 기본 정렬
  - 중심점과 함께 호출 → 거리순 정렬 확인

### 3. E2E 테스트
- 지도 이동 후 검색 → 가까운 순 정렬 확인
- 검색 결과에서 거리 정보 표시 확인

---

## 🚀 배포 및 롤아웃

### Phase 1 배포
- 백엔드 거리 계산 로직 배포
- 프론트엔드 중심점 전달 로직 배포
- 기능 동작 확인

### Phase 2 배포 (선택)
- 거리 표시 UI 추가
- 사용자 피드백 수집

---

## 📈 성능 고려사항

### 1. 계산 복잡도
- O(n) - n개 검색 결과에 대해 거리 계산
- 검색 결과가 최대 5개로 제한되어 있어 성능 이슈 없음

### 2. 캐싱 전략
- React Query의 `staleTime` 활용
- 동일한 검색어 + 중심점 조합은 캐시 사용
- 지도 이동 시 중심점 변경 → 새로운 쿼리로 간주

### 3. 최적화 옵션
- 거리 계산을 클라이언트에서 수행하는 방안 검토
  - 네이버 API 응답을 그대로 받음
  - 프론트엔드에서 거리 계산 및 정렬
  - 장점: 서버 부하 감소
  - 단점: 클라이언트 계산 부담

---

## 🔄 대안 고려사항

### 대안 1: 네이버 API의 sort 파라미터 활용
- 네이버 검색 API에 `sort=random` 외 다른 옵션 확인
- 좌표 기반 정렬 지원 여부 확인
- **제약**: 네이버 API가 좌표 기반 정렬을 지원하지 않을 가능성

### 대안 2: 클라이언트 사이드 정렬
- 서버는 그대로 검색 결과만 반환
- 클라이언트에서 거리 계산 및 정렬 수행
- **장점**: 서버 로직 단순화
- **단점**: 클라이언트 계산 부담

### 대안 3: 지도 영역(bounds) 기반 필터링
- 현재 지도에 보이는 영역의 좌표 전달
- 해당 영역 내의 장소만 필터링
- **장점**: 더 정확한 지역 기반 검색
- **단점**: 구현 복잡도 증가

---

## ✅ 체크리스트

### 프론트엔드
- [ ] SearchBar에서 mapCenter 전달
- [ ] AppStore 타입 정의 수정
- [ ] useSearchPlaces 훅 파라미터 추가
- [ ] SearchResultsModal에서 mapCenter 전달
- [ ] 거리 표시 UI 추가 (선택사항)

### 백엔드
- [ ] SearchPlacesQuerySchema에 lat, lng 추가
- [ ] NaverPlaceSchema에 distance 필드 추가
- [ ] calculateDistance 유틸리티 함수 구현
- [ ] searchPlaces 함수에 거리 계산 로직 추가
- [ ] searchPlaces 함수에 정렬 로직 추가
- [ ] Route Handler 수정

### 테스트
- [ ] calculateDistance 단위 테스트
- [ ] 검색 API 통합 테스트
- [ ] E2E 테스트

### 문서화
- [ ] API 문서 업데이트
- [ ] 사용자 가이드 작성

---

## 📌 참고사항

### Haversine 공식
지구를 구(sphere)로 가정하여 두 점 사이의 최단 거리를 계산하는 공식입니다.

**장점**:
- 정확도가 높음 (오차 0.5% 이내)
- 전 세계 어디서나 사용 가능

**단점**:
- 삼각함수 계산으로 인한 약간의 성능 오버헤드
- 5개 이하의 결과 정렬에는 무시할 수준

### 유클리드 거리 (대안)
```typescript
const euclideanDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  return Math.sqrt(dLat * dLat + dLng * dLng) * 111; // 대략 km 변환
};
```

**장점**: 계산 빠름
**단점**: 정확도 낮음 (특히 위도가 높은 지역)

**결론**: Haversine 공식 사용 권장

---

## 🎯 예상 효과

### 1. 사용자 경험 개선
- 현재 보고 있는 지역과 관련성 높은 검색 결과 제공
- 불필요하게 먼 장소를 먼저 보는 불편함 제거

### 2. 검색 만족도 향상
- 지도 기반 서비스의 핵심 가치 제공
- 사용자의 의도에 부합하는 결과 우선 표시

### 3. 서비스 차별화
- 일반 검색과 차별화된 지도 기반 검색 경험
- 위치 기반 서비스로서의 정체성 강화
