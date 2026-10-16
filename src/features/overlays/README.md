# overlays: 메뉴·모달·알림과 연결 동작

로그인 제거 후 기존 편집 화면에 다시 연결되어 있다. 저장 목록은 shared/api/localAPI.ts, URL 가져오기는 youtube/ui/PlaylistImport.tsx를 사용한다.

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
- 검증 공백: 실제 스크린리더·모바일 브라우저 확인은 별도다. 폼 재사용을 위한 playlists↔overlays 참조가 남아 있다.
- UI 변경은 관련 Storybook 또는 fixture 화면으로 확인하고 실제 확인하지 못한 항목은 보고한다.

## 완료 보고

변경한 계약, 영향을 받는 소비자, 실행한 테스트와 결과, 미검증 항목을 적는다. 새 공개 함수나 의존 관계를 만들면 이 README도 갱신한다.

[전체 구조](../../../docs/ARCHITECTURE.md) · [작업 시작 지도](../../../docs/CHANGE-GUIDE.md)

## 접근성·실패 처리

- 생성/수정/URL 가져오기/전체 삭제/저장 대상 선택은 `shared/ui/Dialog.tsx`를 사용한다. 원본 초기화도 같은 컴포넌트다. Dialog는 이름, 내부 초기 포커스, Tab 경계, Escape·배경 클릭 취소, 이전 버튼 포커스 복귀, 배경 inert/스크롤 잠금을 소유한다. 비동기 내부 UI가 나중에 나타날 때도 내부 포커스를 유지한다.
- `aria-busy="true"`인 폼 쓰기가 진행되는 동안 Escape/배경 클릭으로 닫지 않는다. 이미 시작한 IndexedDB 쓰기를 취소한 것처럼 보이지 않게 하고 결과나 오류를 보여준다. 폼 버튼도 중복 쓰기를 차단한다.
- 메뉴 항목은 기본 button이며 열 때 첫 조작으로 이동하고 Escape 시 원래 더보기로 돌아간다. Tab으로 메뉴 밖을 이동하면 닫힌다. 팝업 위치 기준은 실제 조작 button(currentTarget)이다. 비동기 메뉴 작업의 실패는 열린 메뉴 안에서 재시도할 수 있다.
- 전체 목록 삭제는 이름/곡 수/현재 큐·YouTube 원본은 유지된다는 확인 1회다. 개별 저장 곡 삭제에는 확인을 중첩하지 않고 `Notice`의 실행 취소를 제공한다. 복원 작업/정합성은 playlists manager가 소유한다. 알림에서 복원 실패를 표시하고 재시도를 허용한다.
- 새 목록에서 유튜브 가져오기를 선택하면 같은 modal의 URL 가져오기 화면으로 바로 전환한다. 중간 클릭 전용 메뉴를 열지 않는다.

빠른 회귀: `npm test -- src/__test__/overlay-regressions.test.tsx src/__test__/playlistImport.test.tsx`.
모바일 queue sheet도 같은 Dialog를 사용하며 자세한 반응형 소유권은 player README를 따른다.

외부 클릭 감지는 다음 `pointerdown`을 capture 단계에서 관찰한다. 팝업을 여는 click 버블링을 새 리스너가 다시 받아 즉시 닫는 경쟁을 피한다. `popup-events.test.tsx`는 React의 동기 mount 이후 같은 click이 document로 올라가는 순서와 내부/외부 pointer 동작을 회귀 검증한다.

## Native dialog와 중첩 작업

- shared Dialog는 native show/showModal을 사용하고 jsdom에서는 open 속성 fallback을 사용한다. `open`/`modal` 변경은 children을 재부착하지 않는다. 공통 modal stack이 기존 inert/overflow를 기록하며 마지막 modal 해제 때 복원한다.
- persistent player panel은 낮은 priority, 폼/확인은 기본 priority다. 상위 작업 중 breakpoint가 바뀌어도 작업 modal을 top layer에 유지한다.
- 열린 sheet의 메뉴는 트리거의 dialog 내부에 portal하여 inert/top-layer 아래로 떨어지지 않는다. 메뉴 Escape는 메뉴만 닫고, 바깥 dialog Escape와 충돌하지 않는다.
- Notice는 shared OverlayPortal을 통해 현재 modal scope에 표시하므로 sheet에서 삭제한 곡의 Undo도 조작 가능하다. Undo는 시간 제한 없이 닫기/다른 알림까지 유지하므로 hover/focus 중 사라지지 않는다.
- 원본 초기화/큐 비우기도 이름 있는 확인 dialog를 사용한다. 전체 저장 목록 삭제에는 Undo를 추가하지 않는다.
