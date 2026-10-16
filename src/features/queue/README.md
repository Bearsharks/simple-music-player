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
