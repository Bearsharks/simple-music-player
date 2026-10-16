# Electric Night 제품 구현 — 검수 인계

2026-10-16. 구현 기준: `DESIGN-SPEC.md`, `ACCEPTANCE.md`, 승인된 독립 prototype.

## 현재 상태

- 소스 동결: 부모 검수/CI 준비 완료. 이 구현자는 커밋·push·배포하지 않았다.
- `npm_config_cache=/tmp/music-player-npm-cache npm run check`: **86 tests / 14 files**, feature boundary 83 files, TypeScript, production build 통과.
- `git diff --check`, e2e 3파일 `node --check` 통과.
- 이전 CI `38869455394`에서 생성 smoke 1440/1280/390 및 Electric Night 320px가 통과했다. 390px 중첩 Escape 이후 부모 큐까지 닫힌 실패를 수정했으며, 이번 변경의 실제 Chromium 결과는 대기 중이다.
- 로컬 Chromium은 `socket() failed: Operation not permitted`로 시작하지 못했다. 아래 실제 브라우저 판정/스크린샷 비교는 아직 통과로 표시하지 않는다.
- 기존 64개 회귀를 유지하면서 승인 UX에 맞춰 빈 카드의 추가 액션/순서 편집 진입/원본 확인 dialog 셀렉터를 수정했다. 테스트를 삭제하거나 타임아웃으로 우회하지 않았다.

## 구현 범위와 소유권

- shared/ui: Electric Night 색·간격·공통 controls, static SVG Icon, playlist ID 기반 Cover와 이미지 실패 fallback, 읽기 실패 boundary, native Dialog/OverlayPortal. shared에서 feature를 참조하지 않는다.
- navigation: 기존 App → Main → Routes 조립, 208px rail/64px topbar, 모바일 rail 숨김, 큐 열림 시 중앙 폭 회복/축소. 생성 출처를 받아 빈 목록의 URL 포커스, 가져온 목록의 제목 포커스, 선택곡 저장의 현재 맥락 유지를 담당한다.
- playlists: 채워진 라이브러리의 제목·검색·정렬·카드, 전체 빈 상태만 환영 파형, 상세 헤더·추가/편집 접힘, 명시적 중복 추가, 실패 읽기 재시도. CREATE의 결과는 `{createdId}`이고 router에 직접 의존하지 않는다.
- player: 고정 dock, read-only 모바일 진행선, 실제 진행률/음량, now/queue 탭, 데스크톱 nonmodal / 좁은 drawer·mobile modal sheet, 실제 API/error 이벤트 기반 상태와 명시적 재시도.
- queue: 첫 desktop 재생만 자동 reveal, 이후 닫힘 존중, drag/위아래 편집, 삭제 Undo, 확인 후 CLEAR. 저장 목록과 독립 유지.
- overlays/youtube: native 확인/폼, 비동기 저장 실패·입력 보존, sheet 안 메뉴/top-layer portal, 접근 가능한 Undo, URL→공식 iframe preview→저장과 원본 교체 단일 확인.
- 각 기능 README를 실제 계약에 맞게 갱신했다. 전역 아키텍처 문서와 부모의 ARIA-REVIEW.md는 이 구현자가 수정하지 않았다.

## 보존 및 변경 계약

1. IndexedDB 이름/버전/store/key 및 localAPI/API selector는 변경하지 않았다. 기존 createdAt/원본 URL, 항목 key/순서, 복제된 현재 큐를 유지한다.
2. 저장 실패 후 폼/미리보기/오류를 유지한다. iframe preview polling은 저장 오류를 더 이상 지우지 않는다. URL을 바꾸면 이전 저장 후보를 무효화하고 같은 URL도 다시 미리보기할 수 있다.
3. 저장 곡 Undo는 기존 계약 유지. 새 queue Undo는 이후 추가/정렬과 current key를 보존하고 LOAD/SET/CLEAR 뒤 오래된 복원을 거부한다.
4. 재생 시작 후 같은 YoutubePlayer/host를 계속 렌더한다. 숨김·탭·responsive 모드 전환·큐 비우기로 unmount하지 않는다. 오류의 명시적 재시도만 인스턴스를 재생성한다.
5. native Dialog의 modal stack이 기존 inert/overflow를 관리한다. panel priority는 작업 폼보다 낮다. 좁은 panel 안 메뉴는 해당 dialog 내부에 portal하며 Escape는 메뉴부터 닫는다.
6. Undo 알림은 시간 제한 없이 닫기/다른 알림까지 유지한다. prototype의 12초보다 안전한 기존 제품 계약을 유지하므로 hover/focus 중 소멸하지 않는다. 새로고침 후 복구 기록은 남지 않는다.
7. 저장 재생목록 전체 삭제는 한 번 확인, Undo 없음. 원본 초기화는 공식 미리보기 뒤 교체 확인 한 번. 현재 queue는 자동 동기화/중단하지 않는다.
8. CSP, 허용 URL, OAuth 없는 로컬 저장, 공식 YouTube adapter를 유지했다. prototype의 가짜 곡/시계/localStorage/시연 로직은 제품에 복사하지 않았다.

## 추가 회귀 근거

- ID 커버 일관성, SVG id 충돌 방지, thumbnail 오류 fallback
- 조회 오류가 빈 라이브러리로 바뀌지 않고 재시도되는지
- 처음 재생만 desktop reveal, narrow 화면의 원치 않는 modal 방지
- queue delete → append/reorder → Undo 보존과 clear/replacement 이후 거부
- 중첩 dialog 중 양방향 modal/nonmodal 전환의 inert/scroll 정리, 동일 host 유지
- mini progress에 slider가 없고 미확정 duration은 ‘—’인 점
- playing/paused/loading/ended/error 상태 구분
- 모의 공식-player 인스턴스의 탭/닫기/재열기/resize/재정렬 유지
- sheet 내부 팝업, Escape의 메뉴 우선 닫기, Undo 접근
- 실제 생성 폼 성공 후 새 상세/첫 URL 포커스, 중복 영상 명시 확인
- 원본 교체 취소/확인, preview polling 중 저장 실패 유지/재시도

## 실제 Chromium CI 확인 대기

`npm run test:browser`는 두 시나리오를 순서대로 실행한다.

### smoke.mjs

1440/1280/390에서 실제 UI로 생성 → 0곡 → 1회 저장 실패/입력 보존/재시도 → 3곡 추가 → 새로고침 → 빈 카드 추가/disabled 상세 재생 시 queue 보호 → 전체 목록 삭제 취소/확인·경로 복귀 → CSP inline script 차단. 직접 IDB seed로 생성 경로를 대체하지 않는다.

### electric-night.mjs

별도 검수 fixture만 seed하고, 320/390/768/1024/1280/1440의 라이브러리/상세를 캡처한다. 390은 첫 커버 y≤240 및 4번째 제목이 dock 위인지 확인한다.

390/1440에서 now/queue 탭 키보드, 내부 메뉴 → 저장 대상 → 새 생성 → 가져오기 연쇄, 열린 하위 modal 중 1199→1200→1199 전환, inert/overflow/포커스 복귀, 모의 player/host identity, 저장 목록 및 queue 순서 변경, 재생 제한 오류/재시도를 확인한다. 30개 이상 목록/긴 제목, 200% 글자 확대 근사 화면도 캡처한다. 확대 근사는 실제 Safari/Firefox text zoom 검증을 대신하지 않는다.

예상 산출물:

- `test-results/app-library-{320,390,768,1024,1280,1440}.png`
- `test-results/app-detail-{...}.png`
- `test-results/app-queue-{390,1440}.png`, `app-error-{390,1440}.png`
- `test-results/app-text-200-{390,1440}.png`
- `test-results/empty-*.png`, `save-error-*.png`, `simulated-playing-*.png`
- 실패 시 PNG, HTML, accessibility snapshot, dialog 이벤트/포커스 상태 JSON, Playwright trace. 기존 생성 smoke는 interaction/state 로그도 남긴다.

비교 기준은 승인된 `prototype-library/detail/queue/error/empty-*.png`다. density/커버 위치/텍스트 읽기/대기열 중앙 독립 조작을 먼저 비교하고, 미디어 영역은 공식 player와 명시적 검증 mock의 차이를 감안한다.

## 남은 검증 경계

- 실제 YouTube 오디오·seek·음량·autoplay·임베드 제한·목록 완전 수집, 모바일 Safari/백그라운드 재생을 검증했다고 주장하지 않는다.
- Native top-layer interaction과 CSS 밀도는 실제 CI 결과로 판단해야 한다. jsdom 통과만으로 인수하지 않는다.
- 여러 탭의 동시 IndexedDB 수정은 기존과 같이 자동 동기화하지 않는다. 설정·로그인·새 저장 시스템을 추가하지 않았다.
- 실제 보조기기/스크린리더 검수는 아직 별도다.

## 1차 시각·브라우저 검수 반영

- 재디자인 없이 승인된 색/밀도를 유지했다. 경로 진입용 h1의 포커스 outline만 숨기며 버튼/입력의 focus-visible은 유지한다. 생성 폼 실패 메시지 앞에는 16px 간격, 큐 편집/저장/비우기 아이콘에는 title을 추가했다.
- native dialog Escape의 중복 소유를 제거했다. native cancel만 최상위 작업을 닫으며 하위 큐에 전파하지 않는다. fallback keydown도 이미 처리된 이벤트를 건너뛴다. native close watcher 자체는 jsdom이 없어, 시뮬레이션 unit과 실제 Chromium 양쪽에서 확인하도록 분리했다.
- 생성 완료의 `empty`/`import`/`selection`은 overlays→navigation 콜백만 변경한다. 큐 저장은 경로/현재 곡/큐 열림/저장 버튼 포커스를 유지한다. 가져오기는 제목에 포커스를 보내고 좁은 sheet만 닫는다.
- 저장/큐 곡 삭제 뒤 트리거가 사라지면 다음 곡, 마지막이면 이전 곡, 완전히 비면 추가/큐 닫기로 포커스를 복귀한다. 비동기 저장 순서 변경은 실패/성공 및 끝 위치에서도 키보드 편집 포커스를 유지한다.
- 전체 저장 목록 메뉴의 ‘대기열 끝에 추가’는 기존 APPEND_PLAYLIST를 호출한다. 모호한 큐 추가/삭제 문구도 대기열로 명시했다.
- 추가 unit 8건: native cancel 단일 처리, 선택곡 저장 390/1440 맥락, 가져오기 390/1440 포커스·큐, 실패/연속 순서 이동, 삭제 포커스, 전체 목록 append. 기존 통합 테스트에도 큐 삭제 포커스와 자식 Escape 후 부모 유지 검증을 보강했다.
- 실제 Chromium 시나리오에 같은 경계들을 추가했다. 메뉴→picker→생성→가져오기 뒤 breakpoint 전환/Escape에서 부모 큐가 여전히 열려 있는지 즉시 검사한다. UI 큐 저장, 실패 순서 저장 후 키보드 재시도, 삭제→Undo, 전체 목록 append, 가져오기 완료도 이어서 검증한다. 타임아웃을 늘리거나 실패 검사를 제거하지 않았다.
