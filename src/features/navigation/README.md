# navigation: 메뉴·앱 화면 조립

로그인 제거 후 기존 편집 화면에 다시 연결되어 있다. 저장 목록은 shared/api/localAPI.ts, URL 가져오기는 youtube/ui/PlaylistImport.tsx를 사용한다.

## 최소 읽기 경로

- `pages/Main.tsx` — 헤더·검색·플레이어·오버레이 조립
- `ui/ConnectedSideMenu.tsx, ui/SideMenu.tsx` — 메뉴 상태 연결과 이동
- `model/sideMenu.ts` — 메뉴 열림 상태

## 연결과 영향 범위

app/App.tsx가 진입점을 연결한다. Main이 player/search/overlays/queue를 조립하므로 레이아웃 변경 시 해당 화면의 모바일 동작도 확인한다.

`npm run impact -- navigation`으로 현재 코드의 직접 소비자와 외부 의존 파일을 확인한다. 내부 구현만 바꾸면 위 진입 파일부터 읽고, export/상태/타입/콜백 계약을 바꿀 때에만 소비자로 읽기 범위를 넓힌다.

## 보존할 계약

다른 기능의 상태나 서버 변경 로직을 이 기능에 추가하지 않는다. 메뉴 변경은 재생 대기열을 초기화하지 않아야 한다.

## 검증

- 빠른 회귀: `npm test -- src/__test__/app.test.tsx`
- 제출 전: `npm run check`
- 검증 공백: 터치·키보드 포커스·실기기 화면 폭은 별도 확인이 필요하다.
- UI 변경은 관련 Storybook 또는 fixture 화면으로 확인하고 실제 확인하지 못한 항목은 보고한다.

## 완료 보고

변경한 계약, 영향을 받는 소비자, 실행한 테스트와 결과, 미검증 항목을 적는다. 새 공개 함수나 의존 관계를 만들면 이 README도 갱신한다.

[전체 구조](../../../docs/ARCHITECTURE.md) · [작업 시작 지도](../../../docs/CHANGE-GUIDE.md)

## 디자인 개편 진입점

Main.tsx와 StudioShell.scss가 Electric Night 앱 프레임을 소유한다. 색/간격/공통 버튼 토큰은 shared/ui/electric-night.scss, 파형 커버는 shared/ui/Cover.tsx에 있다. 기존 햄버거/검색 모듈은 기본 프레임에 연결하지 않는다. SidebarLibrary는 실제 저장 목록을 읽는다.

[승인 디자인 명세](../../../docs/design/electric-night/DESIGN-SPEC.md)

## Electric Night 화면 조립

- 중앙 라이브러리/상세는 기존 Routes에 유지한다. SidebarLibrary는 같은 playlist ID의 공통 Cover를 사용한다.
- 큐 open atom에 따라 1200px 이상에서 중앙 폭을 회복/축소한다. player가 소유하는 761–1199px modal drawer와 760px 이하 sheet는 navigation에 상태 로직을 복제하지 않는다.
- Modal의 `onCreated(id, context)`는 빈 목록(`empty`), 가져오기(`import`), 선택곡 저장(`selection`)을 구분한다. 빈 목록은 새 상세의 URL 입력, 가져오기는 제목에 포커스를 두며 채워진 목록의 추가 폼은 접는다. 새 상세로 이동할 때 좁은 modal sheet만 닫고 데스크톱 큐는 유지한다. 선택곡/큐 저장은 현재 경로·열림·포커스를 유지한다. 모든 생성은 실제 재생/큐를 바꾸지 않는다.
- 목록 읽기 오류는 ReadBoundary에서 실패 상태로 표시한다. `useReloadPlaylists`는 atom 조회를 다시 요청하고 `playlistReadRevision`으로 양쪽 boundary를 함께 재생성한다. 데이터 삭제/초기화는 하지 않는다.
- 브라우저 검수: `npm run test:browser`. 실제 생성 smoke와 별도 fixture 레이아웃 캡처를 모두 실행한다. 후자는 320/390/768/1024/1280/1440px를 검사한다.

## 현재 위치

`ui/Breadcrumb.tsx`는 실제 `/playlist/:id`와 기존 playlist ID/info atom만 구독한다.
홈은 라이브러리, 상세는 라이브러리 링크와 저장 이름을 표시한다. 읽기 중/실패/삭제된
ID는 이름 영역에만 격리되며 플레이어를 재마운트하거나 별도 저장소를 만들지 않는다.
검증: `library-navigation.test.tsx`의 이름 변경·삭제·실패와 iframe DOM 유지 회귀.
