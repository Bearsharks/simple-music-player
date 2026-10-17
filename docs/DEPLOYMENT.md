# 배포

## 고정 계약

- 운영 주소: https://loopy.bearsharks.dev/
- 소스: `main`의 전체40자리 SHA. 지정 SHA가 현재 main과 같아야 게시한다.
- GitHub 저장소: `Bearsharks/loop-yt-player`
- Pages: `gh-pages` 루트, CNAME `loopy.bearsharks.dev`, `.nojekyll`.
- Node: `.node-version`의 정확한 버전. 패키지는 `npm ci`와 package-lock.json으로 고정한다.
- 운영 확장의 탭 검색·메시지 출처·권한은 운영 도메인만 허용한다.

## 승인 후 실행

GitHub Actions의 **Release**를 `main`에서 수동 실행하고 `source_sha`에 전체 SHA를 입력한다.

```sh
gh workflow run release.yml --repo Bearsharks/loop-yt-player --ref main -f source_sha=<40자리-SHA> -f publish=true
```

1. 지정 SHA와 main 일치 확인, 고정 Node, npm ci.
2. 루트 경로의 `npm run check`를 실행한다. 두 번 빌드한 전체 파일 hash manifest가 같아야 다음 단계로 진행한다.
3. dist를 `release:seal`로 봉인한다. `release.json`은 source SHA, 확장 버전, Node, lockfile hash, 모든 정적 파일의 SHA-256을 기록하며 시간 값은 넣지 않는다. 이 바이트로 브라우저 회귀와 실제 운영 ZIP의 메시지를 검증하고 manifest를 재확인한다. 외부 YouTube 응답은 결정된 fixture를 사용한다.
4. dist를 SHA 이름의 Actions artifact로 보관한다. 게시 단계는 이 디렉터리를 그대로 사용하며 재빌드하지 않는다.
5. `release:publish`가 깨끗한 소스, main SHA, manifest의 전체 파일 집합, 운영 ZIP 원본 바이트, Pages 설정을 재검증한다.
6. manifest 버전의 `vX.Y.Z` 릴리스와 확장 ZIP을 게시한다. 같은 태그가 다른 커밋/바이트를 가리키면 중단한다. 같은 SHA·바이트의 재실행은 허용한다.
7. gh-pages 최신 커밋 위에 산출물을 게시한다. force push하지 않는다. Actions token 게시 후에는 Pages build를 명시적으로 요청한다.
8. 해당 gh-pages 커밋의 build 성공과 운영 manifest·모든 파일의 hash 일치를 확인해야 성공한다.

릴리스 작업은 직렬화한다. 중간 실패 시 같은 main SHA·같은 artifact로 다시 실행할 수 있다. 새 코드로 같은 확장 버전을 재사용하지 않는다. GitHub Release와 Pages는 하나의 원자적 transaction이 아니며 부분 게시가 가능하다. 이때 성공으로 보고하지 않고 실패 지점을 확인한 뒤 동일 입력으로 재실행한다. 임의 롤백·태그 이동·기존 asset 덮어쓰기는 하지 않는다.

## 로컬 사전 확인

`publish=false`(기본값)로 Release를 실행하면 동일한 검사·재현성 검증·artifact 보관까지 수행하고 운영은 변경하지 않는다.

```sh
npm ci
npm run check
VITE_BASE_PATH=/ npm run build
npm run release:seal
npm run release:verify
```

seal은 커밋된 깨끗한 소스와 지정 Node를 요구한다. `release:verify`는 네트워크·게시 없이 파일 무결성을 검사한다. 배포 승인이 있을 때만 publish를 실행한다. 검증: `node --test tools/release.check.mjs tools/package-extension.check.mjs`.

배포 재현성의 범위는 고정 소스·lockfile·Node·Ubuntu24.04에서 생성하는 파일 바이트와 검증 절차다. GitHub 호스팅 서비스와 runner 이미지까지 완전히 고정된 실행 환경은 아니다. 실제 YouTube 재생은 별도 live 검사이며 fixture 통과로 대체하지 않는다.

개발 ZIP은 `npm run package:extension`, 운영 ZIP은 `npm run package:extension:release`로 만든다. npm build는 웹 다운로드 경로에도 운영 ZIP을 포함한다. 로컬 빌드를 운영 출처로 검증하려면 `e2e/extension-import.mjs`의 `TEST_URL=https://loopy.bearsharks.dev/`, `APP_PROXY_URL=http://127.0.0.1:<preview-port>`를 사용한다.

## 데이터와 권한

DNS·계정 권한·Pages source 설정은 자동 변경하지 않는다. 재생목록은 origin별 IndexedDB에 저장되며 도메인을 변경하면 자동 이전되지 않는다. 소스 구조·배포 절차 변경으로 DB 이름·키·스키마를 바꾸지 않는다.
