# queue: 현재 재생 대기열

로그인 제거 후 기존 편집 화면에 다시 연결되어 있다. 저장 목록은 shared/api/localAPI.ts, URL 가져오기는 youtube/ui/PlaylistImport.tsx를 사용한다.

## 최소 읽기 경로

- `model/queue.ts` — 추가·삽입·삭제·선택·순서 변경
- `ui/ConnectedMusicList.tsx` — 동작 연결
- `ui/musicList/MusicList.tsx` — 드래그 목록

## 연결과 영향 범위

playlists에서 저장 곡을 가져온다. player가 현재 곡/인덱스를 소비하고 overlays와 playlists 화면이 queue 동작을 호출한다.

`npm run impact -- queue`으로 현재 코드의 직접 소비자와 외부 의존 파일을 확인한다. 내부 구현만 바꾸면 위 진입 파일부터 읽고, export/상태/타입/콜백 계약을 바꿀 때에만 소비자로 읽기 범위를 넓힌다.

## 보존할 계약

items와 index는 queueState 한 값으로 관리한다. 삭제 후 현재 곡 유지 또는 유효한 다음 인덱스 선택. 항목 key는 반복 삽입에도 고유해야 한다. 비동기 추가는 최신 상태에 합친다.

## 검증

- 빠른 회귀: `npm test -- src/__test__/playlistState.test.tsx src/__test__/musicList.test.tsx`
- 제출 전: `npm run check`
- 검증 공백: 드래그·재생 종료·팝업 추가의 전체 사용자 흐름은 브라우저에서 별도 확인한다.
- UI 변경은 관련 Storybook 또는 fixture 화면으로 확인하고 실제 확인하지 못한 항목은 보고한다.

## 완료 보고

변경한 계약, 영향을 받는 소비자, 실행한 테스트와 결과, 미검증 항목을 적는다. 새 공개 함수나 의존 관계를 만들면 이 README도 갱신한다.

[전체 구조](../../../docs/ARCHITECTURE.md) · [작업 시작 지도](../../../docs/CHANGE-GUIDE.md)

## 빈 목록과 키보드 보호

`LOAD_PLAYLIST`가 빈 곡 배열을 읽으면 현재 queue 객체와 index를 그대로 보존한다. 빈 카드는 곡 추가로 진입하고 상세의 빈 목록 재생은 비활성화한다. 큐 비우기는 명시적 CLEAR 동작이다. 곡 썸네일/제목은 기본 button, 더보기는 곡명이 포함된 button이며 Enter/Space로 조작할 수 있다. 저장 목록 삭제/Undo는 queue를 건드리지 않는다.

회귀: `npm test -- src/__test__/musicList.test.tsx src/__test__/overlay-regressions.test.tsx`.

## Electric Night 큐 계약

- `musiclistOpenState`는 기본 닫힘. `revealQueueOnFirstPlay`는 최초의 명시적 재생에서만 데스크톱 패널을 연다. 좁은 화면은 자동 modal 전환하지 않는다. 사용자가 닫은 뒤 다음 곡/중앙 편집/재생을 눌러도 강제로 다시 열지 않는다.
- `playerPanelTabState`는 현재 곡/대기열 보기만 가진다. 실제 player/queue items를 복제하지 않는다.
- DELETE는 `{deletedCount, undo}`를 반환한다. 항목 key 기반 복원은 뒤의 추가/정렬 및 현재 곡 identity를 보존한다. LOAD_PLAYLIST/SET/CLEAR는 교체 세대를 올려 오래된 Undo를 거부한다. CLEAR는 삭제 확인 이후에만 UI에서 호출하며 저장 목록에 영향을 주지 않는다.
- `MusicList`는 실제 currentIndex/status를 props로 받고 drag와 명시적 위/아래 버튼을 제공한다. 현재 상태 문구는 player가 전달하며 queue에서 player 상태를 다시 관리하지 않는다.
- 회귀: `musicList.test.tsx`, `electric-night.test.tsx`; 브라우저의 큐/메뉴/Undo/반응형 검수는 media simulation이므로 실제 YouTube 소리의 증거가 아니다.
