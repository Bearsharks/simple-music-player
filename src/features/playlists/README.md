# playlists: 저장 재생목록

현재 제품은 library 기능을 사용한다. 이 폴더는 이전 편집 기능의 재사용을 위해 보존되며 App에 연결되어 있지 않다.

## 최소 읽기 경로

- `model/playlistAtoms.ts` — 조회·CRUD·서버 데이터 갱신
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
- 검증 공백: 동일 목록의 동시 서버 변경, 실제 서버 CRUD 실패 복구는 추가 검증이 필요하다.
- UI 변경은 관련 Storybook 또는 fixture 화면으로 확인하고 실제 확인하지 못한 항목은 보고한다.

## 완료 보고

변경한 계약, 영향을 받는 소비자, 실행한 테스트와 결과, 미검증 항목을 적는다. 새 공개 함수나 의존 관계를 만들면 이 README도 갱신한다.

[전체 구조](../../../docs/ARCHITECTURE.md) · [작업 시작 지도](../../../docs/CHANGE-GUIDE.md)
