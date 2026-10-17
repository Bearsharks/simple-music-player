# loopy 확장

## 설치·업데이트

1. [최신 ZIP](https://github.com/Bearsharks/loop-yt-player/releases/latest/download/loopy-extension.zip)을 내려받아 압축을 풉니다.
2. Chrome 확장 관리에서 개발자 모드를 켜고 `loopy-extension` 폴더를 불러옵니다.
3. 업데이트는 기존 폴더에 덮어쓴 뒤 확장을 새로고침합니다. 열린 YouTube·Loopy 탭도 새로고침합니다.

## 코드 인덱스

- [권한과 진입점](manifest.json) · [출처 설정](config.js)
- [상태·전달](background.js) · [입력 계약](protocol.js) · [앱 알림](app-bridge.js)
- [YouTube UI](content.js) · [확장 패널](popup.js) · [업데이트 확인](updates.js)
- [패키징](../tools/package-extension.mjs) · [실행·검사](../package.json)

[보안·제품 정책](../docs/canonical/policies.md) · [작업·배포 절차](../docs/canonical/workflow.md)
