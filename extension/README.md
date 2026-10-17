# loopy 담기

Chrome/Edge Manifest V3 확장 프로그램. 영상·재생목록의 종류와 ID만 Loopy에 전달한다. 조회·목록 펼치기는 Loopy가 담당한다.

## 설치

Loopy 검색창 옆 **확장 프로그램 다운로드**에서 확장 전용 ZIP을 내려받아 압축을 푼다. 확장 관리의 개발자 모드에서 `loopy-extension` 폴더를 선택한다. 연결이 확인되면 앱의 다운로드 버튼은 숨겨진다. 확장 패널은 자신의 버전과 GitHub 최신 릴리스를 비교해 새 버전이 있을 때 **업데이트** 링크를 제공한다. ZIP으로 파일을 교체한 후 확장과 열린 YouTube/Loopy 페이지를 새로고침한다.

## ZIP 패키지

`npm run package:extension`은 개발용 `public/downloads/loopy-extension.zip`을 만든다. npm dev/start 전에 자동 실행한다. 명시적인 실행 파일 10개만 `loopy-extension/` 아래에 포함하며 테스트·전체 앱 코드·환경 파일·개인 경로는 포함하지 않는다. ZIP의 파일 순서·타임스탬프는 고정되어 같은 입력에서 동일한 패키지가 생성된다. 공개 manifest key를 유지하므로 압축해제 설치의 확장 ID도 같다.

- 개발 서버의 다운로드는 `<BASE_URL>downloads/loopy-extension.zip`으로 현재 생성한 파일을 제공한다. 서버 실행 중 확장 파일을 수정했다면 `npm run package:extension`으로 갱신한다.
- 개발 ZIP은 config.js와 manifest에 로컬 주소·권한을 추가한다. 기본 주소는 `http://127.0.0.1:4187/simple-music-player/`다. `npm run package:extension:release` 및 npm build는 운영 전용 ZIP을 `artifacts/loopy-extension.zip`과 `public/downloads/loopy-extension.zip`에 생성한다. 따라서 빌드 결과의 ZIP도 운영 전용이다. 빌드 후 개발 ZIP이 필요하면 개발 패키징을 다시 실행한다.
- 제품 빌드의 다운로드는 `https://github.com/Bearsharks/loop-yt-player/releases/latest/download/loopy-extension.zip`을 사용한다. 게시된 GitHub Release에 정확히 이 이름의 asset이 있어야 한다.
- 배포는 검증된 main 커밋에서 `npm run check` 후 생성된 ZIP을 사용하고 해당 SHA를 Release에 기록한다. ZIP 생성은 업로드나 Release 게시를 수행하지 않는다. GitHub 게시 전에는 제품 다운로드 경로가 준비되지 않은 상태다.
- 검증: `node --test tools/package-extension.check.mjs`. 브라우저 전달 테스트는 `EXTENSION_DIR`에 압축해제한 폴더를 지정해 패키지 자체로 실행할 수 있다.

## 로컬 개발

1. `npm run dev -- --host 127.0.0.1 --port 4187 --strictPort`로 앱을 실행한다.
2. 개발용 ZIP을 압축해제하고 `chrome://extensions`(Edge: `edge://extensions`)의 개발자 모드에서 **압축해제된 확장 프로그램을 로드**로 `loopy-extension` 폴더를 선택한다. 저장소의 `extension` 원본을 직접 로드하면 기본 새 탭 주소는 배포 사이트다.
3. `http://127.0.0.1:4187/simple-music-player/`를 열거나 새로고침한다.
4. 앱에서 검색하면 YouTube가 새 탭으로 열린다. 이미 열려 있던 YouTube는 새로고침한다.
5. 썸네일 왼쪽 바깥의 작은 **+** 아이콘, 현재 페이지의 **영상 담기** 또는 **목록 담기**를 누른다. + 아이콘의 윗선은 썸네일 윗선에 맞추며 별도의 고정 레이어에서 스크롤·크기 변경을 따라간다. 담기만 수행하며 영상 링크로 이동하지 않는다.
6. **연동하기**를 누르면 YouTube 페이지 오른쪽에 담은 목록 패널이 열린다. 닫기·Escape·배경 클릭으로 닫는다. 확장 아이콘에서도 같은 목록을 볼 수 있다. 담은 항목을 확인하고 **저장**을 누른다.
7. 저장 시 현재 열린 Loopy 탭을 조회한다. 패키지의 기본 앱 출처를 우선하고, 해당 출처 안에서는 최근 사용한 탭 하나를 선택해 포커스한다. 기존 URL·입력·재생 상태는 변경하지 않는다. 열린 앱이 없으면 config.js의 고정 앱 주소로 새 탭을 연다. 선택한 탭만 수신할 수 있으며 수신 확인 후 이번에 보낸 항목만 비운다. 전송 중 새로 담은 항목은 남는다.

패널의 **Loopy로 이동**은 담은 항목 유무와 무관하게 같은 탭 선택 규칙으로 앱만 연다. `app.open`은 확장 popup에서만 허용하고 임의 URL을 받지 않는다. 담은 항목·전달 요청·수신 상태는 바꾸지 않으며 기존 앱 탭을 새로고침하지 않는다.

확장 코드 수정 후 확장 관리 화면과 YouTube/Loopy 탭을 새로고침한다. 모바일 Chrome은 확장 설치를 지원하지 않으며 Loopy의 새 재생목록 URL 입력·편집은 모바일에서도 사용 가능하다.

## 계약 및 권한

```json
{"type":"loopy.import","version":1,"requestId":"UUID","items":[{"kind":"video","id":"azNG-AU0eGg"},{"kind":"playlist","id":"PLVKdYxm17gBYbyZYbHWZDr7NU3ZwtFiB5"}]}
```

- `protocol.js`가 앱과 확장의 검증을 공유한다. 추가 필드·임의 URL·HTML은 거부한다. 최대 100개 입력, 순서와 반복 항목 보존.
- manifest의 key는 공개 식별 키다. 압축해제 로드 ID는 `lpkemppmemlhcggfjcdimmcpfbdjgfdb`. 스토어 배포는 별도 승인·서명·실제 배포 ID 계약 변경이 필요하다.
- 앱이 고정 확장 ID로 `loopy.pull`을 호출하고 수용한 requestId에 `loopy.ack`로 응답한다. ACK는 저장 완료가 아니다.
- 운영 패키지의 허용 앱·탭 검색·새 탭 주소는 `https://loopy.bearsharks.dev/`뿐이다. 개발 패키지만 로컬 127.0.0.1/localhost의 4187·5173 포트 `/simple-music-player/` 경로를 추가한다. 최상위 frame만 허용한다. manifest의 포트 지정 한계를 서비스 워커의 정확한 URL 검사로 보완한다.
- 기존 탭 검색을 위해 위 앱 호스트만 host_permissions에 선언한다. 전체 탭의 URL을 읽는 tabs 권한은 요청하지 않는다. 메시지는 실제 sender.tab.id와 이번 전송의 대상 탭 ID가 같아야 전달·ACK 처리한다. 다른 탭의 ACK는 목록을 비우지 않는다.
- YouTube content script 및 확장 popup에서만 내부 명령을 받는다. 쿠키·방문 기록·다운로드·전역 CORS 변경 권한은 요구하지 않는다. 확장의 네트워크는 업데이트 확인용 api.github.com만 허용하며 원격 스크립트 실행은 허용하지 않는다.
- 페이지 패널은 Shadow DOM의 native dialog와 확장 출처 iframe으로 구성한다. YouTube에 공개하는 확장 리소스는 popup.html 하나이며 목록·저장은 확장 출처에서 실행한다. 패널 닫기 메시지는 확장 출처와 해당 iframe source를 함께 확인한다. 웹페이지 메시지로 담기·전송은 받지 않는다. iframe 내부 Escape도 닫기로 연결하며 닫은 뒤 연동하기 버튼에 초점을 돌린다.
- 담은 항목은 storage.local에 고유한 내부 key와 함께 저장해 브라우저 재시작 후에도 유지한다. 내부 key는 Loopy에 전송하지 않는다. ACK 시 보낸 key만 제거하여 같은 영상이라도 나중에 담은 항목은 보존한다. ACK는 모달 수용이지 재생목록 저장이 아니므로 수신 후 Loopy에서 취소·탭 종료하면 해당 편집본은 잃을 수 있다.
- 담을 때 화면에서 읽은 제목과 대표 영상 ID를 표시용 메타데이터로 local에 보관한다. 제목은 길이·제어문자를 정리하고 textContent로만 표시한다. 썸네일은 검증된 영상 ID로 i.ytimg.com 주소를 생성하며 임의 이미지 URL을 저장하지 않는다. 영상은 자신의 ID, 재생목록은 화면의 대표 썸네일에서 얻은 영상 ID를 사용한다. 화면에서 다시 발견한 기존 항목도 보완한다. 제목을 알 수 없는 항목은 ID를 보조 표시하며 추정 제목을 만들지 않는다. 이 메타데이터는 Loopy 전달 페이로드에 포함하지 않는다.
- 이번 전송 대상·요청은 storage.session에서 최대 30초 유지하며 브라우저 재시작 시 사라진다. 탭 선택은 저장할 때마다 다시 수행한다. 실패·시간 초과·재시작 시 미수신 항목은 local에 남고 사용자가 다시 저장할 수 있다. 저장 요청은 2초 간격 제한이며 오래된 ACK는 새 전송을 처리하지 않는다.
- YouTube DOM 변경 시 검색 결과 선택자를 수정해야 할 수 있다. 현재 URL 기반 담기는 독립 경로다. iframe 결과는 원본 전체를 보장하지 않는다. 약관·운영 제한은 별도다.

## 업데이트

툴바 팝업은 400px 고정 너비를 사용한다. YouTube 내부 패널에서는 `.embedded` 모드로 부모 너비를 따른다.

YouTube 도구 모음의 ×는 담기 UI와 열린 패널을 숨긴다. `youtubeUiVisible`을 storage.local에 보관하므로 새로고침·브라우저 재시작 후에도 유지하고 열린 YouTube 탭에 동기화한다. 담은 항목과 전달 상태는 바꾸지 않는다. 툴바 팝업의 **YouTube 담기 UI** 체크박스로 다시 표시할 수 있다. Loopy 검색은 `/results?search_query=…&loopy=1`로 열며 content script가 표시 설정을 켜고 `loopy` 매개변수만 제거한다. 이 표시는 UI 활성화 신호이며 담기·전달 권한을 부여하지 않는다. 일반 YouTube 탐색은 숨김 설정을 유지한다.

패널을 열 때 `updates.js`가 GitHub `/repos/Bearsharks/loop-yt-player/releases/latest`를 익명 조회한다. manifest.version보다 높은 숫자 버전의 공개 릴리스(`v0.3.0` 또는 `0.3.0` 형식)와 `loopy-extension.zip` asset이 있을 때만 해당 태그의 고정 GitHub 다운로드 링크를 표시한다. 자격 증명은 보내지 않으며 반환된 임의 다운로드 URL은 사용하지 않는다. 8초 제한, 성공 결과는 브라우저 세션에서 1시간 재사용한다. 조회 실패 시 담기·전달은 계속 가능하며 최신 버전이라고 표시하지 않는다. 미게시·초안·사전 릴리스는 업데이트 대상으로 안내하지 않는다. 앱은 연결 여부만 검사한다.

## 검증

- `node --test extension/background.check.mjs`
- `node --test extension/updates.check.mjs`
- `npm test -- src/__test__/extension-import.test.tsx src/__test__/extension-import-ui.test.tsx`
- `node e2e/extension-import.mjs`: 격리 프로필의 실제 확장, YouTube fixture, 실제 IndexedDB
- 이 통합 테스트는 페이지 패널의 Escape·초점 복귀, 썸네일 아이콘 위치, 기존 탭 무이동 재사용, 여러 탭 중 단일 수신, 탭이 없을 때 생성, 수신 후 비우기, 실제 브라우저 종료·재시작 후 미전송 목록 보존까지 확인한다.
- `node e2e/extension-import-live.mjs`: 실제 공개 목록, 별도 프로필, 저장 없음
- `node e2e/extension-install.mjs`: GitHub 설치 안내 및 연결 감지 UI, 연결 응답은 mock

`CHROMIUM_PATH`, `TEST_URL`, `IMPORT_REPORT_DIR`로 브라우저·허용 앱 URL·증거 경로를 지정한다. 다른 사용자의 브라우저 프로필은 사용하지 않는다.
