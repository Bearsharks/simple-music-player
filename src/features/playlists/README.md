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

## IndexedDB와 원본 곡 구성

localAPI는 IndexedDB transaction 완료 후 성공을 반환한다. sourcePlaylistUrl이 있는 목록은 더보기에서 최신 YouTube 목록을 미리보고 명시적으로 교체한다. 최초 snapshot도 있는 목록은 네트워크 없이 처음 가져온 곡 구성으로 복원할 수 있다. 일반 목록은 곡 추가 Dialog와 드래그/키보드로 편집한다. 현재 대기열은 독립적이다.

회귀: `npm test -- src/__test__/localAPI.test.ts src/__test__/playlist-edit.test.tsx src/__test__/playlistImport.test.tsx`

## 디자인 개편 진입점

Playlists.tsx는 로컬 이름 필터·정렬·카드/빈 상태를 제공한다. 카드 재생과 목록 열기는 독립 버튼이다. PlaylistPage의 곡 추가 Dialog·목록 더보기의 원본 작업·저장 순서 편집을 유지한다.

[승인 디자인 명세](../../../docs/design/electric-night/DESIGN-SPEC.md)

## 생성·삭제·복구 계약

- `localAPI`는 저장한 items로 `itemCount`와 최대 4개 `thumbnails`를 계산한다. 일반 생성의 빈 배열/설명도 정상화하고 `createdAt`을 저장한다. 업데이트는 원래 생성 시각을 유지한다. 과거 목록에 생성 시각을 만들어 넣지 않으며 최근 정렬은 시각 없는 목록을 이름/ID로 안정 정렬한다. IndexedDB DB명·버전·키 경로는 바뀌지 않는다.
- `usePlaylistManager`는 같은 Jotai store의 쓰기를 직렬화한다. API 예외 또는 update=false는 저장 실패로 전달하며 성공 전 atom을 덮어쓰지 않는다. create/update/append 폼은 저장 완료를 기다리고 중복 제출을 막으며 오류/입력을 보존한다.
- 전체 목록 삭제는 overlays의 이름·곡 수 확인을 거친다. 성공 후 IDs에서 제거하되 기존 info/items atom을 RESET하여 삭제된 행을 재조회하지 않는다. `PlaylistPage`는 IDs로 상세 진입을 검증하고 현재 목록 삭제 시 라이브러리로 이동한다. 없는 URL은 복귀 버튼을 표시한다.
- `DELETE_ITEMS`는 성공 시 `{deletedCount, undo}`를 반환한다. overlays의 알림은 이 콜백으로 곡만 복원한다. Undo는 이후 APPEND/순서 변경과 메타데이터를 보존하며 반복 실행은 중복 추가하지 않는다. 전체 목록 삭제 또는 곡 전체 교체(최초 복원/최신 가져오기 포함) 뒤의 이전 Undo는 거부한다. 실패한 Undo는 다시 시도할 수 있다. 알림은 닫거나 다음 알림으로 대체할 때까지 유지되며 새로고침 후 복구 기록은 유지하지 않는다.
- UPDATE의 기존 곡 재정렬은 key를 유지한다. 새로운 곡/원본 가져오기는 새 key를 받는다. 저장 목록 편집과 Undo는 현재 재생 queue를 변경하지 않는다.

빠른 회귀: `npm test -- src/__test__/localAPI.test.ts src/__test__/playlistState.test.tsx src/__test__/overlay-regressions.test.tsx src/__test__/design-library.test.tsx`.

## Electric Night 저장 화면

- 채워진 라이브러리는 검색/최근순·이름순과 카드만 표시한다. 환영 파형은 전체 목록이 0개일 때만 표시하며 조회 실패는 빈 상태와 구분한다.
- `goToPlaylistPage(id, focusAdd?)`는 카드 열기와 빈 카드의 곡 추가 진입을 구분한다. 비어 있는 카드는 재생 대신 추가 버튼을 제공한다.
- CREATE manager는 성공 시 `{createdId}`를 반환한다. overlays/youtube는 선택적 `onCreated`를 호출하고 navigation이 라우팅한다. 저장 모델은 router에 의존하지 않는다.
- 상세의 명시적 ‘곡 추가’ 또는 `focusAdd` 진입만 `ui/AddVideo`를 native Dialog에서 연다. 빈 상세 단순 열기/마지막 곡 삭제는 자동으로 열지 않는다. `focusAdd`는 진입 후 소비해 새로고침으로 작업이 다시 열리지 않게 한다. 성공 후 닫고 trigger focus, 실패 시 입력/중복 확인을 유지한다. 같은 video ID는 ‘중복해서 추가’ 확인 뒤 별개 key로 저장한다.
- `useReloadPlaylists`/`playlistReadRevision`은 실패한 읽기의 재시도만 담당한다. 저장 어댑터, IndexedDB schema와 큐 독립성은 동일하다.
- 회귀: `design-library`, `playlist-edit`, `restored-app`, `electric-night` 테스트. ID 커버는 `shared/ui/Cover`이며 이름/정렬/경로마다 별도 시드를 만들지 않는다.

순서 이동은 저장 중 중복 조작을 막는다. 비활성화로 브라우저가 포커스를 잃으면 완료/실패 후 같은 이동 버튼에 복귀하고, 끝 위치에서 그 버튼이 비활성화되면 반대 방향 버튼으로 이동한다. 대기 중 사용자가 다른 요소로 포커스를 옮겼다면 이를 가로채지 않는다. `playlist-edit`의 실패·연속 키보드 이동 회귀와 실제 Chromium 시나리오를 함께 확인한다.

## 즉시 정렬·제목 복구·백업

저장한 곡은 항상 활성화된 드래그 핸들로 정렬한다. 키보드는 핸들에서 Space → 방향키 → Space, 취소는 Escape. MOVE_ITEM은 항목 key/beforeKey를 현재 목록에 적용해 늦은 저장이 다른 곡 삭제/추가를 덮어쓰지 않는다. 실패 시 atom은 이전 순서를 유지하고 토스트를 표시한다. 현재 대기열은 별도 상태를 유지한다.

RestoreTitles는 생성된 임시 제목만 찾아 YouTube oEmbed를 조회한다. PATCH_METADATA는 key와 이전 제목이 모두 일치하는 항목에만 합치므로 삭제·재정렬·사용자 제목 수정과 충돌하지 않는다. 수동 제목은 보존한다.

LibraryBackup은 백업 JSON 내보내기와 확인 후 추가 가져오기를 제공한다. 기존 목록을 덮어쓰지 않고 전체 가져오기를 단일 IndexedDB transaction으로 저장한다. 10MB/500목록/현재 10000곡 및 최초 snapshot 별도 10000곡 상한과 스키마·영상ID 검증을 거치고 썸네일 URL은 재구성한다. origin 사이 자동 이전은 하지 않는다.

Library sort uses the adopted shadcn Radix Select with the existing in-memory
recent/name sorting; search text is not reset and no data write occurs. General
CTA and form fields use shared shadcn Button/Input/Textarea/Label, while cards,
DnD handles and feature layouts keep their existing ownership. Native file input,
media controls and dialog lifetimes are not converted to another framework.

## 목적지 편집과 전역 백업

`FormBoxPlaylist`는 위에서 저장 목적지를 선택하고 아래에서 실제 이름·설명을 편집한다.
목적지별 draft를 보존하고 취소는 쓰지 않는다. 신규는 CREATE에 metadata+선택곡을
한 번 전달하고, 기존은 APPEND에 변경한 metadata만 합쳐 실행 시점의 최신 곡 뒤에
추가한다. 기존 긴 metadata를 잘라내지 않는다. 저장 실패는 draft/선택곡을 보존한다.
성공은 현재 화면·대기열을 유지한다. 회귀: `playlist-picker.test.tsx`.

LibraryBackup은 라이브러리 헤더의 ‘라이브러리 더보기’ 메뉴다. file input은 메뉴 밖
안정된 owner에 남고 항목의 동기 사용자 activation에서 chooser를 연다. 메뉴를 닫아도
파일 응답을 받으며 검증/확인/원자적 추가 가져오기는 기존 계약 그대로다.
회귀: `library-navigation.test.tsx`; 실제 chooser/다운로드/포커스는 Chromium suite.

## 최초 snapshot의 좁은 저장 계약

- `Playlist.initialSnapshot?: { version: 1; capturedAt; items }`는 record 최상위의
  불변 최초 곡/순서 사본이다. `PlaylistInfo`에는 배열이 없고 저장 정본에서 계산한
  `hasInitialSnapshot`만 있다. 라이브러리/사이드바는 그대로 metadata만 소비한다.
- API의 `createPlaylist(info, items, initialSnapshot?)`가 같은 record/transaction에
  저장한다. 신규 YouTube import와 유효 snapshot이 있는 백업만 기록을 만든다.
  `getInitialSnapshot(id)`는 명시적 복원 작업에서만 호출한다. update는 이전 snapshot을
  유지하며 현재 곡/최신 조회를 legacy의 최초 기록으로 소급하지 않는다. DB version은 1이다.
- `ui/RestoreInitialPlaylist`는 네트워크 없이 snapshot을 읽어 한 번 확인하고 UPDATE로
  곡만 교체한다. 실행 시점 이름/설명과 큐를 보존하고 전체 교체 revision으로 오래된 Undo를
  거부한다. snapshot이 없는 목록에서는 복원 메뉴를 숨긴다.
- `shared/model/playlistSnapshot`은 버전/시각/정규화된 영상 ID/문자열/곡 수를 검증하고
  live items/runtime key와 독립된 사본을 만든다. backup v1의 optional 필드로 왕복하며
  malformed/과다 데이터는 쓰기 전에 거부한다. 여러 목록 추가 중 실패는 모두 rollback한다.
- 직접 소비자는 localAPI/testAPI, manager CREATE, youtube importer, backup, overlays의
  목록 메뉴/작업 연결이다. 다른 탭 동시 편집 자동 동기화는 여전히 제공하지 않는다.
- 회귀: `playlist-snapshot.test.tsx`, `overlay-expansion.test.tsx`, `playlist-edit.test.tsx`.
  실제 Chromium suite는 새 import→로컬 추가→최초 복원→최신 교체→다시 복원 및 metadata/큐
  보존을 검사한다. preview IDs는 시뮬레이션이며 실제 YouTube 전체 수집을 보장하지 않는다.

라이브러리 헤더와 빈 상태의 ‘새 재생목록’, 상세의 ‘전체 재생’은 공용
`BrandPrimaryButton`을 사용한다. 생성·저장 submit은 일반 Button이다. 별도 YouTube
가져오기 CTA/연결 prop은 제거하고 생성 modal 안의 통합 진입을 유지한다.
검증: `brand-primary-button`, `restored-app` 및 브라우저의 빈/채워진 라이브러리 흐름.
