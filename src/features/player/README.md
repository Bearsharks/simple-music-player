# player: YouTube 재생·컨트롤

로그인 제거 후 기존 편집 화면에 다시 연결되어 있다. 저장 목록은 shared/api/localAPI.ts, URL 가져오기는 youtube/ui/PlaylistImport.tsx를 사용한다.

## 최소 읽기 경로

- `ui/ConnectedYoutubePlayer.tsx` — 플레이어 생성·이벤트·해제
- `api/iframe.ts` — 외부 스크립트 단일 로딩
- `model/playback.ts` — 재생 상태와 진행률
- `pages/MusicPlayer.tsx` — queue와 재생 UI 연결

## 연결과 영향 범위

queue에서 곡을 받아 youtube 조회를 거쳐 iframe으로 재생한다. overlays의 곡 메뉴도 사용한다. window.player를 직접 쓰는 기존 컨트롤이 남아 있으므로 관련 참조를 함께 검색한다.

`npm run impact -- player`으로 현재 코드의 직접 소비자와 외부 의존 파일을 확인한다. 내부 구현만 바꾸면 위 진입 파일부터 읽고, export/상태/타입/콜백 계약을 바꿀 때에만 소비자로 읽기 범위를 넓힌다.

## 보존할 계약

StrictMode에서도 취소된 생성과 unmount player를 정리한다. duration=0 안전 처리. 입력창/버튼 사용 중 전역 재생 키가 가로채지 않도록 한다. 네트워크 메타 조회와 실제 재생은 별도다.

## 검증

- 빠른 회귀: `npm test -- src/__test__/app.test.tsx`
- 제출 전: `npm run check`
- 검증 공백: mock player 통과는 실제 소리·자동 재생·임베드 제한·모바일 백그라운드 재생의 증거가 아니다.
- UI 변경은 관련 Storybook 또는 fixture 화면으로 확인하고 실제 확인하지 못한 항목은 보고한다.

## 완료 보고

변경한 계약, 영향을 받는 소비자, 실행한 테스트와 결과, 미검증 항목을 적는다. 새 공개 함수나 의존 관계를 만들면 이 README도 갱신한다.

[전체 구조](../../../docs/ARCHITECTURE.md) · [작업 시작 지도](../../../docs/CHANGE-GUIDE.md)

## 디자인 개편 진입점

ListeningDock.scss와 PlayerController.tsx가 고정 재생바를 소유한다. ProgressBar는 실제 range 입력이며 문서 너비로 seek 좌표를 계산하지 않는다. PlayerDetail은 넓은 화면의 고정 패널과 좁은 화면의 접근성 처리된 드로어다.

[승인 디자인 명세](../../../docs/design/electric-night/DESIGN-SPEC.md)

전역 재생 단축키는 input/button 외에도 열린 dialog/선택 메뉴 및 이미 처리된 키 이벤트를 건너뛴다. 로딩 중 dialog 컨테이너에 포커스가 있어도 배경 음악 조작이 가로채지 않는다. 회귀: `npm test -- src/__test__/design-player.test.tsx`.

## Electric Night 플레이어

- `PlayerDetail.scss`는 player 패널만 소유한다. 1200px 이상 nonmodal, 761–1199px modal drawer, 760px 이하 전체 sheet다. 현재 곡/큐 탭은 roving TabIndex와 화살표/Home/End를 지원한다.
- 공통 Dialog를 항상 같은 portal/DOM 위치에 유지한다. 한번 시작한 `ConnectedYoutubePlayer`는 닫기/탭/반응형 전환/큐 비우기로 unmount하지 않는다. 명시적 오류 재시도만 iframe 인스턴스를 재생성한다.
- `MusicPlayer` 한 곳에서 실제 getCurrentTime/getDuration을 읽는다. 모바일 dock의 선은 표시용이며 조작은 확장 플레이어의 44px range에서 한다. 미확정 길이는 ‘—’다.
- onError/API 연결 실패는 playbackErrorState에 표시한다. `playbackRetryState`는 명시적 재시도 전용이다. playing/paused/loading/ended/error를 구분하며 다음 곡은 유효한 인덱스에서만 가능하다.
- 큐 삭제 Undo는 queue가, 원본 저장은 playlists가 소유한다. player는 기존 manager/overlay 콜백으로만 연결한다.
- 회귀: `electric-night.test.tsx`, `design-player.test.tsx`; `e2e/electric-night.mjs`는 플레이어 DOM/인스턴스 유지, 중첩 modal, 1199↔1200 전환과 제한 오류를 시뮬레이션한다. 실제 iframe/오디오/모바일 Safari/백그라운드 재생은 실환경 검수가 별도로 필요하다.

재시도의 ready 상태는 boolean UI 신호와 실제 준비된 player instance identity를 구분한다. 빠른 onReady가 초기화의 false→true와 같은 React 배치에 들어가도 새 인스턴스를 기준으로 현재 곡을 정확히 다시 load한다. 해제된 인스턴스는 active instance 검사와 취소 플래그로 무시한다. 오류/준비 중 transport는 이전 PLAYING 값을 보여주지 않는다. `electric-night` 테스트는 React의 실제 자동 배치를 사용해 microtask ready와 지연 ready를 모두 확인하며, Chromium 시뮬레이션도 재생성/이전 인스턴스 해제/같은 곡 재로드를 확인한다.
