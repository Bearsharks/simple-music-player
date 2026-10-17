# Simple Music Player 아키텍처

제품 소스는 `main`이며 배포 단위는 검증된 전체 커밋 SHA와 파일별 SHA-256 manifest다.

## 실제 실행 경로

`src/main.tsx` → `src/app/App.tsx` → `features/navigation/pages/Main.tsx`

App은 BASE_URL의 BrowserRouter와 Suspense, Main과 YouTube 도구를 조립한다. 운영은 `/`, 개발은 `/simple-music-player/`다. navigation/Main이 라이브러리·목록 상세 라우트, 사이드바, 플레이어, 팝업을 연결한다. URL 검증·공개 메타데이터·확장 가져오기 스타일은 youtube 기능이 소유한다.

## 기능 소유권

| 기능 | 책임 | 주요 연결 |
| --- | --- | --- |
| navigation | 화면 조립, 라우트, 반응형 셸 | playlists, player, overlays |
| playlists | 저장 목록 조회·생성·수정·삭제·곡 편집 | shared API, queue, overlays |
| queue | 현재 대기열, 선택, 순서, 추가·삭제 | playlists의 곡 조회, player |
| player | YouTube 임베드, 재생 제어, 진행률·음량 | queue, youtube |
| youtube | URL 검증·가져오기·메타데이터·확장 목록 편집 | playlists, queue, player, extension |
| overlays | 모달·메뉴·알림과 기능 간 조정 | 실제 데이터 변경은 각 소유 기능 |
| shared | 공통 타입, 저장 어댑터, 재사용 UI | feature/app으로 역의존하지 않음 |

기능별 최소 읽기 경로는 [CHANGE-GUIDE.md](CHANGE-GUIDE.md)와 각 feature README를 따른다. 계약 변경 전 `npm run impact -- <feature>`로 직접 소비자를 확인한다.

## 저장과 외부 서비스 계약

- React/Vite 정적 클라이언트 앱이다. 로그인·OAuth·자체 백엔드는 현재 제품에 없다.
- 확장 연결 확인은 앱 시작·수동 확인에서 한 번 실행한다. 저장 알림은 대상 탭의 content script가 전달하며, 앱은 payload 없는 알림을 받은 뒤 검증된 확장 ID에 pull한다. 항목·ACK는 실제 sender 출처/frame/tab을 검증하는 Chrome 외부 메시지로만 처리한다. 수신 실패는 확장 basket을 보존한다.
- `shared/api/apiSelector.ts`는 기본적으로 localAPI를 사용하며, 명시적인 fixture 설정만 테스트 API를 선택한다.
- localAPI는 IndexedDB `simple-music-player-local-v1`의 playlists 저장소를 사용한다. 트랜잭션 완료 전에는 저장 성공으로 알리지 않는다.
- 저장 재생목록과 현재 재생 대기열은 별개다. 대기열은 접속 중 상태이며 목록으로 저장한 내용만 영속된다. 저장 목록 삭제가 현재 재생 대기열 삭제를 뜻하지 않는다.
- 공개 YouTube 목록 가져오기는 눈에 보이는 공식 iframe 미리보기의 `getPlaylist()` 결과를 사용한다. API 키 없이 곡 ID를 저장하지만 전체 원본 수집·제목 자동 조회는 보장하지 않는다.
- 가져온 목록은 `sourcePlaylistUrl`을 보존한다. 로컬 편집본을 자동 동기화하지 않는다. 사용자가 미리보기와 교체 확인을 거친 원본 초기화에서만 교체한다.
- 일반 로컬 목록에는 출처 URL을 추측해서 채우지 않는다. 과거 서버 데이터도 로그인 없이 자동 회수하지 않는다. [저장소 이전 근거](STORAGE-MIGRATION.md)
- IndexedDB는 origin 단위다. GitHub Pages의 같은 origin에 배포된 다른 앱과 완전히 격리된 저장 공간이라고 설명하지 않는다. 도메인 전환은 별도 승인 사항이다.

## 경계와 남은 결합

- overlays와 playlists 사이 조정 코드, queue의 playlist atom 접근, player의 `window.player` 의존이 남아 있다.
- feature 내부 경로를 다른 기능에서 직접 import하는 부분이 있다. 현재 구조를 완전 독립 모듈이라고 주장하지 않는다.
- shared의 공통 타입·API 계약을 바꾸면 playlists/queue/player 등 직접 소비자 회귀를 확인한다.
- 디자인 변경은 기존 동작을 보존하며, 레이아웃을 위해 저장 로직을 화면 컴포넌트에 복제하지 않는다. 공통 모달·포커스 동작도 기능마다 중복 작성하지 않는다.

## 검수 기준

1. 구조: 기능 소유권, import 방향, 상태·저장 로직 중복, 계약 소비자 영향.
2. 기능: 저장 성공/실패, 새로고침 영속성, 빈 목록 재생 보호, 삭제 후 경로, 원본 초기화 취소·실패.
3. 디자인: 확정된 토큰·레이아웃·상태 표현과 구현을 비교한다. 시안만으로 구현 완료를 판정하지 않는다.
4. UX: 키보드·포커스 복귀, 모바일 터치 표적, 빈 상태·오류 상태, 실제 조작 순서를 검수한다.
5. 증거: `npm run check`와 브라우저 회귀 결과를 구분한다. mock YouTube 테스트는 실제 외부 재생 증거가 아니다.

`check:boundaries`는 일부 import 경계만 검사한다. 순환 의존, 상태 계약, 전체 사용성을 자동 보장하지 않는다. 실제 YouTube 재생·실기기·운영 배포 검증 여부는 완료 보고에 별도로 적는다.
