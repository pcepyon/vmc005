# VMC (Village Map Community) - 식당 리뷰 플랫폼

네이버 지도 기반 음식점 검색 및 리뷰 시스템

## 📋 프로젝트 소개

VMC는 네이버 지도 API를 활용한 식당 검색 및 리뷰 플랫폼입니다. 사용자는 음식점을 검색하고, 지도에서 위치를 확인하며, 리뷰를 작성하고 조회할 수 있습니다.

### 주요 특징

- 🗺️ **네이버 지도 통합**: 실시간 지도 렌더링 및 마커 표시
- 🔍 **스마트 검색**: 네이버 검색 API 기반 음식점 검색
- ⭐ **리뷰 시스템**: 별점 및 텍스트 리뷰 작성/조회
- 📊 **통계 기능**: 평균 평점 및 리뷰 수 표시
- 🎯 **모달 네비게이션**: 직관적인 사용자 경험
- 🔐 **비밀번호 보호**: bcrypt 기반 리뷰 보안

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 15.1.0 (App Router)
- **UI Library**: React 19.0.0
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4.1.13
- **Components**: shadcn-ui + lucide-react
- **State Management**:
  - Zustand 4.x (클라이언트 상태)
  - @tanstack/react-query 5.x (서버 상태)
- **Form**: react-hook-form 7.x + zod 3.x
- **Utilities**: date-fns, es-toolkit, react-use, ts-pattern

### Backend
- **Framework**: Hono 4.9.9
- **Runtime**: Next.js Route Handler (Node.js)
- **BaaS**: Supabase 2.58.0
- **Database**: PostgreSQL (Supabase)
- **Security**: bcryptjs 3.0.2
- **Validation**: Zod 3.x

### External APIs
- 네이버 지도 SDK
- 네이버 Open API (검색)
- 네이버 클라우드 플랫폼 (Geocoding)

## 📁 프로젝트 구조

```
src/
├── app/                          # Next.js App Router
│   ├── (protected)/             # 인증 필요 라우트
│   │   └── dashboard/
│   ├── api/[[...hono]]/         # Hono API 엔드포인트
│   ├── page.tsx                 # 메인 페이지 (지도 + 검색)
│   ├── login/                   # 로그인
│   └── signup/                  # 회원가입
│
├── backend/                      # 백엔드 레이어
│   ├── hono/                    # Hono 앱 설정
│   │   ├── app.ts              # 앱 생성 및 미들웨어 등록
│   │   └── context.ts          # 환경 변수 타입 정의
│   ├── middleware/              # 공통 미들웨어
│   │   ├── error.ts            # 에러 경계
│   │   ├── context.ts          # 환경 변수 주입
│   │   └── supabase.ts         # Supabase 클라이언트 주입
│   ├── http/                    # HTTP 응답 헬퍼
│   ├── config/                  # 환경 변수 파싱
│   └── supabase/                # Supabase 클라이언트 설정
│
├── features/                     # 기능별 모듈
│   ├── auth/                    # 인증
│   ├── places/                  # 장소 검색
│   │   ├── backend/            # API 라우터, 서비스, 스키마
│   │   ├── components/         # SearchBar, NaverMap, Modals
│   │   ├── hooks/              # React Query 훅
│   │   └── lib/                # DTO 타입 재노출
│   └── reviews/                 # 리뷰
│       ├── backend/            # API 라우터, 서비스, 스키마
│       ├── components/         # ReviewList, ReviewWriteModal
│       ├── hooks/              # React Query 훅
│       └── lib/                # DTO 타입 재노출
│
├── components/ui/               # shadcn-ui 컴포넌트
├── stores/                      # Zustand 스토어
├── lib/                         # 유틸리티
│   └── remote/                 # axios API 클라이언트
└── middleware.ts                # Next.js 미들웨어 (인증)

supabase/
└── migrations/                  # SQL 마이그레이션
```

## 🚀 시작하기

### 1. 필수 요구사항

- Node.js 20+
- npm 10+
- Supabase 계정
- 네이버 API 키 (검색 + 지도)

### 2. 설치

```bash
git clone <repository-url>
cd VMC005
npm install
```

### 3. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 입력하세요:

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# 네이버 검색 API
NAVER_SEARCH_CLIENT_ID=your_search_client_id
NAVER_SEARCH_CLIENT_SECRET=your_search_client_secret

# 네이버 클라우드 플랫폼
NEXT_PUBLIC_NCP_CLIENT_ID=your_ncp_client_id
NCP_CLIENT_ID=your_ncp_client_id
NCP_CLIENT_SECRET=your_ncp_client_secret
```

### 4. 데이터베이스 마이그레이션

Supabase 대시보드의 SQL Editor에서 `supabase/migrations/` 디렉토리의 SQL 파일들을 순서대로 실행하세요:

1. `0001_create_places_table.sql`
2. `0002_create_reviews_table.sql`
3. `0003_create_trigger_functions.sql`

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 6. 빌드 및 배포

```bash
npm run build
npm run start
```

## 🔌 API 엔드포인트

### Places API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| `GET` | `/api/places/search` | 네이버 API로 음식점 검색 |
| `GET` | `/api/places/:naver_place_id` | 특정 장소 조회 (DB) |
| `POST` | `/api/places/:naver_place_id` | 특정 장소 생성/조회 |
| `GET` | `/api/places/with-reviews` | 리뷰가 있는 장소 목록 |

**검색 예시:**
```bash
GET /api/places/search?query=강남맛집&display=5
```

**응답:**
```json
{
  "ok": true,
  "data": {
    "places": [
      {
        "id": "12345",
        "name": "강남 맛집",
        "address": "서울 강남구...",
        "latitude": 37.498,
        "longitude": 127.027,
        "phone": "02-1234-5678",
        "category": "한식>찌개, 전골"
      }
    ],
    "total": 50
  }
}
```

### Reviews API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| `GET` | `/api/places/:place_id/reviews` | 특정 장소의 리뷰 조회 |
| `POST` | `/api/reviews` | 새 리뷰 작성 |

**리뷰 작성 예시:**
```bash
POST /api/reviews
Content-Type: application/json

{
  "place_id": "uuid",
  "author_name": "홍길동",
  "rating": 5,
  "content": "정말 맛있어요!",
  "password": "1234"
}
```

## 🗄 데이터베이스 스키마

### places 테이블
```sql
id              UUID PRIMARY KEY
naver_place_id  VARCHAR(255) UNIQUE NOT NULL
name            VARCHAR(255) NOT NULL
address         TEXT NOT NULL
phone           VARCHAR(50)
latitude        DECIMAL(10, 8) NOT NULL
longitude       DECIMAL(11, 8) NOT NULL
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

### reviews 테이블
```sql
id             UUID PRIMARY KEY
place_id       UUID REFERENCES places(id) ON DELETE CASCADE
author_name    VARCHAR(100) NOT NULL
rating         INTEGER CHECK (1 <= rating <= 5)
content        TEXT CHECK (length(content) <= 500)
password_hash  VARCHAR(255) NOT NULL
created_at     TIMESTAMPTZ DEFAULT now()
updated_at     TIMESTAMPTZ DEFAULT now()
```

## 🎨 주요 컴포넌트

### 프론트엔드

- **SearchBar**: 검색어 입력 및 검증
- **NaverMap**: 네이버 지도 렌더링 및 마커 표시
- **SearchResultsModal**: 검색 결과 목록
- **PlaceDetailModal**: 장소 상세 정보 + 리뷰 목록
- **ReviewWriteModal**: 리뷰 작성 폼
- **ReviewStats**: 평균 평점 및 리뷰 수

### 데이터 페칭 훅

- `usePlacesWithReviews()`: 리뷰가 있는 장소 목록
- `useSearchPlaces(query)`: 검색 쿼리
- `usePlaceByNaverId(id)`: 특정 장소 조회
- `useReviews(placeId)`: 장소별 리뷰 조회
- `useCreateReview()`: 리뷰 작성 뮤테이션

## 📝 개발 가이드

### 새 기능 추가하기

1. `src/features/[feature-name]/` 디렉토리 생성
2. 다음 파일 구조 작성:
   ```
   backend/
   ├── route.ts    # Hono 라우터
   ├── service.ts  # 비즈니스 로직
   ├── schema.ts   # Zod 스키마
   └── error.ts    # 에러 코드
   components/     # React 컴포넌트
   hooks/          # React Query 훅
   lib/dto.ts      # 타입 재노출
   ```
3. `src/backend/hono/app.ts`에 라우터 등록

### 코드 스타일

- TypeScript를 사용하세요
- 모든 프론트엔드 컴포넌트는 `"use client"` 디렉티브 사용
- Zod로 요청/응답 검증
- React Query로 서버 상태 관리
- Zustand로 클라이언트 상태 관리
- 함수형 프로그래밍 패러다임 우선

### Shadcn-ui 컴포넌트 추가

```bash
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add button
```

## 📚 주요 라이브러리

| 라이브러리 | 용도 |
|-----------|------|
| `date-fns` | 날짜/시간 처리 |
| `ts-pattern` | 패턴 매칭 |
| `@tanstack/react-query` | 서버 상태 관리 |
| `zustand` | 글로벌 상태 관리 |
| `react-use` | React 훅 모음 |
| `es-toolkit` | 유틸리티 함수 |
| `lucide-react` | 아이콘 |
| `zod` | 스키마 검증 |
| `react-hook-form` | 폼 관리 |

## ⚠️ 주의사항

### 보안

- `.env.local` 파일은 절대 Git에 커밋하지 마세요
- 프로덕션 환경에서는 RLS(Row Level Security) 설정 권장
- API 키는 환경 변수로만 관리하세요

### 성능

- React Query의 `staleTime` 설정 조정 가능
  - 검색 결과: 1분
  - 리뷰: 30초
  - 장소 정보: 5분
- 지도 마커는 리뷰가 있는 장소만 표시

## 🔧 유용한 명령어

```bash
# 개발 서버 (Turbopack)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start

# Lint 검사
npm run lint
```

## 📄 라이선스

이 프로젝트는 MIT 라이선스로 배포됩니다.

---

**개발 환경**: Node.js 20+, npm 10+
**문의**: 프로젝트 관리자에게 문의하세요
