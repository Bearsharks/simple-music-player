# youtube: YouTube 메타데이터 조회

## 재생목록 iframe 확인

`/preview/playlist-frame`은 `prototype/PlaylistFramePreview.tsx`에서 공개 재생목록 `PLVKdYxm17gBYbyZYbHWZDr7NU3ZwtFiB5`를 공식 iframe으로 표시한다. 자동 재생·목록 추출·로컬 저장은 수행하지 않는다. 재생은 사용자가 플레이어에서 시작하며 실제 재생 가능 여부는 YouTube 및 브라우저 제한에 따른다. 회귀 검증: `npm test -- src/__test__/playlist-frame-preview.test.tsx`.

## 확장 프로그램 가져오기

- 실제 진입: 앱 상단 YouTube 검색 및 미연결일 때 표시하는 확장 다운로드 버튼. 목록 편집은 확장 프로그램 전달로 열린다. `/preview/youtube-import`도 동일한 실제 앱을 표시한다. App이 `import/ExtensionImport.tsx`를 Main의 tools 슬롯에 조립한다.
- YouTube 검색 URL의 `loopy=1`은 확장 담기 UI를 다시 켜는 표시다. 확장은 이 표시를 소비하고 검색어를 보존하며 URL에서 표시만 지운다. 자동 담기·가져오기·저장은 수행하지 않는다.
- `import/ExtensionInstall.tsx`는 확장 전용 ZIP 다운로드, loopy-extension 폴더 로드 절차, 브라우저별 관리 주소 복사, 연결 재확인을 제공한다. 연결되면 설치 안내와 버튼을 숨긴다. 초기 확인 중에는 버튼을 표시하지 않는다. 개발 모드는 로컬 생성 ZIP, 제품 빌드는 GitHub Release asset을 사용하며 게시가 필요하다. 버전 확인·업데이트 안내는 확장이 담당한다. 패키징은 루트 `extension/README.md`를 따른다.
- 공통 계약: `extension/protocol.js` 및 선언 파일. 고정 확장 ID와 허용된 최상위 앱 출처의 Chrome 외부 메시지만 사용한다. DOM 이벤트를 신뢰하지 않는다. 설치는 루트 `extension/README.md`를 따른다.
- 앱은 1.5초 간격으로 최신 요청 하나를 가져오고 검증·수용 후 requestId로 확인한다. 연결 실패 시 5초 간격 재시도. 반복 전달은 현재 연결 세션에서 중복 억제하며 수신 확인은 저장 완료를 뜻하지 않는다.
- 확장은 저장 순간 현재 탭을 조회해 한 탭만 대상으로 지정한다. 해당 탭의 ACK 이후 보낸 항목만 확장 목록에서 비운다. 미수신 항목은 브라우저 재시작 후에도 유지하고, 전송 중 새로 담은 항목은 별도 key로 보존한다. ACK 후 편집 취소·탭 종료는 저장하지 않은 편집본을 버리는 사용자 동작이다.
- 수동 연결 재확인에서도 수신 ID 기록을 유지한다. 매 요청마다 현재 Chrome runtime을 읽어 설치 후 연결을 재검사한다. 브라우저가 runtime을 아직 제공하지 않으면 페이지 새로고침이 필요할 수 있다.
- `{kind,id}` 항목 최대 100개, 펼친 곡 최대 2,000개, 목록별 20초·전체 120초 제한. 입력 순서·목록 내부 순서·중복 항목을 보존한다. `getPlaylist()` 결과는 원본 전체를 보장하지 않으며 화면에 이 제한을 표시한다. 200곡으로 하드코딩하지 않는다.
- Loopy의 `import/resolve.ts`가 iframe 및 키 없는 oEmbed로 조회한다. 제목 실패 시 ID 기반 이름을 유지하며 썸네일은 검증된 ID로 생성한다.
- 모달이 열려 있으면 최신 대기 요청 하나만 유지한다. 교체 승인 후 조회하고 성공해야 기존 편집을 교체한다. 실패·닫기·취소는 늦은 응답을 무효화한다.
- `@hello-pangea/dnd` 정렬, 제거, 제목·설명 편집, 고정 높이 설명 스크롤을 제공한다. 실제 preview iframe은 곡 선택 때 재생하며 기존 재생 중인 window.player만 일시정지한다. 자동 재개는 하지 않는다. 음량은 YouTube iframe 기본 컨트롤을 사용한다.
- 다음 재생/끝 추가는 queue manager, 저장은 local playlist manager에 연결한다. 쓰기 중 중복 제출·닫기 차단, 실패 시 편집 유지.
- 목록 상단과 각 곡의 대기열 작업 메뉴에서 다음 재생/대기열 추가를 실행한다. 성공 시 공통 Notice 토스트를 표시하고 편집본·선택·대기 요청을 유지한다. footer는 저장을 제공하며 저장 성공 또는 명시적 닫기 버튼으로 닫는다. backdrop/Escape는 편집을 종료하지 않는다.
- 가져오는 동안 로딩 상태를 표시하며 곡 편집 영역은 조회 완료 후 표시한다. 조회용 iframe host는 400×220 크기를 유지하되 visibility:hidden 및 inert/aria-hidden으로 표시·초점·접근성 탐색에서 제외한다. 교체 실패 시 기존 편집본을 다시 표시한다.
- 확장 편집과 URL 생성 폼의 입력 오류는 shared/ui/FieldError를 입력 아래에 표시한다. 이름은 blur 시 검증하며 공백뿐이면 저장 불가다. 조회·저장 실패는 작업 오류로 구분한다.
- 검증: `npm test -- src/__test__/extension-import.test.tsx src/__test__/extension-import-ui.test.tsx`; `node --test extension/background.check.mjs`; `npm run check`.
- 브라우저: `node e2e/extension-import.mjs`는 실제 확장과 IndexedDB, YouTube fixture를 사용한다. `node e2e/extension-import-live.mjs`는 실제 공개 목록을 조회하며 저장하지 않는다. `CHROMIUM_PATH`, `TEST_URL`, `IMPORT_REPORT_DIR`로 환경을 지정한다.
- 설치 UI: `node e2e/extension-install.mjs`는 미연결 상태, 확장 ZIP 실제 다운로드, 1440/390/320px 레이아웃 및 연결 응답 후 자동 숨김을 검증한다. 연결 응답은 이 테스트에서만 모의 처리하며 실제 확장 연결은 위 통합 테스트가 검증한다.
- 결합: window.player, queue/playlists manager, shared Dialog, Chrome 메시지. 원본 전체 목록·모든 영상의 재생·실기기·스크린리더 지원을 자동 테스트가 보장하지 않는다.

## Isolated component fixtures

- Entry: component tests in `src/__test__/youtube-import-prototype.test.tsx`.
- Owned files: `prototype/YouTubeImportPrototype.tsx`, `prototype/PrototypeVolume.tsx`, scoped SCSS, and `prototype/model.ts`.
  The component fixture is mounted directly by tests, independently of `Main`/player/storage.
  Existing URL import, authentication-free local storage, queue and player contracts are unchanged.
- **Design/demo only:** no extension installation/transport/trust validation, window-message listener,
  YouTube network lookup, iframe, audio, queue mutation or persistence. All three actions explicitly report
  simulated results. The silent preview is sample artwork and a manually toggled playback-state illustration.
- Sample input is only `{kind: "video" | "playlist", id: string}`. A local sample resolver expands
  `video A + playlist B + video C` to `A, B1, B2, B3, C`, preserving item order and repeated occurrences.
  Sample catalog IDs are illustrative, not production YouTube IDs. This is a fixture limitation, not a new
  product import restriction. Titles/artists/durations are invented local metadata.
- The concise task name is **목록 편집**; no promotional subtitle, source/order explanation, or visible
  arrow-reorder buttons. One footer status discloses sample/silent/demo-only behavior and action results.
- Edit title/description and remove B2. The description is fixed-height (88px desktop / 72px narrow),
  `resize: none`, with internal vertical scrolling; long text does not enlarge the modal.
- Drag the dedicated grip to reorder, using the same existing `@hello-pangea/dnd` pattern as queue and
  saved playlists (`DragDropContext` / `Droppable` / stable-key `Draggable`). No new dependency or native
  HTML-drag implementation. Focus a labeled grip, Space to lift, arrows to move, Space to drop; Escape
  cancels the active pointer or keyboard drag before the native modal can close. Drag/drop inserts rather
  than swaps tracks, preserving key-based preview selection, title/description, and pending requests.
  Browser acceptance: drag B3 above A → B3,A,B1,B2,C; edited title and selected B2 remain unchanged.
  The modal
  reuses shared native `Dialog` for naming, focus trap, Escape/backdrop close and trigger-focus restoration;
  the DnD library retains grip focus, while removal focuses a remaining track (last removal to title).
- Preview volume uses the existing shared Radix Popover and native vertical 0–100 range pattern, portaled
  inside the native dialog. State is strictly local: it never imports playback atoms or calls `window.player`.
  The mute button/zero volume preserve the last nonzero level for unmute; both level and muted state survive
  preview-track selection within the modal. Keyboard Home/End/arrows adjust the range; Escape closes only
  the popover and returns focus to its trigger. This is a silent simulation, not real iframe audio control.
- Expand **시뮬레이션**: send `D + playlist E`, then `F` to test latest-only pending replacement.
  Incoming requests preserve the current draft and do not resolve before **새 요청으로 교체**.
  **현재 편집 유지** dismisses the pending request. Confirmed replacement resolves off-draft and commits
  atomically; failure leaves title/description/tracks untouched and allows retry/keep. New requests and close
  invalidate late results. The next-failure checkbox exercises the same failure path without network access.
- Quick regression: `npm test -- src/__test__/youtube-import-prototype.test.tsx`.
  Preserved flow regression: `npm test -- src/__test__/playlistImport.test.tsx src/__test__/playlist-preview.test.tsx src/__test__/unified-playlist-form.test.tsx src/__test__/overlay-regressions.test.tsx`.
  Full gate: `npm run check`. Visual review should use desktop and 320/390px preview widths, including
  pointer/keyboard dragging and Escape, volume/mute/popover scope, fixed-height long descriptions,
  the replacement banner, mobile scroll to row controls, footer actions and focus return.
  Product browser verification uses `e2e/extension-import.mjs` in an isolated profile.
- Remaining coupling: only application route wiring and shared Dialog/primitive/style tokens. No production
  resolver, extension security protocol, large/partial/private playlist policy or real playback is demonstrated.

로그인 제거 후 기존 편집 화면에 다시 연결되어 있다. 저장 목록은 shared/api/localAPI.ts, URL 가져오기는 youtube/ui/PlaylistImport.tsx를 사용한다.

## 최소 읽기 경로

- `api/youtubeSearch.ts` — URL 파싱·조회·페이지 처리
- `ui/PlaylistImport.tsx` — URL 선택형 통합 생성 폼·로컬 저장·명시적 최신 곡 교체
- `api/playlistMetadata.ts` — 공개 playlist oEmbed 제목 조회와 응답 대상 검증

## 연결과 영향 범위

overlays가 검색·가져오기에 사용하고 player가 곡 정보를 조회한다. OAuth는 제거되었다. 선택적인 공개 메타데이터 조회만 VITE_YOUTUBE_API_KEY를 사용한다.

`npm run impact -- youtube`으로 현재 코드의 직접 소비자와 외부 의존 파일을 확인한다. 내부 구현만 바꾸면 위 진입 파일부터 읽고, export/상태/타입/콜백 계약을 바꿀 때에만 소비자로 읽기 범위를 넓힌다.

## 보존할 계약

401/403 자동 재시도 금지. OAuth 발급·갱신은 하지 않는다. 페이지 토큰 순환/과다 페이지 차단. 허용 호스트와 video ID 검증. 현재 공개 URL 가져오기는 공식 iframe이 제공한 곡 ID를 사용하며 API 키를 사용하지 않는다.

새 재생목록 URL과 확장 전달은 `extension/protocol.js`의 `validPlaylistId` 문법을 공유한다. 목록 종류로 사전 차단하지 않고 iframe이 조회 가능 여부를 결정한다. 믹스도 플레이어가 제공한 항목을 로컬 스냅샷으로 저장할 수 있으며 고정 구성·원본 전체를 보장하지 않는다. 이름은 로컬 저장의 필수 입력이다.

## 검증

- 빠른 회귀: `npm test -- src/__test__/youtube.test.ts`
- 제출 전: `npm run check`
- 검증 공백: 비공개 목록 조회는 지원하지 않는다. 실제 API 할당량은 mock 응답으로 증명되지 않는다.
- UI 변경은 관련 Storybook 또는 fixture 화면으로 확인하고 실제 확인하지 못한 항목은 보고한다.

## 완료 보고

변경한 계약, 영향을 받는 소비자, 실행한 테스트와 결과, 미검증 항목을 적는다. 새 공개 함수나 의존 관계를 만들면 이 README도 갱신한다.

[전체 구조](../../../docs/ARCHITECTURE.md) · [작업 시작 지도](../../../docs/CHANGE-GUIDE.md)

## 저장과 최신 교체

가져오기 저장은 완료까지 기다리고 입력/미리보기/취소를 잠그며 중복 제출을 막는다. 실패 시 현재 입력과 미리보기를 보존한다. 최신 가져오기는 자동 미리보기 후 ‘최신 목록으로 교체’ CTA로 한 번 확인한다. 저장 목록 manager의 전체 교체 세대가 바뀌므로 전체 교체 이전 개별 곡 삭제의 Undo는 기존 편집본을 새 원본에 다시 섞지 않는다.

회귀: `npm test -- src/__test__/playlistImport.test.tsx src/__test__/playlistState.test.tsx`.

## Electric Night 가져오기

`PlaylistImport`는 URL blur/Enter에서 자동 미리보기를 시작한다. 단계 표시와 수동 미리보기 버튼은 없다. `usePlaylistPreview`가 요청 세대, 공식 preview player와 타이머를 소유한다. URL onChange는 즉시 이전 후보를 폐기하므로 원래 URL로 되돌아와도 다시 로드한다. 편집하지 않은 URL의 반복 blur/Enter는 중복 요청하지 않고 실패는 명시적 재시도로만 다시 요청한다. 미리보기 로딩 오류와 저장 오류를 분리하여 iframe polling이 실패한 저장 메시지를 지우지 않는다. 최신 교체는 같은 작업 Dialog의 미리보기·교체 영향·명시적 CTA에서 실행하며 중첩 확인 모달은 없다. CREATE 성공은 선택적 `onCreated(id, context)`로 조립 계층에 알린다. context는 empty/import/selection이고, 폼은 라우팅/현재 큐에 의존하지 않는다. 프로토타입 모의 데이터/시계/저장은 제품에 포함하지 않는다.

## 원래 곡 제목

videoMetadata.ts는 공식 https://www.youtube.com/oembed 에서 title/author_name만 사용한다. 응답 HTML은 실행·렌더링하지 않는다. credentials omit, no-referrer, 영상 ID 검증, 중복 제거, 동시 4개, 전체 12초 중단, 오류 자동 재시도 없음. 가져오기 및 이름 없는 개별 영상 추가에서 조회하고 실패는 기존 임시 제목을 보존한다. 저장된 임시 제목은 별도 복구 버튼에서 재시도한다.

2026-10-16 실제 FloP_f-VK_k 응답에서 ‘심규선 ‘Sister’ (Live) | Official Lyric Video’ 제목과 GitHub Pages Origin에 대한 CORS 허용을 확인했다. 모든 영상/목록의 가용성이나 실제 재생을 보장하지 않는다.

URL Enter는 저장하지 않고 IME Enter를 무시한다. 유효한 영상 ID가 1개 이상인 현재
요청과 필수 이름이 있을 때만 ‘만들기’를 활성화한다. URL이 없으면 이름만으로 로컬 목록을 만든다. timeout/error 후 늦은 응답은 되살아나지 않는다.
미리보기 로딩 중에는 닫을 수 있지만 실제 저장 중에는 닫기/입력/중복 제출을 잠근다.
최신 가져오기는 저장한 source URL로 최초 자동 로드하며 URL/이름을 편집하지 않는다.
현재 이름/설명/큐와 최초 snapshot은 교체하지 않는다.
추가 회귀: `playlist-preview.test.tsx` (StrictMode, stale 결과, 재시도, cleanup).

신규 import의 CREATE는 최초로 성공 저장한 곡 배열을 `Playlist.initialSnapshot`에
같은 transaction으로 기록한다. 최신 가져오기에는 이 필드를 전달하지 않으며 legacy에
기록을 만들어내지 않는다. 최초 곡 복원은 playlists가 소유하고 이 모듈/YouTube를 호출하지
않는다. 회귀: `playlist-snapshot.test.tsx`의 신규/legacy 정책과 명시 교체 전 무변경.

## 통합 생성과 목록 메타데이터

`ModalKind.CreatePlaylist`가 이 기능의 단일 생성 폼을 연다. 선택 URL, 필수 이름,
설명 순서이며 초기 포커스는 URL이다. URL이 비어 있으면 로컬 생성, 남아 있으면 현재
URL의 유효한 preview가 있어야 저장한다. URL Enter는 미리보기만 시작하고 IME Enter는
무시한다. 이름은 trim 필수, required/aria-required와 표시용 빨간 별을 사용한다.
미리보기 로딩 중 이름/설명을 편집할 수 있고, 실제 저장 중에만 전체 입력을 잠근다.
이름과 URL 오류의 접근성 설명은 토스트를 닫아도 폼 안에서 유지한다. 긴 모바일 폼의 새 저장/preview 오류는 현재 modal 안에서 nearest scroll로 드러내며, 초점이나 기존 알림/Undo를 변경하지 않는다. 필수 이름 오류는 입력 초점을 우선한다.

이름/설명은 각각 empty/auto/user 소유권을 가진다. 사용자가 한 번 편집한 필드는 의도적으로
빈칸으로 지워도 늦은 결과가 채우지 않는다. URL 변경은 곡 후보·요청·자동 입력만 버리고
사용자 입력은 보존한다. URL 삭제 후 로컬 생성에 이전 source/snapshot/items를 남기지 않는다.
URL → Tab → 이름에서 기다릴 때도 실제 제목을 바로 채운다. focused 빈 필드에 새 자동값을 넣는
같은 layout commit에서 그 자동값만 전체 선택하여 첫 입력이 뒤에 붙지 않고 대체되게 한다.
beforeinput/조합 시작/paste는 onChange 이전부터 동기 ref로 사용자 의도를 보호한다. 이미
사용자가 편집한 값이나 선택 범위는 건드리지 않는다.
선택곡을 전달한 기존 생성 경로는 URL 없는 경우 해당 items를 보존한다.

`playlistMetadata.ts`는 공식 YouTube playlist oEmbed만 호출한다. 응답의 provider와
`/embed/videoseries?list=현재ID`를 문자열로 검증한 후 title만 사용한다. 반환 HTML은 렌더하거나
실행하지 않는다. 첫 영상의 title/author나 추정 문구를 목록 이름/설명으로 쓰지 않는다.
공식 공개 응답에 description이 없으므로 설명은 사용자 입력만 사용한다. 이름 조회가
실패해도 유효 preview와 수동 이름으로 생성할 수 있다. 8초 중단, credentials omit,
no-referrer, 오류 자동 재시도 없음이며 URL 변경/닫기 시 abort와 세대 검사로 늦은 응답을 버린다.
최신 곡 교체는 기존 메타데이터를 보존하므로 목록 제목 조회를 하지 않는다.

2026-10-17 공개 목록 PLBCF2DAC6FFB574DE의 oEmbed title ‘Google Search Stories’와
해당 videoseries/list를 확인했다. 첫 영상 title과 다르며 production Origin에 대한
Access-Control-Allow-Origin을 확인했다. 모든 목록의 가용성/실제 재생 보장은 아니다.
회귀: `playlistMetadata.test.ts`, `unified-playlist-form.test.tsx`, 기존 `playlist-preview`
및 `playlistImport`; Chromium의 단일 폼/로딩/자동 채움/입력 보존/실패 재시도/초기 snapshot은
명시적 메타데이터·iframe 시뮬레이션으로 검사한다.
