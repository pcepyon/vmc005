# 음식점 리뷰 사이트 데이터플로우 및 데이터베이스 스키마

## 1. 데이터플로우 개요

### 1.1 핵심 데이터 엔티티

```
┌─────────────┐         ┌─────────────┐
│   Places    │◄────────│   Reviews   │
│   (장소)     │ 1     N │   (리뷰)     │
└─────────────┘         └─────────────┘
```

### 1.2 시스템 데이터 흐름

```
[네이버 장소 검색 API]
         │
         ▼
   ┌──────────┐
   │  Places  │ (캐싱)
   └──────────┘
         │
         ▼
   ┌──────────┐
   │ Reviews  │
   └──────────┘
         │
         ▼
   [평균 별점/리뷰 개수 계산]
         │
         ▼
   [클라이언트 표시]
```

---

## 2. 데이터베이스 ERD

### 2.1 테이블 관계도

```
places
├── id (PK)
├── naver_place_id (Unique)
├── name
├── address
├── phone
├── latitude
├── longitude
├── created_at
└── updated_at

reviews
├── id (PK)
├── place_id (FK → places.id)
├── author_name
├── rating
├── content
├── password_hash
├── created_at
└── updated_at
```

### 2.2 엔티티 관계

- **Places (1) : Reviews (N)** - 하나의 장소는 여러 개의 리뷰를 가질 수 있음
- **외래 키**: reviews.place_id → places.id (CASCADE)

---

## 3. 데이터베이스 스키마

### 3.1 places 테이블

음식점 장소 정보를 저장하는 테이블입니다. 네이버 장소 검색 API에서 가져온 데이터를 캐싱하여 중복 API 호출을 방지합니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | 장소 고유 ID |
| `naver_place_id` | VARCHAR(255) | UNIQUE, NOT NULL | 네이버 장소 API의 고유 ID |
| `name` | VARCHAR(255) | NOT NULL | 업체명 |
| `address` | TEXT | NOT NULL | 주소 |
| `phone` | VARCHAR(50) | NULL | 전화번호 |
| `latitude` | DECIMAL(10, 8) | NOT NULL | 위도 (지도 표시용) |
| `longitude` | DECIMAL(11, 8) | NOT NULL | 경도 (지도 표시용) |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | 생성일시 |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | 수정일시 |

**인덱스:**
- `idx_naver_place_id` ON naver_place_id (빠른 조회)
- `idx_location` ON (latitude, longitude) (지도 범위 검색)

**제약조건:**
- `naver_place_id`는 UNIQUE하므로 중복 저장 방지

### 3.2 reviews 테이블

사용자가 작성한 리뷰 데이터를 저장하는 테이블입니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | 리뷰 고유 ID |
| `place_id` | UUID | FOREIGN KEY (places.id) ON DELETE CASCADE, NOT NULL | 장소 ID (외래 키) |
| `author_name` | VARCHAR(100) | NOT NULL | 작성자명 |
| `rating` | INTEGER | NOT NULL, CHECK (rating >= 1 AND rating <= 5) | 별점 (1~5) |
| `content` | TEXT | NOT NULL, CHECK (LENGTH(content) <= 500) | 리뷰 내용 (최대 500자) |
| `password_hash` | VARCHAR(255) | NOT NULL | 비밀번호 해시 (bcrypt) |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | 생성일시 |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | 수정일시 |

**인덱스:**
- `idx_place_id` ON place_id (특정 장소의 리뷰 조회 최적화)
- `idx_created_at` ON created_at DESC (최신 리뷰 정렬)

**제약조건:**
- `rating`은 1~5 사이의 정수만 허용
- `content`는 최대 500자 제한
- `place_id`는 places 테이블을 참조하며, 장소 삭제 시 관련 리뷰도 CASCADE 삭제

---

## 4. 주요 기능별 데이터 흐름

### 4.1 장소 검색 및 정보 확인

```
[클라이언트]
    │
    │ 1. 검색 키워드 입력
    ▼
[네이버 장소 검색 API]
    │
    │ 2. 검색 결과 반환 (name, address, naver_place_id, lat, lng)
    ▼
[클라이언트]
    │
    │ 3. "장소 세부 정보" 버튼 클릭
    ▼
[백엔드 API: GET /api/places/:naver_place_id]
    │
    │ 4. places 테이블에서 naver_place_id로 조회
    │    - 존재하면: place 데이터 반환
    │    - 없으면: places 테이블에 INSERT 후 반환
    ▼
[백엔드 API: GET /api/places/:place_id/reviews]
    │
    │ 5. reviews 테이블에서 place_id로 리뷰 목록 조회
    │ 6. 평균 별점 및 리뷰 개수 계산
    │    SELECT
    │      AVG(rating) as avg_rating,
    │      COUNT(*) as review_count
    │    FROM reviews
    │    WHERE place_id = :place_id
    ▼
[클라이언트]
    │
    │ 7. 장소 세부 정보 모달에 표시
    │    - 업체 정보 (name, address, phone)
    │    - 평균 별점 (★★★★★)
    │    - 총 리뷰 개수
    │    - 리뷰 목록 (author_name, rating, created_at, content)
```

### 4.2 지도 마커 표시

```
[클라이언트 - 지도 로드]
    │
    │ 1. 지도 초기화 (강남역 중심)
    ▼
[백엔드 API: GET /api/places/with-reviews]
    │
    │ 2. 리뷰가 존재하는 장소 목록 조회
    │    SELECT DISTINCT p.*
    │    FROM places p
    │    INNER JOIN reviews r ON p.id = r.place_id
    ▼
[클라이언트]
    │
    │ 3. 각 장소에 커스텀 마커 표시
    │    - latitude, longitude 사용
    │    - 마커 클릭 시 place_id 저장
    │
    │ 4. 마커 클릭 이벤트
    ▼
[백엔드 API: GET /api/places/:place_id/reviews]
    │
    │ 5. 해당 장소의 리뷰 데이터 조회
    ▼
[클라이언트]
    │
    │ 6. 장소 세부 정보 모달 표시
```

### 4.3 리뷰 작성

```
[클라이언트 - 장소 세부 정보 모달]
    │
    │ 1. "리뷰 작성하기" 버튼 클릭
    ▼
[클라이언트 - 리뷰 작성 모달]
    │
    │ 2. 입력 폼 작성
    │    - author_name: string
    │    - rating: 1~5
    │    - content: string (max 500)
    │    - password: string (4자리 숫자)
    │
    │ 3. "리뷰 작성하기" 버튼 클릭
    ▼
[클라이언트 - 유효성 검사]
    │
    │ 4. 프론트엔드 유효성 검사
    │    - author_name: 필수
    │    - rating: 1~5 범위
    │    - content: 필수, 500자 이하
    │    - password: 4자리 숫자
    │
    │ 5. 검사 실패 시 에러 메시지 표시 후 중단
    ▼
[백엔드 API: POST /api/reviews]
    │
    │ 6. 요청 데이터 수신
    │    {
    │      "place_id": "uuid",
    │      "author_name": "홍길동",
    │      "rating": 5,
    │      "content": "맛있어요",
    │      "password": "1234"
    │    }
    │
    │ 7. 백엔드 유효성 검사
    │    - place_id 존재 여부 확인
    │    - rating 범위 확인 (1~5)
    │    - content 길이 확인 (≤500)
    │    - password 형식 확인 (4자리 숫자)
    │
    │ 8. password 해싱 (bcrypt)
    │    const password_hash = bcrypt.hash(password)
    │
    │ 9. reviews 테이블에 INSERT
    │    INSERT INTO reviews (
    │      place_id, author_name, rating,
    │      content, password_hash
    │    ) VALUES (...)
    ▼
[백엔드 응답]
    │
    │ 10. 생성된 리뷰 데이터 반환
    │     { "id": "uuid", "created_at": "..." }
    ▼
[클라이언트]
    │
    │ 11. 리뷰 작성 모달 닫기
    │ 12. 장소 세부 정보 모달로 복귀
    │
    │ 13. GET /api/places/:place_id/reviews 재호출
    │     - 업데이트된 리뷰 목록 조회
    │     - 새로 계산된 평균 별점 표시
```

---

## 5. API 엔드포인트와 데이터 모델 매핑

### 5.1 Places 관련 API

#### GET /api/places/:naver_place_id

**목적**: 네이버 장소 ID로 장소 정보 조회 또는 생성

**요청:**
```
GET /api/places/naver_12345678
```

**처리 로직:**
```sql
-- 1. naver_place_id로 조회
SELECT * FROM places WHERE naver_place_id = 'naver_12345678';

-- 2. 없으면 INSERT (네이버 API 데이터 기반)
INSERT INTO places (
  naver_place_id, name, address, phone, latitude, longitude
) VALUES (
  'naver_12345678', '맛집', '서울시 강남구', '02-1234-5678', 37.123456, 127.123456
) RETURNING *;
```

**응답:**
```json
{
  "id": "uuid",
  "naver_place_id": "naver_12345678",
  "name": "맛집",
  "address": "서울시 강남구",
  "phone": "02-1234-5678",
  "latitude": 37.123456,
  "longitude": 127.123456,
  "created_at": "2025-10-21T10:00:00Z",
  "updated_at": "2025-10-21T10:00:00Z"
}
```

#### GET /api/places/with-reviews

**목적**: 리뷰가 존재하는 모든 장소 조회 (지도 마커 표시용)

**요청:**
```
GET /api/places/with-reviews
```

**처리 로직:**
```sql
SELECT DISTINCT p.*
FROM places p
INNER JOIN reviews r ON p.id = r.place_id;
```

**응답:**
```json
[
  {
    "id": "uuid-1",
    "naver_place_id": "naver_12345678",
    "name": "맛집",
    "latitude": 37.123456,
    "longitude": 127.123456
  },
  {
    "id": "uuid-2",
    "naver_place_id": "naver_87654321",
    "name": "맛집2",
    "latitude": 37.654321,
    "longitude": 127.654321
  }
]
```

### 5.2 Reviews 관련 API

#### GET /api/places/:place_id/reviews

**목적**: 특정 장소의 리뷰 목록 및 통계 조회

**요청:**
```
GET /api/places/uuid-1/reviews
```

**처리 로직:**
```sql
-- 리뷰 목록 조회
SELECT
  id, author_name, rating, content, created_at
FROM reviews
WHERE place_id = 'uuid-1'
ORDER BY created_at DESC;

-- 평균 별점 및 개수
SELECT
  AVG(rating) as avg_rating,
  COUNT(*) as review_count
FROM reviews
WHERE place_id = 'uuid-1';
```

**응답:**
```json
{
  "place_id": "uuid-1",
  "avg_rating": 4.5,
  "review_count": 10,
  "reviews": [
    {
      "id": "review-uuid-1",
      "author_name": "홍길동",
      "rating": 5,
      "content": "맛있어요!",
      "created_at": "2025-10-21T10:00:00Z"
    },
    {
      "id": "review-uuid-2",
      "author_name": "김철수",
      "rating": 4,
      "content": "좋아요",
      "created_at": "2025-10-20T15:30:00Z"
    }
  ]
}
```

#### POST /api/reviews

**목적**: 새로운 리뷰 작성

**요청:**
```json
POST /api/reviews
Content-Type: application/json

{
  "place_id": "uuid-1",
  "author_name": "홍길동",
  "rating": 5,
  "content": "맛있어요!",
  "password": "1234"
}
```

**처리 로직:**
```javascript
// 1. 유효성 검사
if (!place_id || !author_name || !rating || !content || !password) {
  return { error: "필수 항목이 누락되었습니다" };
}
if (rating < 1 || rating > 5) {
  return { error: "별점은 1~5 사이여야 합니다" };
}
if (content.length > 500) {
  return { error: "리뷰 내용은 500자를 초과할 수 없습니다" };
}
if (!/^\d{4}$/.test(password)) {
  return { error: "비밀번호는 4자리 숫자여야 합니다" };
}

// 2. place_id 존재 확인
const place = await supabase.from('places').select('id').eq('id', place_id).single();
if (!place) {
  return { error: "존재하지 않는 장소입니다" };
}

// 3. 비밀번호 해싱
const password_hash = await bcrypt.hash(password, 10);

// 4. 리뷰 저장
const { data, error } = await supabase.from('reviews').insert({
  place_id,
  author_name,
  rating,
  content,
  password_hash
}).select();
```

**응답 (성공):**
```json
{
  "id": "review-uuid",
  "place_id": "uuid-1",
  "author_name": "홍길동",
  "rating": 5,
  "content": "맛있어요!",
  "created_at": "2025-10-21T10:00:00Z",
  "updated_at": "2025-10-21T10:00:00Z"
}
```

**응답 (실패):**
```json
{
  "error": "별점은 1~5 사이여야 합니다"
}
```

---

## 6. 데이터 유효성 검증 규칙

### 6.1 Places 테이블 유효성 규칙

| 필드 | 규칙 | 에러 메시지 |
|------|------|-------------|
| `naver_place_id` | - 필수 입력<br>- 문자열<br>- UNIQUE | "네이버 장소 ID는 필수입니다"<br>"이미 등록된 장소입니다" |
| `name` | - 필수 입력<br>- 최대 255자 | "장소명은 필수입니다"<br>"장소명은 255자를 초과할 수 없습니다" |
| `address` | - 필수 입력 | "주소는 필수입니다" |
| `phone` | - 선택 입력<br>- 전화번호 형식 권장 | - |
| `latitude` | - 필수 입력<br>- -90 ~ 90 범위 | "위도는 필수입니다"<br>"위도는 -90~90 사이여야 합니다" |
| `longitude` | - 필수 입력<br>- -180 ~ 180 범위 | "경도는 필수입니다"<br>"경도는 -180~180 사이여야 합니다" |

### 6.2 Reviews 테이블 유효성 규칙

| 필드 | 규칙 | 에러 메시지 |
|------|------|-------------|
| `place_id` | - 필수 입력<br>- UUID 형식<br>- places 테이블에 존재 | "장소 ID는 필수입니다"<br>"올바른 UUID 형식이 아닙니다"<br>"존재하지 않는 장소입니다" |
| `author_name` | - 필수 입력<br>- 최대 100자 | "작성자명은 필수입니다"<br>"작성자명은 100자를 초과할 수 없습니다" |
| `rating` | - 필수 입력<br>- 정수<br>- 1~5 범위 | "별점은 필수입니다"<br>"별점은 1~5 사이의 정수여야 합니다" |
| `content` | - 필수 입력<br>- 최대 500자 | "리뷰 내용은 필수입니다"<br>"리뷰 내용은 500자를 초과할 수 없습니다" |
| `password` | - 필수 입력<br>- 정확히 4자리 숫자 | "비밀번호는 필수입니다"<br>"비밀번호는 4자리 숫자여야 합니다" |

### 6.3 프론트엔드 유효성 검사 체크리스트

**리뷰 작성 폼 (클라이언트 검증):**

```javascript
// 1. 작성자명 검증
if (!author_name || author_name.trim() === '') {
  return '작성자명을 입력해주세요';
}
if (author_name.length > 100) {
  return '작성자명은 100자를 초과할 수 없습니다';
}

// 2. 별점 검증
if (!rating) {
  return '별점을 선택해주세요';
}
if (rating < 1 || rating > 5) {
  return '별점은 1~5 사이여야 합니다';
}

// 3. 리뷰 내용 검증
if (!content || content.trim() === '') {
  return '리뷰 내용을 입력해주세요';
}
if (content.length > 500) {
  return `리뷰 내용은 500자를 초과할 수 없습니다 (현재: ${content.length}자)`;
}

// 4. 비밀번호 검증
if (!password) {
  return '비밀번호를 입력해주세요';
}
if (!/^\d{4}$/.test(password)) {
  return '비밀번호는 4자리 숫자여야 합니다';
}
```

---

## 7. 데이터 보안 및 고려사항

### 7.1 비밀번호 보안

- **해싱 알고리즘**: bcrypt (salt rounds: 10)
- **저장**: 평문 비밀번호는 절대 저장하지 않음
- **검증**: 리뷰 수정/삭제 시 bcrypt.compare() 사용

### 7.2 인덱스 최적화

```sql
-- 1. 장소 검색 최적화
CREATE INDEX idx_places_naver_place_id ON places(naver_place_id);

-- 2. 지도 범위 검색 최적화 (추후 확장용)
CREATE INDEX idx_places_location ON places(latitude, longitude);

-- 3. 리뷰 조회 최적화
CREATE INDEX idx_reviews_place_id ON reviews(place_id);

-- 4. 최신 리뷰 정렬 최적화
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
```

### 7.3 CASCADE 정책

- **places 삭제 시**: 관련된 모든 reviews도 함께 삭제 (ON DELETE CASCADE)
- **이유**: 장소가 삭제되면 해당 장소의 리뷰는 의미가 없어지므로

### 7.4 타임스탬프 자동 관리

```sql
-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_places_updated_at BEFORE UPDATE ON places
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 8. 데이터 마이그레이션 전략

### 8.1 초기 마이그레이션

1. **places 테이블 생성**
2. **reviews 테이블 생성**
3. **인덱스 생성**
4. **트리거 생성**

### 8.2 시드 데이터 (선택사항)

개발/테스트 환경에서 사용할 수 있는 샘플 데이터:

```sql
-- 샘플 장소 데이터
INSERT INTO places (naver_place_id, name, address, phone, latitude, longitude)
VALUES
  ('naver_test_1', '강남 맛집', '서울시 강남구 역삼동', '02-1234-5678', 37.498095, 127.027610),
  ('naver_test_2', '홍대 카페', '서울시 마포구 홍익로', '02-8765-4321', 37.557192, 126.925381);

-- 샘플 리뷰 데이터
INSERT INTO reviews (place_id, author_name, rating, content, password_hash)
SELECT
  id,
  '테스트 사용자',
  5,
  '정말 맛있어요!',
  '$2b$10$abcdefghijklmnopqrstuvwxyz' -- 실제로는 bcrypt로 해싱된 값
FROM places
WHERE naver_place_id = 'naver_test_1';
```

---

## 9. 확장 고려사항

### 9.1 추후 추가 가능한 기능

1. **리뷰 수정/삭제**: password_hash 검증 후 UPDATE/DELETE
2. **리뷰 좋아요**: reviews_likes 테이블 추가
3. **사용자 회원가입**: users 테이블 추가, reviews.user_id 외래 키
4. **이미지 업로드**: review_images 테이블 추가 (S3/Supabase Storage 연동)
5. **카테고리 분류**: place_categories 테이블 추가

### 9.2 성능 최적화

1. **캐싱**: Redis를 사용한 평균 별점/리뷰 개수 캐싱
2. **페이지네이션**: 리뷰 목록 조회 시 LIMIT/OFFSET 적용
3. **전문 검색**: PostgreSQL Full-Text Search 활용

---

## 10. 요약

### 최소 스펙 데이터베이스 스키마

- **테이블 2개**: places, reviews
- **관계**: 1:N (places → reviews)
- **필수 인덱스**: naver_place_id, place_id, created_at
- **보안**: 비밀번호 bcrypt 해싱
- **제약조건**: rating (1~5), content (500자 이하)

### 핵심 데이터 흐름

1. **검색**: 네이버 API → Places 캐싱 → 클라이언트
2. **조회**: Places + Reviews JOIN → 평균 별점 계산 → 클라이언트
3. **작성**: 클라이언트 → 유효성 검사 → Reviews 저장 → 갱신

이 스키마는 유저플로우에 명시된 모든 기능을 지원하며, 향후 확장 가능한 구조로 설계되었습니다.
