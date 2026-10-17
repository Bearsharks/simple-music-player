# 배포

## 현재 구성

- 서비스: https://loopy.bearsharks.dev/
- 제품 소스 및 기본 브랜치: `main`
- GitHub Pages 게시 브랜치: `gh-pages`, 루트 디렉터리
- 빌드: `VITE_BASE_PATH=/ npm run build`
- 기존 GitHub Pages 주소: https://bearsharks.github.io/simple-music-player/

## 작업과 배포

1. 작업 브랜치는 진행 중인 변경에만 사용한다. 검수가 끝난 최신 앱 코드는 `main`에 통합한다.
2. `main`에서 `npm ci`, `npm run check`와 관련 브라우저 검사를 통과시킨다. CI는 검증만 하며 자동 배포하지 않는다.
3. 배포 승인 범위에서 검증한 `main` 커밋을 루트 경로로 빌드한다.
4. `gh-pages`의 최신 상태를 가져온 뒤 `CNAME`을 보존하여 빌드 산출물을 게시한다. `release.json`에 빌드의 소스 SHA를 기록한다.
5. Pages 실행 결과, 실제 도메인의 `release.json`, 정적 리소스와 변경 화면을 확인한다. 완료되지 않은 배포를 완료로 보고하지 않는다.

확장 배포는 manifest 버전과 같은 `vX.Y.Z` GitHub Release에 `artifacts/loopy-extension.zip`을 게시한다. 운영 ZIP은 앱 탐색·메시지 출처·권한 모두 운영 도메인으로 제한한다. `npm run build`는 웹 다운로드 경로에도 운영 ZIP을 포함한다. ZIP 내부 텍스트의 로컬 주소 부재와 개발/운영 설정 분리는 패키징 회귀 검사에서 검증한다. `e2e/extension-import.mjs`의 `TEST_URL=https://loopy.bearsharks.dev/`, `APP_PROXY_URL=http://127.0.0.1:<preview-port>` 조합으로 운영 출처에 로컬 빌드를 제공하여 운영 ZIP 전달과 로컬 미선택을 게시 전에 검증할 수 있다.

`gh-pages`는 게시 산출물용이다. 앱 원본을 작업 브랜치에만 남겨두는 용도로 사용하지 않는다. 브랜치 통합만으로 기존 배포를 다시 게시할 필요는 없다.

## 도메인과 저장 데이터

Cloudflare DNS 설정은 사용자가 관리한다. 도메인이나 인증 설정을 임의로 변경하지 않는다. 배포 시 `loopy.bearsharks.dev`의 CNAME과 HTTPS 설정을 보존한다.

재생목록은 브라우저의 origin별 IndexedDB에 저장된다. 주소를 바꾸면 자동으로 이전되지 않으므로 목록 내보내기와 백업 가져오기를 사용한다.
