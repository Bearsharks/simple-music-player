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
- 새 재생목록은 `PlaylistImport`의 단일 폼이다. 선택 URL → 필수 이름 → 설명을 같은 화면에서 편집한다. 별도 가져오기 modal 종류/전환 버튼은 없다. URL 없는 로컬 생성과 URL 있는 최초 import는 같은 제출·저장 실패 경로를 공유한다.

빠른 회귀: `npm test -- src/__test__/overlay-regressions.test.tsx src/__test__/playlistImport.test.tsx`.
모바일 queue sheet도 같은 Dialog를 사용하며 자세한 반응형 소유권은 player README를 따른다.

외부 클릭 감지는 다음 `pointerdown`을 capture 단계에서 관찰한다. 팝업을 여는 click 버블링을 새 리스너가 다시 받아 즉시 닫는 경쟁을 피한다. `popup-events.test.tsx`는 React의 동기 mount 이후 같은 click이 document로 올라가는 순서와 내부/외부 pointer 동작을 회귀 검증한다.

## Native dialog와 중첩 작업

- shared Dialog는 native show/showModal을 사용하고 jsdom에서는 open 속성 fallback을 사용한다. `open`/`modal` 변경은 children을 재부착하지 않는다. 공통 modal stack이 기존 inert/overflow를 기록하며 마지막 modal 해제 때 복원한다.
- persistent player panel은 낮은 priority, 폼/확인은 기본 priority다. 상위 작업 중 breakpoint가 바뀌어도 작업 modal을 top layer에 유지한다.
- 열린 sheet의 메뉴는 트리거의 dialog 내부에 portal하여 inert/top-layer 아래로 떨어지지 않는다. 메뉴 Escape는 메뉴만 닫고, 바깥 dialog Escape와 충돌하지 않는다.
- Notice는 shared OverlayPortal을 통해 현재 modal scope에 표시하므로 sheet에서 삭제한 곡의 Undo도 조작 가능하다. Undo는 시간 제한 없이 닫기/다른 알림까지 유지하므로 hover/focus 중 사라지지 않는다.
- 최초 snapshot 복원/큐 비우기도 이름 있는 확인 dialog를 사용한다. 최신 가져오기는 미리보기와 명시 CTA 한 번으로 교체한다. 전체 저장 목록 삭제에는 Undo를 추가하지 않는다.

## 인수 검수 보완

- Modal의 생성 완료 콜백은 `empty`/`import`/`selection` 출처를 함께 전달한다. 가져오기 모듈 자체는 라우터나 큐 UI에 의존하지 않는다.
- native dialog의 Escape는 `cancel` 한 곳에서 처리한다. document keydown으로 먼저 닫으면 동일 Escape가 아래 dialog의 close watcher까지 닫을 수 있으므로 수동 Escape는 jsdom/미지원 환경 fallback에만 사용한다. cancel은 전파를 막고 최상위 modal만 닫으며 busy 쓰기는 계속 보호한다.
- 곡 메뉴는 열린 순간의 dialog/list/행 위치를 보존한다. 삭제로 트리거가 사라지면 같은 위치의 다음 곡(마지막이면 이전 곡)에 포커스를 주고, 빈 목록은 추가 버튼/큐 닫기로 복귀한다. `MusicItem`의 `data-track-key`/`data-track-focus`, 목록의 `data-track-list`는 이 기존 연결의 DOM 계약이다.
- 큐 조작은 ‘대기열 끝에 추가’/‘대기열에서 삭제’로 표시한다. 전체 재생목록 메뉴의 끝 추가도 기존 `APPEND_PLAYLIST` manager를 사용하며 현재 곡을 바꾸지 않는다.

## 알림과 작업 폼의 공간·상태 보존

- OverlayPortal은 동일 DOM 컨테이너를 현재 최상위 modal scope로 이동한다. portal 대상 자체를 교체하지 않으므로 Notice의 소비/닫힘/복원 중/오류 상태가 작업 전환이나 breakpoint 변경으로 초기화되지 않는다. 이미 실행하거나 닫은 Undo는 다시 나타나지 않는다.
- 페이지에서는 dock 위 알림 위치를 유지하고, 작업 dialog/queue sheet에서는 별도 정상 흐름 영역으로 공간을 확보한다. Submit/취소/transport 위에 fixed 알림을 겹치지 않는다. Undo는 dialog의 Tab 순서와 스크롤 영역 안에 계속 있다.
- `notice-overlay.test.tsx`는 중첩·반응형 위치 이동, 소비/닫힘, 진행 중/실패 후 재시도 상태를 확인한다. Chromium은 실제 살아 있는 Undo를 둔 picker submit의 hit-test/Tab 순서와 다음 폼에서 Undo 실행을 검증한다.

## 반응형 native 작업 보호·메뉴 경계

- 높은 우선순위의 작업 dialog가 열린 동안 낮은 우선순위 panel의 native modal/nonmodal 모드 변경은 유예한다. CSS 폭은 반응하지만 자식 dialog를 close/showModal로 재생성하지 않는다. 마지막 상위 작업이 닫히면 요청된 모드로 전환하고 inert/scroll lock을 정리한다. Escape와 resize가 겹쳐 native close watcher가 교체되는 경쟁을 피한다.
- 메뉴는 viewport와 트리거의 native dialog 경계 교집합 안에 배치한다. 아래 공간이 모자라면 위로 열고 8px 안쪽으로 제한하므로 desktop queue 아래 dock이 마지막 메뉴 항목을 가리지 않는다. 크기/오류 메시지 변경도 ResizeObserver로 재배치하며 긴 메뉴는 자체 스크롤한다.
- `popup-position` 테스트는 실제 CI의 마지막 행 좌표, 좁은 sheet, 높이가 부족한 경계를 확인한다. `electric-night`는 자식 native close/show가 발생하지 않는지와 유예 모드가 작업 종료 후 양방향으로 반영되는지 검증한다.

## 2026-10-16 사용 피드백

Dialog는 pointerdown과 pointerup 모두 backdrop에서 발생한 경우만 click으로 닫는다. 내부 텍스트 선택·드래그 후 바깥에 놓기, 취소된 포인터, 바깥에서 안으로 놓기는 닫지 않는다. native cancel/Escape·busy 보호는 유지한다. 폼 오류는 shared/ui/ErrorToast로 표시하며 입력을 지우지 않는다. 모달 안 토스트는 기존 OverlayPortal 범위 안에 남겨 입력/저장 버튼을 가리지 않는다.

## shadcn menu adoption

`Popup` now owns a controlled shadcn Radix DropdownMenu (`modal=false`). Its
`ExternalMenuTrigger` adapter forwards the original imperative API's invoking
button to Radix without rendering a duplicate button or moving DOM. The content
is portaled into that trigger's captured native dialog, or body, and Radix owns
positioning, collision handling, outside interaction, arrows/Home/End/typeahead
and Escape. The old focusout/outer-click listener no longer wraps this menu.
Options are real menuitems. Async selection prevents Radix's automatic close;
manager success still closes, pending blocks duplicate/dismissal, and failures
use ErrorToast while keeping the menu available for retry. Interacting with the
error toast does not dismiss the failed menu. Modal-opening actions first return
focus to the invoking button so the new task's own return-focus target is valid.
Deleted-row focus fallback remains in the feature. See shared/ui/shadcn/README.md
for upstream source and the scoped CSS pipeline. Native Dialog and Notice remain
existing implementations.

목록 원본 action은 `RestoreInitialPlaylist`/`RefreshYTPlaylist` ModalKind로 연결한다.
snapshot 배열 조회/복원은 playlists, 최신 URL preview는 youtube가 소유한다. snapshot 없는
legacy의 복원 옵션은 숨기며 현재 이름/설명/큐는 바꾸지 않는다.

OverlayPortal의 page-level host는 공유된 안정 grid stack이다. 동시에 발생한 Undo/ErrorToast가
같은 fixed 좌표에 겹치지 않는다. 각 stateful layer만 현재 native modal의 정상 흐름으로 옮기고
닫힐 때 원래 stack으로 복귀한다. 공통 레이어 토큰/host 규칙은 루트 `DESIGN_SYSTEM.md`다.

`Dialog.backdropTone` defaults to the existing task treatment. The player alone
selects `subtle`: native wrapper is transparent and its pseudo backdrop uses the
shared 24% scrim; fallback paints the wrapper once. Native capability is exposed
on the wrapper for CSS, without changing close ownership, priority or content lifetime.

## Cold first-open menus (2026-10-17)

OptionSelector uses fixed-size inline SVG icons from shared/ui/Icon. No icon font is fetched on first open. Playlist menu data resolves before the Radix popup mounts, avoiding a small generic Spinner that changes menu bounds. Pending reads remain cancellable with Escape or an outside pointer; cancellation never writes data and a late response cannot reopen the menu. Other modal loading placeholders remain intentional.

Regression: cold-menu.test.tsx controls a pending atom and cancellation; e2e/cold-menu.mjs tests fresh browser contexts with HTTP cache disabled and font requests deliberately failed at 390/1440px.
