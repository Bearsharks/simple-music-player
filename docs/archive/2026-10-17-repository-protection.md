# 저장소 보호와 배포 신원

기준 소스: `f338325d364a9354d8448ff0a3f74df78a96d6c7`.

## 결정

- 잘못 연결된 배포 작성자는 향후 커밋부터 공식 Actions 봇으로 교정한다. 과거 배포 이력은 재작성하지 않는다.
- main은 관리자 우회 없이 PR과 최신 main 기준 CI를 요구한다. 개인 유지보수가 가능하도록 타인의 승인은 필수로 두지 않되 리뷰 대화는 해결해야 한다.
- Actions 기본 권한은 읽기 전용으로 하고 PR 승인 권한은 주지 않는다. 검증과 게시 runner를 분리해 빌드·테스트 의존성에 게시 토큰을 노출하지 않는다.
- gh-pages는 배포의 fast-forward push를 유지하되 강제 푸시와 삭제를 금지한다.

## 검증과 제한

- GitHub API로 main 보호 규칙, gh-pages 이력 보호 규칙과 Actions 기본 권한 변경을 적용하고 읽어 확인했다.
- Actions만 gh-pages를 갱신하도록 하는 추가 규칙은 GitHub가 integration bypass를 허용하지 않아 HTTP 422로 거부했다. 배포를 막는 대체 규칙은 적용하지 않았다. 기존 쓰기 권한 계정의 일반 gh-pages push는 여전히 가능하다.
- Node 24.22.0에서 배포 도구 테스트 통과, actionlint 1.7.12로 변경 workflow 검사 통과(shellcheck 제외).
- 운영 게시와 과거 커밋 재작성은 이번 변경의 검증 범위가 아니다. CI 실행 결과의 원본은 변경 PR과 Actions 실행 기록이다.
