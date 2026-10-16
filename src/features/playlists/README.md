# playlists: 저장 재생목록

로그인 제거 후 기존 편집 화면에 다시 연결되어 있다. 저장 목록은 shared/api/localAPI.ts, URL 가져오기는 youtube/ui/PlaylistImport.tsx를 사용한다.

## 최소 읽기 경로

- `model/playlistAtoms.ts` — 조회·로컬 CRUD·동일 세션 변경 직렬화
- `pages/PlaylistPage.tsx` — 상세 화면
- `ui/ConnectedPlaylists.tsx` — 목록의 상태·동작 연결

## 연결과 영향 범위

shared/api/apiSelector.ts가 저장 어댑터. queue/model/queue.ts가 목록 곡을 읽고, overlays가 생성/편집/삭제 폼을 실행한다. atom 계약 변경 시 이 소비자를 확인한다.

`npm run impact -- playlists`으로 현재 코드의 직접 소비자와 외부 의존 파일을 확인한다. 내부 구현만 바꾸면 위 진입 파일부터 읽고, export/상태/타입/콜백 계약을 바꿀 때에만 소비자로 읽기 범위를 넓힌다.

## 보존할 계약

저장 재생목록과 현재 대기열은 별개다. 삭제 입력 배열 불변, itemCount/썸네일 일치, 모듈 import 시 네트워크 요청 금지. 저장 어댑터는 localAPI 또는 fixture다.

## 검증

- 빠른 회귀: `npm test -- src/__test__/playlistState.test.tsx`
- 제출 전: `npm run check`
- 검증 공백: 다른 탭의 동시 IndexedDB 수정은 자동 동기화하지 않는다. 실제 브라우저 저장 권한/용량 한계는 별도 확인한다.
- UI 변경은 관련 Storybook 또는 fixture 화면으로 확인하고 실제 확인하지 못한 항목은 보고한다.

## 완료 보고

변경한 계약, 영향을 받는 소비자, 실행한 테스트와 결과, 미검증 항목을 적는다. 새 공개 함수나 의존 관계를 만들면 이 README도 갱신한다.

[전체 구조](../../../docs/ARCHITECTURE.md) · [작업 시작 지도](../../../docs/CHANGE-GUIDE.md)

## IndexedDB와 원본 초기화

localAPI는 IndexedDB transaction 완료 후 성공을 반환한다. sourcePlaylistUrl이 있는 가져오기 목록만 원본 초기화를 표시한다. 초기화는 명시적 미리보기와 교체 확인 후 수행한다. 일반 목록은 영상 URL로 추가하고 위/아래 버튼으로 순서를 저장할 수 있다. 재생 대기열의 편집은 저장 목록과 독립적이다.

회귀: `npm test -- src/__test__/localAPI.test.ts src/__test__/playlist-edit.test.tsx src/__test__/playlistImport.test.tsx`

## 디자인 개편 진입점

Playlists.tsx는 로컬 이름 필터·정렬·카드/빈 상태를 제공한다. 카드 재생과 목록 열기는 독립 버튼이다. PlaylistPage에서 곡 추가·원본 초기화·저장 순서 편집을 유지한다.

[디자인 기록](../../../docs/DESIGN-REFRESH.md)

## 생성·삭제·복구 계약

- `localAPI`는 저장한 items로 `itemCount`와 최대 4개 `thumbnails`를 계산한다. 일반 생성의 빈 배열/설명도 정상화하고 `createdAt`을 저장한다. 업데이트는 원래 생성 시각을 유지한다. 과거 목록에 생성 시각을 만들어 넣지 않으며 최근 정렬은 시각 없는 목록을 이름/ID로 안정 정렬한다. IndexedDB DB명·버전·키 경로는 바뀌지 않는다.
- `usePlaylistManager`는 같은 Jotai store의 쓰기를 직렬화한다. API 예외 또는 update=false는 저장 실패로 전달하며 성공 전 atom을 덮어쓰지 않는다. create/update/append 폼은 저장 완료를 기다리고 중복 제출을 막으며 오류/입력을 보존한다.
- 전체 목록 삭제는 overlays의 이름·곡 수 확인을 거친다. 성공 후 IDs에서 제거하되 기존 info/items atom을 RESET하여 삭제된 행을 재조회하지 않는다. `PlaylistPage`는 IDs로 상세 진입을 검증하고 현재 목록 삭제 시 라이브러리로 이동한다. 없는 URL은 복귀 버튼을 표시한다.
- `DELETE_ITEMS`는 성공 시 `{deletedCount, undo}`를 반환한다. overlays의 알림은 이 콜백으로 곡만 복원한다. Undo는 이후 APPEND/순서 변경과 메타데이터를 보존하며 반복 실행은 중복 추가하지 않는다. 전체 목록 삭제 또는 곡 전체 교체(원본 초기화 포함) 뒤의 이전 Undo는 거부한다. 실패한 Undo는 다시 시도할 수 있다. 알림은 닫거나 다음 알림으로 대체할 때까지 유지되며 새로고침 후 복구 기록은 유지하지 않는다.
- UPDATE의 기존 곡 재정렬은 key를 유지한다. 새로운 곡/원본 가져오기는 새 key를 받는다. 저장 목록 편집과 Undo는 현재 재생 queue를 변경하지 않는다.

빠른 회귀: `npm test -- src/__test__/localAPI.test.ts src/__test__/playlistState.test.tsx src/__test__/overlay-regressions.test.tsx src/__test__/design-library.test.tsx`.
