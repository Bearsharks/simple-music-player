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

[디자인 기록](../../../docs/DESIGN-REFRESH.md)

전역 재생 단축키는 input/button 외에도 열린 dialog/선택 메뉴 및 이미 처리된 키 이벤트를 건너뛴다. 로딩 중 dialog 컨테이너에 포커스가 있어도 배경 음악 조작이 가로채지 않는다. 회귀: `npm test -- src/__test__/design-player.test.tsx`.
