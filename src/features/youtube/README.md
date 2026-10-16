# youtube: YouTube 메타데이터 조회

로그인 제거 후 기존 편집 화면에 다시 연결되어 있다. 저장 목록은 shared/api/localAPI.ts, URL 가져오기는 youtube/ui/PlaylistImport.tsx를 사용한다.

## 최소 읽기 경로

- `api/youtubeSearch.ts` — URL 파싱·조회·페이지 처리
- `ui/PlaylistImport.tsx` — 공개 URL 미리보기·로컬 저장·명시적 원본 초기화

## 연결과 영향 범위

overlays가 검색·가져오기에 사용하고 player가 곡 정보를 조회한다. OAuth는 제거되었다. 선택적인 공개 메타데이터 조회만 VITE_YOUTUBE_API_KEY를 사용한다.

`npm run impact -- youtube`으로 현재 코드의 직접 소비자와 외부 의존 파일을 확인한다. 내부 구현만 바꾸면 위 진입 파일부터 읽고, export/상태/타입/콜백 계약을 바꿀 때에만 소비자로 읽기 범위를 넓힌다.

## 보존할 계약

401/403 자동 재시도 금지. OAuth 발급·갱신은 하지 않는다. 페이지 토큰 순환/과다 페이지 차단. 허용 호스트와 video ID 검증. 현재 공개 URL 가져오기는 공식 iframe이 제공한 곡 ID를 사용하며 API 키를 사용하지 않는다.

## 검증

- 빠른 회귀: `npm test -- src/__test__/youtube.test.ts`
- 제출 전: `npm run check`
- 검증 공백: 비공개 목록 조회는 지원하지 않는다. 실제 API 할당량은 mock 응답으로 증명되지 않는다.
- UI 변경은 관련 Storybook 또는 fixture 화면으로 확인하고 실제 확인하지 못한 항목은 보고한다.

## 완료 보고

변경한 계약, 영향을 받는 소비자, 실행한 테스트와 결과, 미검증 항목을 적는다. 새 공개 함수나 의존 관계를 만들면 이 README도 갱신한다.

[전체 구조](../../../docs/ARCHITECTURE.md) · [작업 시작 지도](../../../docs/CHANGE-GUIDE.md)

## 저장과 초기화

가져오기 저장은 완료까지 기다리고 입력/미리보기/취소를 잠그며 중복 제출을 막는다. 실패 시 현재 입력과 미리보기를 보존한다. 원본 초기화는 미리보기 후 교체 확인을 한 번 요청한다. 저장 목록 manager의 전체 교체 세대가 바뀌므로 초기화 이전 개별 곡 삭제의 Undo는 기존 편집본을 새 원본에 다시 섞지 않는다.

회귀: `npm test -- src/__test__/playlistImport.test.tsx src/__test__/playlistState.test.tsx`.

## Electric Night 가져오기

`PlaylistImport.scss`가 URL → 공식 미리보기 → 로컬 저장 단계를 표현한다. URL 변경은 이전 preview/저장 후보를 무효화하며 같은 URL도 다시 미리보기할 수 있다. 미리보기 로딩 오류와 저장 오류를 분리하여 iframe polling이 실패한 저장 메시지를 지우지 않는다. 원본 교체는 미리보기 뒤 단일 native 확인 dialog에서만 실행한다. CREATE 성공은 선택적 `onCreated(id)`로 조립 계층에 알린다. 프로토타입 모의 데이터/시계/저장은 제품에 포함하지 않는다.

## 원래 곡 제목

videoMetadata.ts는 공식 https://www.youtube.com/oembed 에서 title/author_name만 사용한다. 응답 HTML은 실행·렌더링하지 않는다. credentials omit, no-referrer, 영상 ID 검증, 중복 제거, 동시 4개, 전체 12초 중단, 오류 자동 재시도 없음. 가져오기 및 이름 없는 개별 영상 추가에서 조회하고 실패는 기존 임시 제목을 보존한다. 저장된 임시 제목은 별도 복구 버튼에서 재시도한다.

2026-10-16 실제 FloP_f-VK_k 응답에서 ‘심규선 ‘Sister’ (Live) | Official Lyric Video’ 제목과 GitHub Pages Origin에 대한 CORS 허용을 확인했다. 모든 영상/목록의 가용성이나 실제 재생을 보장하지 않는다.
