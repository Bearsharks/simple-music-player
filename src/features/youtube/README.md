# youtube: YouTube 메타데이터 조회

## 최소 읽기 경로

- `api/youtubeSearch.ts` — URL 파싱·조회·페이지 처리
- `model/YTPlaylistState.ts` — 내 YouTube 목록 상태

## 연결과 영향 범위

overlays가 검색·가져오기에 사용하고 player가 곡 정보를 조회한다. shared/api/api.ts의 getToken에 의존하는 현재 인증 경로를 유지한다.

`npm run impact -- youtube`으로 현재 코드의 직접 소비자와 외부 의존 파일을 확인한다. 내부 구현만 바꾸면 위 진입 파일부터 읽고, export/상태/타입/콜백 계약을 바꿀 때에만 소비자로 읽기 범위를 넓힌다.

## 보존할 계약

401 재발급 재시도 최대 1회, 403 반복 금지. 페이지 토큰 순환/과다 페이지 차단. 허용 호스트와 video ID 검증. API 키 방식으로 변경하는 것은 별도 저장/인증 설계 결정이다.

## 검증

- 빠른 회귀: `npm test -- src/__test__/youtube.test.ts`
- 제출 전: `npm run check`
- 검증 공백: 실제 계정의 비공개 목록·권한·할당량은 mock 응답으로 증명되지 않는다.
- UI 변경은 관련 Storybook 또는 fixture 화면으로 확인하고 실제 확인하지 못한 항목은 보고한다.

## 완료 보고

변경한 계약, 영향을 받는 소비자, 실행한 테스트와 결과, 미검증 항목을 적는다. 새 공개 함수나 의존 관계를 만들면 이 README도 갱신한다.

[전체 구조](../../../docs/ARCHITECTURE.md) · [작업 시작 지도](../../../docs/CHANGE-GUIDE.md)
