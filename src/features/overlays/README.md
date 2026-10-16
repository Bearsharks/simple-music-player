# overlays: 메뉴·모달·알림과 연결 동작

현재 제품은 library 기능을 사용한다. 이 폴더는 이전 편집 기능의 재사용을 위해 보존되며 App에 연결되어 있지 않다.

## 최소 읽기 경로

- `PopupStates.ts` — 열기/닫기와 선택 정보
- `Popup.tsx` — 선택 메뉴·검색 결과·대기열/저장 동작
- `Modal.tsx` — 생성/편집/YouTube 가져오기 폼
- `Notice.tsx` — 알림

## 연결과 영향 범위

playlists/queue/youtube를 연결하는 기존 조정 코드다. search/player/playlists/queue/navigation이 호출한다. 독립적인 순수 공통 UI로 간주하지 않는다.

`npm run impact -- overlays`으로 현재 코드의 직접 소비자와 외부 의존 파일을 확인한다. 내부 구현만 바꾸면 위 진입 파일부터 읽고, export/상태/타입/콜백 계약을 바꿀 때에만 소비자로 읽기 범위를 넓힌다.

## 보존할 계약

상태 변경은 소유 기능의 manager를 통해 한다. 비동기 검색의 이전 응답이 새 결과를 덮지 않도록 한다. 팝업 상태 계약 변경은 소비자 전체에 영향을 준다.

## 검증

- 빠른 회귀: `npm test -- src/__test__/playlistState.test.tsx src/__test__/youtube.test.ts src/__test__/app.test.tsx`
- 제출 전: `npm run check`
- 검증 공백: 모달별 키보드 포커스·취소·저장 실패·중복 제출 전용 테스트는 부족하다. 폼 재사용을 위한 playlists↔overlays 참조가 남아 있다.
- UI 변경은 관련 Storybook 또는 fixture 화면으로 확인하고 실제 확인하지 못한 항목은 보고한다.

## 완료 보고

변경한 계약, 영향을 받는 소비자, 실행한 테스트와 결과, 미검증 항목을 적는다. 새 공개 함수나 의존 관계를 만들면 이 README도 갱신한다.

[전체 구조](../../../docs/ARCHITECTURE.md) · [작업 시작 지도](../../../docs/CHANGE-GUIDE.md)
