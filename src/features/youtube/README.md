# youtube: 검색·가져오기·메타데이터

## 진입점과 소유권

- App → navigation/Main의 tools 슬롯 → `import/ExtensionImport.tsx`: YouTube 검색, 연결 확인, 확장 목록 편집.
- `ui/PlaylistImport.tsx`: 선택 URL, 필수 이름, 설명을 사용하는 통합 생성 폼과 기존 목록의 최신 곡 교체.
- `ui/usePlaylistPreview.ts`: URL 요청 세대, iframe, 취소·timeout, 미리보기 후보.
- `api/playlistUrl.ts`: YouTube URL의 출처·자격 증명·포트·list ID 검증과 정규화. ID 문법은 `extension/protocol.js`와 공유한다.
- `api/playlistMetadata.ts`, `api/videoMetadata.ts`: 공개 oEmbed에서 확인한 제목·작성자만 사용한다. 반환 HTML은 렌더링하지 않는다.
- `import/editor.scss`, `import/import.scss`: 실제 가져오기 모달의 스타일.

## 확장 연결과 전달

앱이 열릴 때와 사용자가 **연결 확인**을 누를 때 `loopy.pull`을 한 번 실행한다. 설정을 바꾼 뒤에는 명시적 재확인 또는 새로고침으로 표시를 갱신한다. 연결 확인은 연결 상태와 관계없이 접근할 수 있다. 앱은 확장 버전을 비교하지 않는다.

확장의 저장 → 선택한 탭의 최상위 content script(`extension/app-bridge.js`) → payload 없는 `loopy.delivery.available` 알림 → 앱의 검증된 확장 ID에 직접 pull → envelope 검증·모달 수용 → ACK 순서다. DOM 메시지는 조회 신호일 뿐이며 목록·확인 응답으로 신뢰하지 않는다. 실제 항목과 ACK는 Chrome 외부 메시지로만 전달한다. sender의 앱 출처·최상위 frame·대상 tab ID는 확장 service worker가 검증한다.

앱의 초기 pull이 새 탭의 대기 요청을 받는다. 알림 수신기가 없는 탭도 연결 확인으로 대기 요청을 받을 수 있다. 대기 요청은 30초이며 실패·시간 초과 시 확장 basket을 보존한다. 같은 requestId는 중복 편집본을 만들지 않으며 수동 재확인에서도 기록을 유지한다. 정상적인 수신 후 ACK는 최종 저장이 아닌 모달 수용을 뜻한다.

운영 주소는 `https://loopy.bearsharks.dev/`다. 개발 주소·권한은 개발 ZIP에만 포함한다. 설치·업데이트·패키징은 [extension/README.md](../../../extension/README.md)를 따른다. 설치 직후 열린 탭은 새로고침해야 content script가 실행된다. v0.3.0 이상의 확장이 전달 알림을 지원한다.

## 목록 편집

- `{kind,id}` 입력 최대100개, 펼친 곡 최대2,000개. 입력 순서·중복을 보존한다. Loopy가 `resolve.ts`에서 목록을 펼치고 제목을 조회한다.
- 목록별20초·전체120초 제한. iframe의 getPlaylist 결과는 원본 전체를 보장하지 않으며 화면에 실제 제한을 표시한다.
- 조회 중에는 로딩 UI, 완료 후에는 곡 편집을 표시한다. 조회 iframe은 400×220 크기와 visibility:hidden/inert/aria-hidden을 사용한다.
- 열린 편집에는 최신 대기 요청 하나만 유지한다. 교체 승인 후 조회가 성공해야 편집을 교체한다. 실패 시 기존 편집본을 유지한다.
- 드래그 정렬, 곡 제거, 이름·설명 편집, 고정 높이 설명 스크롤. 미리듣기는 실제 iframe이며 곡 선택 시 기존 재생 중인 window.player를 일시정지한다. 음량은 iframe 기본 컨트롤을 사용한다.
- 목록 상단과 각 곡 메뉴의 다음 재생/대기열 추가는 queue manager를 호출하고 성공 Notice를 표시한다. 모달·편집본은 유지한다.
- 저장은 local playlist manager를 호출한다. 저장 성공 또는 ×로 닫는다. 쓰기 중 중복 동작을 차단하며 실패 시 편집을 유지한다.
- 입력 오류는 shared/ui/FieldError로 입력 바로 아래 표시한다. 이름은 trim 기준 필수이며 비어 있으면 저장 버튼을 비활성화한다.
- 검색 URL의 `loopy=1`은 YouTube 담기 UI만 다시 켠다. content script는 검색어를 보존하고 표시 매개변수만 소비한다.

## URL 생성·최신 교체

URL이 없으면 이름으로 로컬 목록을 생성한다. URL blur/Enter는 현재 URL 미리보기를 시작하며 Enter로 저장하지 않는다. IME Enter는 무시한다. URL 변경은 이전 후보·요청·자동 입력을 무효화한다. 반복 blur만으로 재조회하지 않으며 실패는 명시적으로 재시도한다.

이름/설명은 empty/auto/user 소유권을 가진다. 사용자 입력·삭제·선택·IME를 늦은 응답으로 덮어쓰지 않는다. 실제 playlist oEmbed에서 확인한 제목만 미편집 빈 이름에 채운다. 응답에 설명이 없으므로 설명을 추정하지 않는다. 미리보기 중에는 필드 편집·취소가 가능하고 저장 중에는 잠근다.

CREATE의 최초 성공 시 곡 배열과 initialSnapshot을 같은 IndexedDB transaction에 저장한다. 최신 교체는 저장한 sourcePlaylistUrl을 사용하며 사용자의 이름·설명·최초 snapshot·현재 큐는 보존한다. 교체는 명시적 CTA 한 번으로 확인한다. metadata/저장 실패는 입력과 후보를 보존한다.

## 외부 서비스 계약

키 없는 공식 iframe/oEmbed 경로가 기본이다. 비공개 목록은 지원하지 않는다. oEmbed는 credentials omit/no-referrer, 영상 ID 검사, 동시4개·전체12초 제한, 자동 재시도 없음. 제목 실패는 임시 이름을 보존한다. playlist 제목은 응답 provider와 videoseries의 list ID까지 확인한다. 401/403을 자동 재시도하지 않는다.

## 검증과 남은 결합

- `npm run impact -- youtube`, `npm run check`
- `extension-import*.test.tsx`, `playlist-url.test.ts`, `playlist-preview.test.tsx`, `unified-playlist-form.test.tsx`, `playlistMetadata.test.ts`, `playlist-snapshot.test.tsx`
- `e2e/extension-import.mjs`: 실제 패키지·Chrome 메시지·IndexedDB, 외부 YouTube 응답은 fixture.
- `e2e/extension-import-live.mjs`: 실제 공개 YouTube, 별도 프로필, 저장 없음. 모든 곡·원본 전체·실제 소리 출력을 보장하지 않는다.
- `e2e/extension-install.mjs`: 다운로드·명시적 연결 확인, Chrome 응답은 fixture.

queue/playlists manager, window.player, shared Dialog, Chrome 메시지와 결합한다. 이 경계의 변경은 실제 앱 진입점에서 다시 검증한다.
