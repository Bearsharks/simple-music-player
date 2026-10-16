# loopy 아키텍처 리뷰

2026-10-16 · aria · 기준 커밋 `1681ade056c1790c82efeb361b127a893460f996`.
폰트 후속 작업은 별도 진행 중이며 이 리뷰는 구조 변경을 수행하지 않는다.

## 결론

현재는 **기능별로 탐색하기 좋아진 과도기 구조**다. 작은 단일 앱을 계속 운영할 기반은 있으나, 기능 독립성까지 완성됐다고 보기는 어렵다. 문제의 핵심은 폴더 이름보다 변경 책임이다. playlists 작업이 overlays의 종류/렌더링/메뉴까지 퍼지고, 재생 조작은 전역 YouTube 객체의 수명에 의존한다. 전면 재작성이나 새 프레임워크 도입보다 현재 테스트를 유지한 작은 책임 이동이 적절하다.

## 조사 방법·한계

- feature/shared/app 소스, 경계 검사 스크립트, 데이터 API, UI 진입점과 최근 수정 내역을 읽었다.
- TS/TSX import 문자열을 추출한 보조 그래프에서 테스트·스토리와 스타일 self-edge를 제외했다. `constants.ts`에는 32개 import 참조, playlistAtoms에는 13개, PopupStates에는 8개가 확인됐다. 이는 AST/번들 분석이나 성능 측정이 아니며 type-only 참조도 포함한다. fan-in만으로 나쁜 모듈이라고 판정하지 않았다.
- API selector와 concrete API가 타입을 서로 참조하는 것은 런타임 순환 장애의 증거가 아니다. feature 수준의 양방향 의존과 실제 module runtime cycle을 구분한다.
- 기준 커밋 CI는 141개 단위 테스트, 7폭 후속 UI 회귀 및 기존 6폭/root/Storybook을 통과했다. 이는 아래 설계 위험이 사라졌다는 뜻이 아니다.
- 대규모 목록 벤치마크, 실제 다중 탭 충돌 재현, 모든 브라우저 검증은 수행하지 않았다. 아래 성능/동시성 항목은 코드로 확인한 위험이지 관측된 사용자 데이터 손실 주장으로 쓰지 않는다.

## 발견 사항

### A1. P1: overlays가 범용 표시 계층과 업무 기능을 함께 소유

근거: `features/overlays/Popup.tsx`(582줄), `Modal.tsx`(207줄), `PopupStates.ts`.
Popup은 playlists·queue·youtube를 직접 가져와 목록 편집/대기열 작업/검색을 실행한다. Modal에는 목록 생성·수정 폼과 삭제 처리까지 있다. 반대로 playlists와 queue UI는 overlays의 전역 종류/manager에 의존한다.

영향: 새 playlist action을 추가할 때 기능 코드와 중앙 enum/렌더 분기/메뉴가 같이 바뀐다. 작업자가 playlists 폴더만 읽고 영향 범위를 끝낼 수 없다. 기존 snapshot 기능도 constants/API/playlist state뿐 아니라 ModalKind·Modal 렌더·Popup 메뉴 연결이 필요했다.

개선: Dialog/Popover/Notice의 포커스·레이어 책임은 공용부에 유지한다. PlaylistOptions/PlaylistForm/DeleteConfirmation/대상 목록 picker의 업무 조합은 playlists에 둔다. 여러 기능의 조합과 전역 호스트가 필요한 부분만 app/navigation composition에 남긴다. 거대한 범용 plugin registry나 새 DI 프레임워크는 필요 없다.

인수: 새 playlist action 하나를 넣을 때 범용 Dialog/Popover와 unrelated queue/player 소스를 바꾸지 않는다. 기존 포커스·Escape·실패·Undo 테스트가 그대로 통과한다.

### A2. P1: 기능 명령과 공통 모델이 느슨한 any 계약에 의존

근거: `shared/model/constants.ts:58-89`의 MusicInfoAction/MusicListAction/PlaylistAction `payload?: any`, `overlays/PopupStates.ts:39-42`의 `data?: any`.

영향: CREATE와 MOVE_ITEM의 payload가 다르지만 타입이 이를 연결하지 않는다. 누락/오타를 빌드가 놓치며 조건문·런타임 테스트·작업자의 기억에 의존한다. 공통 constants 파일에서 기능 명령과 범용 media 모델을 함께 관리해 수정 이유도 섞인다.

개선: 우선 동작 변경 없이 각 명령을 discriminated union으로 만든다. 공통 MusicInfo 같은 값 타입과 queue/playlist 전용 명령을 분리한다. exhaustive switch와 타입 수준 음성 사례를 둔다. 모든 타입을 무조건 feature 밖으로 이동하거나 barrel 파일을 대량 생성하지 않는다.

인수: 잘못된 action/payload 조합은 컴파일 실패. 기존 저장/Undo 동작 불변. 한 기능 명령 추가로 다른 기능의 action 타입을 수정하지 않는다.

### A3. P1: 기능 경계를 실제로 강제하는 규칙이 부족

근거: `tools/check-boundaries.mjs:7-14`. shared 파일에서 absolute features/app import를 제한하고 import 존재 여부·퇴역 패키지를 확인하지만, 상대 경로 해석 기반 계층 검사, feature 간 허용 행렬, type-only 구분, cycle 검사는 없다.

영향: 현재 check가 통과해도 feature 간 깊은 내부 import나 상대 경로로 생긴 역방향 의존을 보장하지 못한다. 구조 문서와 실제 코드가 다시 벌어질 수 있다.

개선: 먼저 실제 허용 의존을 README로 좁게 정의하고 AST/정규화 경로 기반 검사로 보강한다. 타입 참조와 런타임 참조를 구분한다. 기존 위반은 명시적·감소하는 목록으로 기록하고, 단순 ‘경고 무시’ 설정을 추가하지 않는다.

인수: alias/relative 두 방식의 금지 import와 runtime cycle을 넣은 fixture가 실패하고 허용된 composition·type-only 참조가 통과한다.

### A4. P2: player 인스턴스가 전역 객체로 노출

근거: `player/ui/ConnectedYoutubePlayer.tsx:125,136`, `ProgressBar.tsx:37-40`, `playerController/SoundController.tsx`의 window.player 접근과 1초 sync polling.

영향: engine 준비/재연결/교체 시 여러 컨트롤이 전역 수명을 함께 알아야 한다. 음량 동작 테스트마다 window 객체를 꾸며야 한다. UI instance가 둘이면 각각 동기화를 수행한다.

개선: player feature 내부에 좁은 playback port(readiness, play/pause, seek, volume)를 두고 인스턴스 소유자는 하나로 유지한다. 실제 YouTube adapter와 fake adapter를 같은 계약으로 검사한다. queue나 shared UI가 YouTube 인스턴스를 직접 알지 않게 한다.

인수: UI 컨트롤에서 window.player 직접 접근 제거, 재생 중 RNB/resize로 iframe 재생성 없음, 기존 seek/volume/재시도 회귀 보존.

### A5. P2: 저장소 metadata 조회가 실제로는 전체 record 읽기

근거: `shared/api/localAPI.ts:67-117`. getPlaylistInfos는 getAll 후 live items와 snapshot을 canonical/normalize하고, getPlaylistInfo도 find를 통해 전체 record를 읽는다. `playlistAtoms.ts:14-43`에서 IDs를 얻은 뒤 각 ID metadata를 다시 읽는다. `LibraryBackup.tsx`는 API interface를 거치지 않고 concrete localAPI export/import를 직접 참조한다.

영향: 스냅샷을 PlaylistInfo에서 분리한 것은 UI 계약상 유익하지만 디스크 읽기/정규화 비용까지 제거한 것은 아니다. 많은 목록/곡에서 초기 library 조회가 중복될 수 있다. 저장소 교체나 transaction 정책 수정 시 UI와 모델을 함께 살펴야 한다.

개선: 우선 측정부터 한다. 100개 목록/각100곡과 snapshot으로 목록 초기 진입의 읽기 횟수·시간을 수집한다. 중복 hydration을 먼저 제거하고 결과가 필요할 때만 metadata projection/index 또는 별도 store를 검토한다. 백업을 playlist repository/use-case 경계로 감싸 concrete API 누출을 줄인다. 즉시 DB schema migration을 강행하지 않는다.

인수: metadata-only 화면에서 불필요 snapshot normalization 반복을 줄였다는 측정 근거, backup 원자성/legacy 호환 및 기존 DB 보존.

### A6. P2: 단일 탭 mutation 안전성과 다중 탭 안전성은 다름

근거: playlistAtoms의 store별 pendingMutations WeakMap은 같은 Jotai store 안의 명령만 직렬화한다. 화면 cache를 기반으로 전체 items를 저장하며 BroadcastChannel/storage revision 동기화가 없다.

영향: 별도 탭이 각자 오래된 곡 배열을 수정하면 상대 변경을 덮을 가능성이 있다. IndexedDB transaction 자체의 원자성만으로 stale read-modify-write 문제는 해결되지 않는다.

개선: 사용자가 다중 탭을 실제 사용한다면 두 탭 경쟁 테스트부터 추가. repository 안의 read-modify-write 또는 revision conflict 탐지와 탭 변경 통지를 조합한다. UI가 임의로 최신 데이터를 병합해 사용자 순서를 바꾸지 않는다.

인수: 두 탭 append/reorder/delete 경합에서 조용한 손실 없이 일관된 결과 또는 명시적 충돌 복구.

### A7. P2: 구형 library 경로와 CSS 전환기 잔여물

근거: `features/library/ui/LocalLibrary.tsx`는 현재 app 진입에서 사용되지 않지만 localStorage 모델/UI가 남아 있고, 실제 importer는 이 feature의 URL parser를 사용한다. `electric-night.scss`의 전역 button/input/.primary-button 규칙과 shadcn boundary override가 함께 존재한다.

영향: 에이전트가 현재 라이브러리를 잘못된 feature에서 수정하거나 두 UI 체계를 함께 찾아야 한다. 과거 border-width/focus transition 문제처럼 공용 스타일 변경이 예상 밖 컨트롤에 번질 수 있다.

개선: URL parser를 youtube의 명확한 계약으로 옮긴 뒤 unused UI는 실제 참조·보존 필요성을 확인해 정리한다. 사용자 localStorage 자체를 지우라는 뜻이 아니다. 공통 의미 token과 소유 컴포넌트 styling을 남기고 사용되지 않는 전역 alias만 단계적으로 제거한다.

인수: live 진입점과 README가 같은 기능을 가리킴. legacy 데이터 삭제 없음. 화면 비교/brand-primary·shadcn 동작 회귀 유지.

## 유지할 것

- 기능별 README와 현재 feature/shared/app 탐색 구조.
- 초기 import snapshot의 불변성과 metadata/queue 독립 계약.
- 실패 전 영속 성공을 가정하지 않는 저장 흐름, 같은 store 직렬화, Undo replacement-version 보호.
- 플레이어 iframe 수명을 resize/panel 수명과 분리하는 테스트.
- 공용 Button에 행동을 위임하는 BrandPrimaryButton. 사용자 요청한 의미 있는 재사용이며 모든 버튼 wrapper를 무조건 없앨 대상이 아니다.
- 오류/작업 modal/플레이어 layer를 실제 브라우저에서 검사하는 회귀.

## 실행 순서

1. A2 명령 타입 강화 + A3 경계 검사: 동작 변화 없는 작은 PR. 타입 이름/파일 이동과 UX 변경을 섞지 않는다.
2. A1 overlays 업무 책임을 기능으로 이동: playlist menu 한 경로씩, 각 단계 포커스/Undo 검증.
3. A4 player port: 기존 global 접근을 단계적으로 adapter 뒤에 옮김. 엔진 교체는 하지 않음.
4. A5/A6는 저장소 측정·다중 탭 재현 후 결정. 무조건 정규화 DB나 새 상태 라이브러리로 전환하지 않음.
5. A7 미사용 경로/스타일 정리는 기능 이동과 같은 작은 단위에서 진행.

**총평:** 현재 구조는 지속 개선 가능한 기반이지만 ‘폴더만 기능별’인 부분이 남아 있다. 지속가능성은 파일 개수가 아니라 기능 변경 때 함께 알아야 하는 책임의 수를 줄이는 것으로 평가해야 한다. 이번 UI/폰트 배포에는 위 구조 개선을 섞지 않으며 별도 승인된 작업으로 진행한다.
