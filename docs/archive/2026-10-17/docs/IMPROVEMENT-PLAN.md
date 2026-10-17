# 제품 방향 갱신 — 2026-10-16

사용자 결정: 로그인/자체 서버 기반 기능을 제거하고 공개 URL 목록을 로컬에 저장한다. 아래 이전 계획의 OAuth·서버 연동 복구 항목은 취소된 방향이며 실행하지 않는다. 현재 P0는 URL 저장·복원·임베드 실재생·모바일 확인·정적 호스팅 배포다. P1은 목록 내보내기/가져오기와 이름 변경이며 아직 구현하지 않았다.

현재 상태는 [LOCAL-PLAYLISTS.md](LOCAL-PLAYLISTS.md)를 우선한다.

## 이전 계획 (기록)

# Simple Music Player 개선안과 우선순위

작성/확인: 2026-10-16. 대상: Bearsharks/simple-music-player. 작업 브랜치: `refactor/feature-modernization`.

## 1. 결론

첫 단계는 외형 전면 개편보다 **실행 가능한 유지보수 기반과 기존 기능의 회귀 방지**다. 기존 React 17/CRA 5/Recoil/구형 드래그 라이브러리를 현행 도구로 교체하고 기능별 소유권을 만들었다. 다음 제품 결정은 ‘로그인한 사용자용 클라우드 플레이리스트’와 ‘공개 YouTube 목록을 가져오는 로컬 플레이어’ 중 첫 사용 경험을 어디에 둘지다.

사용자가 공개 재생목록은 백엔드 없이 가능한지 질문했다. 이는 아직 인증/백엔드 기능 제거 지시가 아니다. 이번 변경은 기존 서버 계약을 보존한다. 로컬 우선 대안은 A01에서 검토한다.

## 2. 확인한 기존 기능과 외부 경계

- 앱 서버: 로그인/로그아웃/로그인 유지, 인증 여부 및 프로필, YouTube 토큰 반환, 재생목록 목록·상세·곡 목록 조회, 생성·수정·삭제.
- 클라이언트: 검색어·동영상 URL·재생목록 URL 입력, YouTube 개인 재생목록 가져오기, 대기열 추가/다음에 재생/삭제/순서 변경, 재생·일시정지·탐색·음량.
- 서버 소스/DB/배포/권한 scope는 이 저장소에 없다. 실제 OAuth·토큰 갱신·사용자별 접근제어를 프런트 코드만으로 검증했다고 주장하지 않는다.
- 재생은 YouTube iframe API, 검색/메타데이터는 Data API, 앱 재생목록 저장은 별도 백엔드다. 세 기능을 하나의 ‘YouTube 인증’으로 묶지 않는다.

## 3. 이번에 구현한 기반 정비

| 분야 | 변경 | 목적 |
|---|---|---|
| 구조 | app / features / shared / test 분리, 기능 README·AGENTS.md·경계 검사 | 에이전트가 변경 위치·검증 방법을 바로 찾음 |
| 상태 | Recoil 제거, Jotai로 전환. 재생목록/대기열/재생 상태 분리 | 유지되지 않는 의존성 제거, 상태 변경 책임 축소 |
| 큐 | 항목·현재 인덱스 원자적 갱신, 반복 추가 고유 key, 마지막 곡 삭제 후 범위 보정 | 중복 키/선택 유실/동시 추가 덮어쓰기 회귀 방지 |
| 도구 | Vite·TypeScript·React·Router·Vitest·Testing Library, Node24 기준, 정확 버전/lock | CRA 제거와 재현 가능한 설치 |
| UI 기반 | react-beautiful-dnd→hello-pangea/dnd, Sass @use, React19 ref/Root 대응 | 유지 가능한 API 사용 |
| 네트워크 | 공통 HTTP 상태 검사, 인증 실패 화면, YouTube 401 최대1회 갱신·403 반복 중지 | 무한 요청/무한 로딩 방지 |
| 토큰/URL | YouTube 토큰을 URL 대신 Authorization header, 엄격 호스트/영상 URL 파싱 | 토큰 URL 노출·잘못된 주소 처리 개선 |
| 플레이어 | 단일 iframe 스크립트 로더·정리, 입력 필드에서 단축키 무시, 늦은 검색 결과 취소 | StrictMode와 화면 수명 회귀 방지 |
| CI | 검증 전용 작업으로 분리, Node24/npm ci/check/Storybook 빌드 | PR 검증이 자동 게시하지 않음 |

버전은 작업일 npm registry에서 조회하고 실제 설치된 정확 버전으로 고정했다. `package.json`과 lock이 정본이다. ‘최신’ 문자열로 다음 설치 때 다른 major가 자동 채택되지 않는다. 기능 전면 재작성이나 새로운 백엔드 도입은 하지 않았다.

## 4. 우선순위 기준

- **P0:** 데이터 손실, 인증/재생 불가, 출시·배포 판정에 필요한 검증. 먼저 해결.
- **P1:** 핵심 사용자 여정의 사용성과 안정성. P0 후 출시 범위에 포함 권장.
- **P2:** 차별화·운영 비용·확장성. 측정 후 선택.
- 크기 S/M/L은 상대 크기이며 확정 일정이 아니다. API·기기·사용자 결정이 필요한 항목은 의존성을 별도 기재한다.

## 5. 아키텍처 개선 백로그

| ID / 우선순위 / 크기 | 문제와 조치 | 완료 판정 / 의존성 |
|---|---|---|
| A01 / P0 / M | **백엔드 유지 vs 로컬 우선 제품 결정.** 공개 목록 URL+브라우저 저장을 기본으로 하면 로그인 진입 장벽과 서버 운영을 줄일 수 있음. 사용자 목록 동기화·비공개 접근은 옵션으로 분리 | 기능별 인증 필요 표, 저장/내보내기/유실 안내, 데이터 이전 계획 승인. 현재 서버 기능을 삭제하지 않은 상태에서 결정 |
| A02 / P0 / M | 실제 백엔드 계약 검증: /isAuthed, /token, CRUD 응답·오류·만료·사용자 분리 확인 | 테스트 계정/서버 승인 후 로그인→목록 수정→재접속, 401/403/5xx 보고. DB/권한을 프런트 추측으로 확정하지 않음 |
| A03 / P0 / M | OAuth token이 URL path로 돌아오는 기존 계약 교체 검토. 서버 세션 또는 코드 교환 방식을 백엔드와 정렬 | 토큰이 URL/로그/히스토리에 남지 않는 전체 로그인 경로 검증. 이번 작업은 replace navigation만 개선했고 프로토콜을 바꾸지 않음 |
| A04 / P1 / M | 전역 window.player를 타입 있는 PlayerAdapter/context로 완전히 캡슐화 | 음량/탐색/현재곡 화면이 전역 객체를 직접 읽지 않음. 준비 전/오류/재마운트 상태 테스트 |
| A05 / P1 / M | API JSON의 런타임 스키마 검증, 명시적 오류 타입, 요청 취소와 재생목록별 mutation 직렬화 | 잘못된 서버 응답·중첩 편집·삭제와 응답 순서 역전에도 상태 일관. 현재 타입 단언의 한계 제거 |
| A06 / P1 / S | 실제 브라우저 E2E와 Storybook CI 검증 확정 | 터치/키보드/드래그/팝업/라우팅 시나리오, 오류0. 이번 환경의 Storybook/브라우저 실행 제한을 정상 runner에서 해소 |
| A07 / P2 / M | feature 간 public API를 점진 정리하고 action payload any를 discriminated union으로 교체 | 기능간 deep import 감소, 잘못된 액션이 타입 단계에서 실패. 별도 거대 추상화 라이브러리 도입 금지 |
| A08 / P2 / S | 폰트·아이콘 subset/woff2 중심 최적화 | 초기 실제 전송량·LCP 측정 전후 비교. 현재 빌드는 여러 아이콘 스타일·폰트 파일을 산출함 |

## 6. 디자인 개선 백로그

| ID / 우선순위 / 크기 | 사용자 문제와 조치 | 완료 판정 |
|---|---|---|
| D01 / P0 / M | 모바일에서 검색→추가→재생 흐름 검증. 재생 컨트롤/목록/팝업이 좁은 화면에서 겹칠 위험 | 360px·390px·태블릿·데스크톱 실제 화면, 가로 넘침 없음, 주요 조작이 접근 가능한 위치. 에뮬레이션과 실기기 분리 |
| D02 / P1 / M | div/span 클릭을 의미 있는 button으로 전환, 레이블·포커스·키보드·Esc·모달 focus trap | Tab/Enter/Space/Esc만으로 로그인·목록·재생 조작 가능, 스크린리더 이름 존재 |
| D03 / P1 / S | 로딩/빈 목록/권한 없음/네트워크 실패/할당량 초과를 구분 | 각 상태에 원인과 다음 행동 표시. alert 남발과 조용한 실패 제거 |
| D04 / P1 / M | 메뉴의 ‘현재 대기열’과 ‘저장 재생목록’ 명확화 | 추가/다음 재생/저장/삭제의 대상이 화면에 명시되고 잘못된 목록 삭제를 방지 |
| D05 / P2 / M | 색·간격·타이포·상태를 토큰화하고 앨범아트 placeholder 정리 | 임의 외부 이미지 의존 감소, 명암/포커스/긴 제목 검증. 이번 구조 개편을 디자인 완료로 주장하지 않음 |

## 7. 기능 개선 백로그

| ID / 우선순위 / 크기 | 조치 | 완료 판정 / 조건 |
|---|---|---|
| F01 / P0 / M | 실제 YouTube 재생: autoplay 차단, 삭제/비공개/지역제한 영상, 다음 곡, 플레이어 오류 UI | 정상·재생불가 각 사례를 실제 승인된 브라우저에서 확인. mock Player 통과를 실제 재생 성공으로 세지 않음 |
| F02 / P1 / M | 공개 재생목록 URL 가져오기 + 로컬 저장 옵션 | A01 승인 후 구현. 공개 Data API 접근 키·할당량 설정은 별도 승인. OAuth 없이 지원할 범위 명시 |
| F03 / P1 / M | 큐/재생목록 JSON 내보내기·가져오기·버전 검사 | 손상 파일 무손실 거절, 중복/순서 보존, 브라우저 저장 삭제 안내. 브라우저 저장은 기기 간 동기화 아님 |
| F04 / P1 / M | 검색 취소/진행률·대형 목록 일부 가져오기·중복 정책 | API 호출 횟수 제한과 사용자 취소, 순서 보존, 재시도 시 중복 추가 방지 |
| F05 / P2 / S | 반복·셔플·키보드 도움말 | 현재곡 유지와 빈/단일 큐 경계 테스트. 우선 실제 재생 안정화 뒤 시행 |
| F06 / P2 / M | 기기간 동기화/비공개 목록·개인 라이브러리 | A01에서 수요 확인 뒤 OAuth/backend 별도 범위로 설계. 공개 목록만 필요한 사용자를 로그인시키지 않음 |

## 8. 권장 진행 순서

1. A01 제품 방향 결정 및 A02/A03의 실제 인증 경계 파악.
2. F01 + D01 + A06으로 현재 기능의 실제 브라우저·모바일 인수.
3. D02/D03/D04와 A04/A05로 핵심 조작과 실패 처리를 안정화.
4. 로컬 우선 승인 시 F02/F03, 이어 F04.
5. 측정/사용자 피드백을 보고 A07/A08/D05/F05/F06 선택.

외형을 먼저 전면 교체하거나 모든 최신 라이브러리를 추가하는 것보다 검증 가능한 작은 변경을 이어간다. 각 작업은 변경 파일·테스트·실제 실행 근거·미검증을 함께 남긴다.

## 9. 검증 결과와 출시 제한

- TypeScript 검사와 Vite production build 통과.
- Vitest 15개 통과: 큐 load/append/insert/delete/reorder·동시 추가, 재생목록 CRUD/항목 삭제, URL/401/403/페이지 반복, React StrictMode 앱 렌더·플레이어 정리. 테스트는 fixture/mock 기반이다.
- npm audit: 작업 당시 production 및 전체 의존성 알려진 취약점 0. 미래 안전 보장은 아니다.
- Storybook 정적 빌드: 환경의 networkInterfaces 시스템 호출 실패로 완료하지 못함. 승격 실행도 환경 초기화 실패. 타입 검사는 통과했으나 Storybook 빌드 성공으로 표시하지 않는다.
- Playwright 브라우저 다운로드가 유효한 아카이브를 받지 못했다. 기존 시스템 Chromium으로도 시도했으나 환경의 socket() 권한 제한으로 시작하지 못해 실제 브라우저 E2E/시각 검수는 미완료. React DOM(jsdom) 테스트로 대체 확인한 범위를 별도 표기한다.
- 실제 구글 로그인·서버 CRUD·YouTube 재생·모바일 실기기·외부 게시 미검증. 현재 변경은 개발 기반 개선이며 배포 승인/제품 인수 완료가 아니다.

## 10. 공식 근거 (2026-10-16 확인)

- [React: CRA 지원 종료와 이전 권고](https://react.dev/blog/2025/02/14/sunsetting-create-react-app)
- [Recoil 저장소: archive 상태](https://github.com/facebookexperimental/Recoil)
- [Vite 시작 가이드](https://vite.dev/guide/)
- [Jotai Store](https://jotai.org/docs/core/store), [비동기 기본값·갱신](https://jotai.org/docs/utilities/resettable)
- [hello-pangea/dnd](https://github.com/hello-pangea/dnd)
- [YouTube Data API 개요](https://developers.google.com/youtube/data/getting-started): 공개 조회와 인증 조회 구분, API key와 quota.
- [OAuth 가이드](https://developers.google.com/youtube/data/guides/authentication): 비공개 사용자 데이터 접근 권한.
- [iframe Player API](https://developers.google.com/youtube/iframe_api_reference): 임베드 재생·제어. API 목록 조회와 별개.


### 브라우저 검증 재현

정상 브라우저 실행이 가능한 개발 환경에서 `VITE_API_MODE=fixture npm run dev -- --host 127.0.0.1 --port 4173` 실행 후 `npm run test:browser`. 필요하면 Playwright의 공식 Chromium을 설치하거나 `CHROMIUM_PATH`를 지정한다. 스크립트는 외부 HTTPS를 차단하고 iframe을 mock 처리하며 1280×800 / 390×844 화면의 렌더·오류·가로 넘침을 검사한다. 이 스크립트를 통과해도 실제 YouTube 스트리밍·Google OAuth 인수는 아니다.
