# Feature architecture

## 현재 제품 경로

`src/main.tsx` → `src/app/App.tsx` → `src/features/library/ui/LocalLibrary.tsx`

사용자가 공개 YouTube 재생목록 URL을 입력하면 library 모델이 검증·정규화하고 localStorage에 저장한다. 선택한 목록은 공식 YouTube iframe으로 재생한다. 앱 로그인, 자체 백엔드, API 키는 이 경로에 필요 없다.

- library: URL 목록, 저장, 선택과 임베드 UI. [작업 안내](../src/features/library/README.md)
- app: 시작점·오류 경계
- shared: 공통 타입·재사용 UI·보존된 편집 모듈용 로컬 저장 어댑터

## 보존된 편집 모듈

playlists/queue/player/search/youtube/overlays/navigation은 이전 앱의 기능별 분리 결과를 보존한다. 현재 App에는 연결하지 않는다. 이후 개별 곡 편집을 복원할 때 재사용할 수 있으나, 이 모듈의 동작을 현재 URL 라이브러리 기능으로 홍보하지 않는다.

서버 어댑터와 auth 기능, OAuth 토큰 갱신, 내 비공개 YouTube 목록 가져오기는 제거했다. 보존된 편집 모듈의 API 선택기는 로컬 CRUD 또는 테스트 fixture만 사용한다. 선택적 YouTube 메타데이터 어댑터는 공개 API 키만 지원하며, 기본 제품에서는 호출되지 않는다.

## 계약과 한계

- React + Vite 클라이언트 앱. 서버 런타임 불필요.
- localStorage는 origin별 저장이다. 호스팅 주소가 바뀌면 자동 이전되지 않는다.
- URL 저장은 곡 목록 스냅샷 가져오기와 다르다. 원본 변경은 YouTube가 iframe에서 불러오는 시점에 반영한다.
- 실제 계정·과거 서버 데이터는 읽거나 삭제하지 않는다.
- 전환 전 코드와 설계는 Git 기록에 남는다.
- `npm run check`는 타입/경계/단위·UI 테스트/빌드다. 실재생·배포·실기기 검증은 별도다.
