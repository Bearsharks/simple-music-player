# auth: 로그인·콜백

## 최소 읽기 경로

- `pages/LoginPage.tsx` — 로그인과 로그인 유지 입력
- `pages/OauthCallback.tsx` — 토큰 수신·이동
- `../../app/App.tsx` — 인증 확인·오류·재시도

## 연결과 영향 범위

shared/api/api.ts, apiSelector.ts, http.ts의 서버 계약. 로그인 변경 시 navigation/ui/SideMenu.tsx의 로그아웃 경로도 확인한다.

`npm run impact -- auth`으로 현재 코드의 직접 소비자와 외부 의존 파일을 확인한다. 내부 구현만 바꾸면 위 진입 파일부터 읽고, export/상태/타입/콜백 계약을 바꿀 때에만 소비자로 읽기 범위를 넓힌다.

## 보존할 계약

실제 로그인/토큰을 테스트에서 사용하지 않는다. 콜백 토큰 로그 금지. OAuth URL 토큰 제거는 서버와 함께 설계해야 한다.

## 검증

- 빠른 회귀: `npm test -- src/__test__/app.test.tsx`
- 제출 전: `npm run check`
- 검증 공백: 실제 로그인, 만료, 로그아웃, 콜백 재방문은 자동 테스트로 아직 보장하지 않는다.
- UI 변경은 관련 Storybook 또는 fixture 화면으로 확인하고 실제 확인하지 못한 항목은 보고한다.

## 완료 보고

변경한 계약, 영향을 받는 소비자, 실행한 테스트와 결과, 미검증 항목을 적는다. 새 공개 함수나 의존 관계를 만들면 이 README도 갱신한다.

[전체 구조](../../../docs/ARCHITECTURE.md) · [작업 시작 지도](../../../docs/CHANGE-GUIDE.md)
