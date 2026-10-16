# navigation: 메뉴·앱 화면 조립

## 최소 읽기 경로

- `pages/Main.tsx` — 헤더·검색·플레이어·오버레이 조립
- `ui/ConnectedSideMenu.tsx, ui/SideMenu.tsx` — 메뉴 상태 연결과 이동
- `model/sideMenu.ts` — 메뉴 열림 상태

## 연결과 영향 범위

app/App.tsx가 진입점을 연결한다. Main이 player/search/overlays/queue를 조립하므로 레이아웃 변경 시 해당 화면의 모바일 동작도 확인한다.

`npm run impact -- navigation`으로 현재 코드의 직접 소비자와 외부 의존 파일을 확인한다. 내부 구현만 바꾸면 위 진입 파일부터 읽고, export/상태/타입/콜백 계약을 바꿀 때에만 소비자로 읽기 범위를 넓힌다.

## 보존할 계약

다른 기능의 상태나 서버 변경 로직을 이 기능에 추가하지 않는다. 메뉴 변경은 재생 대기열을 초기화하지 않아야 한다.

## 검증

- 빠른 회귀: `npm test -- src/__test__/app.test.tsx`
- 제출 전: `npm run check`
- 검증 공백: 터치·키보드 포커스·실기기 화면 폭은 별도 확인이 필요하다.
- UI 변경은 관련 Storybook 또는 fixture 화면으로 확인하고 실제 확인하지 못한 항목은 보고한다.

## 완료 보고

변경한 계약, 영향을 받는 소비자, 실행한 테스트와 결과, 미검증 항목을 적는다. 새 공개 함수나 의존 관계를 만들면 이 README도 갱신한다.

[전체 구조](../../../docs/ARCHITECTURE.md) · [작업 시작 지도](../../../docs/CHANGE-GUIDE.md)
