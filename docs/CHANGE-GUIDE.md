# 에이전트 변경 지도

목표는 저장소 전체를 매번 읽지 않고, 요청한 기능의 소유 파일과 영향받는 계약만 확인하는 것이다.

## 시작 절차

1. 아래에서 요청의 소유 기능을 선택한다.
2. 해당 README의 최소 읽기 경로와 보존 계약을 읽는다.
3. `npm run impact -- <feature>`로 실제 직접 소비자/의존 파일을 확인한다.
4. 내부 구현 변경은 기능 안에 한정한다. export, atom, 공통 타입, API, 라우팅 계약을 바꾸면 소비자까지 추적한다.
5. 기능 README의 빠른 테스트 후 `npm run check`를 실행한다. UI·외부 서비스 검증 공백은 따로 적는다.

## 요청 → 진입점

| 요청 | 우선 읽을 문서 | 함께 볼 조건 |
| --- | --- | --- |
| 로그인/만료/콜백 | [auth](../src/features/auth/README.md) | 서버 계약 또는 로그아웃 변경 시 shared/api, navigation |
| 메뉴/모바일 화면 조립 | [navigation](../src/features/navigation/README.md) | 조립된 기능의 레이아웃·라우팅 변경 시 |
| 저장 목록 생성/수정/삭제 | [playlists](../src/features/playlists/README.md) | 폼 동작은 overlays, 대기열 가져오기는 queue |
| 곡 추가/순서/현재 곡 | [queue](../src/features/queue/README.md) | 현재 곡 계약 변경 시 player |
| 재생/음량/진행률 | [player](../src/features/player/README.md) | 곡 선택은 queue, 메타데이터는 youtube |
| 검색 입력 | [search](../src/features/search/README.md) | 결과 메뉴는 overlays, API는 youtube |
| URL 가져오기/YouTube 조회 | [youtube](../src/features/youtube/README.md) | 토큰은 shared/api, 결과 소비자는 overlays/player |
| 팝업/모달/알림 | [overlays](../src/features/overlays/README.md) | 비즈니스 동작은 실제 상태 소유 기능 |

## 현재 경계의 한계

기능별 파일 이동과 상태 소유 분리는 완료했지만, 완전 독립 모듈 구조는 아니다.

- overlays에는 기능 간 조정 코드가 남아 있고 playlists와 양방향 참조가 있다.
- queue는 저장 목록 atom을 직접 읽으며 playlists UI는 queue를 호출한다.
- player 컨트롤 일부는 window.player에 의존한다.
- 외부 기능은 아직 내부 경로를 직접 import한다. 안정된 공개 API만 노출하는 단계는 후속 리팩토링이다.
- shared/model/constants.ts의 공통 타입/액션 변경은 여러 기능에 영향을 준다.

이 부채를 숨기고 “한 폴더만 보면 된다”고 단정하지 않는다. 먼저 impact 출력으로 영향 범위를 좁히고, 변경할 계약이 있으면 해당 소비자를 읽는다. 기능 수를 늘리거나 모든 파일을 index.ts로 재export하는 것으로 결합이 해결되지는 않는다.

## 도구의 보장 범위

`check:boundaries`는 폐기 라이브러리 참조, shared의 feature/app 의존, alias 경로 유효성을 검사한다. 순환 의존이나 모든 업무 계약을 보장하지 않는다.

`impact`는 현재 TypeScript 정적 import의 직접 연결을 출력한다. 동적 문자열 로딩, 이벤트·콜백 의미, 서버 응답, CSS/전역 객체 영향은 README와 해당 계약을 추가 확인한다. 테스트가 없는 화면은 테스트가 없다고 명시한다.

## 작은 변경의 완료 조건

- 요청 기능과 수정 이유가 분명하다.
- 계약을 바꾸지 않았다면 그 사실을, 바꾸었다면 소비자 검토 결과를 적는다.
- 수정 동작을 검증하는 회귀 테스트를 추가/수정한다.
- 기능 README와 연결 지도가 실제 파일을 가리킨다.
- typecheck/test/build의 결과와 UI·실서비스 미검증을 구분한다.
