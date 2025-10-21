# 환경 변수 설정 가이드

## 목차
1. [개요](#개요)
2. [네이버 개발자센터 API 키 발급](#네이버-개발자센터-api-키-발급)
3. [네이버 클라우드 플랫폼 API 키 발급](#네이버-클라우드-플랫폼-api-키-발급)
4. [환경 변수 설정](#환경 변수-설정)
5. [보안 주의사항](#보안-주의사항)
6. [문제 해결](#문제-해결)

---

## 개요

이 프로젝트는 두 가지 네이버 API 플랫폼을 사용합니다:

| 플랫폼 | 사용 용도 | 환경 변수 접두사 |
|--------|----------|---------------|
| **네이버 개발자센터** | 검색 API (음식점 검색) | `NAVER_SEARCH_*` |
| **네이버 클라우드 플랫폼** | 지도 SDK, Geocoding API | `NCP_*` 또는 `NEXT_PUBLIC_NCP_*` |

**중요**: 두 플랫폼은 완전히 다른 인증 체계를 사용하므로 반드시 별도의 API 키를 발급받아야 합니다.

---

## 네이버 개발자센터 API 키 발급

### 1. 네이버 개발자센터 접속
https://developers.naver.com 접속 후 네이버 계정으로 로그인

### 2. 애플리케이션 등록
1. **Application** > **애플리케이션 등록** 클릭
2. 애플리케이션 정보 입력:
   - **애플리케이션 이름**: 예) "맛집 리뷰 앱"
   - **사용API**: **검색** 선택
   - **비로그인 오픈 API 서비스 환경**: **WEB 설정** 추가
   - **Web 서비스 URL**: `http://localhost:3000` (개발 환경)

3. **등록하기** 클릭

### 3. API 키 확인
- **Application** > **내 애플리케이션** 에서 방금 등록한 앱 클릭
- **Client ID**: `NAVER_SEARCH_CLIENT_ID`에 사용
- **Client Secret**: `NAVER_SEARCH_CLIENT_SECRET`에 사용

### 4. 사용량 확인
- 네이버 검색 API는 일일 25,000건의 무료 호출 제한이 있습니다
- 초과 시 유료 전환 필요

---

## 네이버 클라우드 플랫폼 API 키 발급

### 1. 네이버 클라우드 플랫폼 콘솔 접속
https://console.ncloud.com 접속 후 회원가입/로그인

### 2. 결제 수단 등록
- **마이페이지** > **결제 관리** > **결제 수단 관리**
- 신용카드 등록 (무료 티어 사용 시에도 필수)

### 3. Maps 서비스 이용 신청
1. **Services** > **AI·NAVER API** > **Maps** 선택
2. **이용 신청하기** 클릭
3. **Application** 생성:
   - **Application 이름**: 예) "맛집 리뷰 앱 Maps"
   - **Service**: **Web Dynamic Map**, **Geocoding** 선택
   - **Web 서비스 URL**: `http://localhost:3000` (개발 환경)
4. **추가** 클릭

### 4. 인증 키 생성
1. **마이페이지** > **계정 관리** > **인증키 관리**
2. **신규 API 인증키 생성** 클릭
3. 생성된 키 확인:
   - **Access Key ID**: `NCP_CLIENT_ID` 및 `NEXT_PUBLIC_NCP_CLIENT_ID`에 사용
   - **Secret Key**: `NCP_CLIENT_SECRET`에 사용 (최초 1회만 표시되므로 반드시 복사)

### 5. 사용량 및 과금 확인
- Maps API는 월 10만 건 무료 (Web Dynamic Map)
- Geocoding API는 월 10만 건 무료
- 초과 시 유료 과금 발생

---

## 환경 변수 설정

### .env.local 파일 생성

프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하고 다음 내용을 입력하세요:

```env
# ═══════════════════════════════════════════════
# 네이버 개발자센터 (https://developers.naver.com)
# ═══════════════════════════════════════════════
# 검색 API용 (음식점 검색)
NAVER_SEARCH_CLIENT_ID=your_naver_search_client_id_here
NAVER_SEARCH_CLIENT_SECRET=your_naver_search_client_secret_here

# ═══════════════════════════════════════════════
# 네이버 클라우드 플랫폼 (https://console.ncloud.com)
# ═══════════════════════════════════════════════
# 지도 JavaScript SDK용 (클라이언트 측에서 접근 가능)
NEXT_PUBLIC_NCP_CLIENT_ID=your_ncp_access_key_id_here

# Geocoding API용 (서버 측 전용)
NCP_CLIENT_ID=your_ncp_access_key_id_here
NCP_CLIENT_SECRET=your_ncp_secret_key_here
```

### 환경 변수 설명

| 환경 변수 | 용도 | 노출 여부 | 사용 위치 |
|----------|------|---------|----------|
| `NAVER_SEARCH_CLIENT_ID` | 네이버 검색 API 인증 | 서버 전용 | Backend API |
| `NAVER_SEARCH_CLIENT_SECRET` | 네이버 검색 API 인증 | 서버 전용 | Backend API |
| `NEXT_PUBLIC_NCP_CLIENT_ID` | 네이버 지도 SDK 로드 | 클라이언트 노출 | 브라우저 |
| `NCP_CLIENT_ID` | Geocoding API 인증 | 서버 전용 | Backend API |
| `NCP_CLIENT_SECRET` | Geocoding API 인증 | 서버 전용 | Backend API |

### Next.js 환경 변수 규칙

- **`NEXT_PUBLIC_*`**: 클라이언트에서 접근 가능 (브라우저에 노출됨)
- **접두사 없음**: 서버 측에서만 접근 가능 (보안 강화)

---

## 보안 주의사항

### ⚠️ 절대 하지 말아야 할 것

1. **`.env.local` 파일을 Git에 커밋하지 마세요**
   ```bash
   # .gitignore에 추가되어 있는지 확인
   .env*.local
   ```

2. **`NEXT_PUBLIC_*` 환경 변수에 Secret 키를 저장하지 마세요**
   - `NEXT_PUBLIC_*`는 클라이언트에 노출되므로 민감한 정보를 담으면 안 됩니다

3. **브라우저 콘솔에 API 키를 출력하지 마세요**
   ```typescript
   // ❌ 나쁜 예
   console.log(process.env.NCP_CLIENT_SECRET);
   ```

### ✅ 권장 사항

1. **프로덕션 환경에서는 환경 변수를 호스팅 플랫폼에서 관리**
   - Vercel: Project Settings > Environment Variables
   - Netlify: Site Settings > Build & Deploy > Environment

2. **API 키를 주기적으로 재발급**
   - 네이버 클라우드 플랫폼에서 인증 키 재생성 가능

3. **HTTP Referer 제한 설정**
   - 네이버 개발자센터: Web 서비스 URL을 프로덕션 도메인으로 제한
   - 네이버 클라우드: Application 설정에서 허용 도메인 추가

4. **사용량 모니터링**
   - 네이버 개발자센터: 통계 메뉴에서 일일 호출량 확인
   - 네이버 클라우드: 콘솔에서 API 사용량 및 과금 확인

---

## 문제 해결

### 1. `401 Unauthorized` 에러

**원인:**
- API 키가 잘못되었거나 만료됨
- 환경 변수 이름이 잘못됨

**해결 방법:**
```bash
# 환경 변수 확인
echo $NAVER_SEARCH_CLIENT_ID
echo $NCP_CLIENT_ID

# Next.js 개발 서버 재시작 (환경 변수 변경 시 필수)
npm run dev
```

### 2. `429 Too Many Requests` 에러

**원인:**
- API 호출 제한 초과

**해결 방법:**
- 네이버 개발자센터/클라우드 콘솔에서 사용량 확인
- 캐싱 전략 적용 (React Query의 `staleTime` 활용)
- 유료 플랜으로 전환 검토

### 3. 환경 변수가 `undefined`로 나오는 경우

**원인:**
- `.env.local` 파일이 없거나 잘못된 위치에 있음
- 개발 서버를 재시작하지 않음

**해결 방법:**
```bash
# 1. .env.local 파일이 프로젝트 루트에 있는지 확인
ls -la .env.local

# 2. 개발 서버 재시작
npm run dev
```

### 4. 네이버 지도 SDK가 로드되지 않는 경우

**원인:**
- `NEXT_PUBLIC_NCP_CLIENT_ID` 환경 변수가 설정되지 않음
- 잘못된 파라미터명 사용 (`ncpClientId` 대신 `ncpKeyId` 사용해야 함)

**해결 방법:**
```typescript
// ✅ 올바른 예
<Script
  src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NCP_CLIENT_ID}&submodules=geocoder`}
/>

// ❌ 잘못된 예 (구버전)
<Script
  src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.NEXT_PUBLIC_NAVER_CLIENT_ID}`}
/>
```

### 5. CORS 에러 발생

**원인:**
- 네이버 개발자센터/클라우드 플랫폼에 등록된 도메인과 실제 호출 도메인이 다름

**해결 방법:**
1. 네이버 개발자센터: Application 설정에서 Web 서비스 URL 추가
2. 네이버 클라우드: Application 설정에서 허용 도메인 추가
3. 로컬 개발 시: `http://localhost:3000` 또는 `http://127.0.0.1:3000` 모두 등록

---

## 참고 자료

- [네이버 개발자센터 - 검색 API 가이드](https://developers.naver.com/docs/search/blog/)
- [네이버 클라우드 플랫폼 - Maps API 가이드](https://api.ncloud-docs.com/docs/ai-naver-mapsstatic)
- [네이버 클라우드 플랫폼 - Geocoding API 가이드](https://api.ncloud-docs.com/docs/ai-naver-mapsgeocoding)
- [Next.js 환경 변수 공식 문서](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
