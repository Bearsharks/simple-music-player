# v0.3.0 검증·배포 기록

- 소스: `b0e11ababb03d8d73fbeb2204a7e46d01986e835`
- Pages: `4a62a06dcfa5b79f6971a244cb927586ebae9261`
- [게시 없는 실행](https://github.com/Bearsharks/loop-yt-player/actions/runs/39011726317)
- [배포 실행](https://github.com/Bearsharks/loop-yt-player/actions/runs/39011950558)
- [확장 릴리스](https://github.com/Bearsharks/loop-yt-player/releases/tag/v0.3.0)

고정 Node에서 두 빌드의 파일 해시 일치, 단위·브라우저 검사, 봉인된 artifact 게시, 운영124개 파일 해시 확인을 통과했다. 운영 출처의 패키지 검증에서 기존/새 탭 전달, 대상 탭 ACK, 편집 유지, UI 표시 설정, Loopy 이동을 확인했다.

연결 확인은 앱 시작·명시적 확인, 목록 수신은 저장 알림에 반응한다. URL 검증과 가져오기 UI는 YouTube 기능이 소유하고, 실제 App 진입점에서 검증한다.

실제 YouTube 검사는 별도 프로필에서 수행했다. iframe의 재생 상태와 공개 목록 조회를 확인했으며 원본 전체 수집·실제 소리 출력·물리 장치 지원을 보장하지 않는다. 다중 탭 저장 경쟁과 전역 플레이어 결합은 구조 검토의 후속 검증 대상이다.
