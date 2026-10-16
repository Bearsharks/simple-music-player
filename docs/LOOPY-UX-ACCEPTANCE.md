# loopy UX 보완 인수 — 2026-10-16

## 반영한 사용자 피드백

- 저장 목록·대기열의 상시 조작 설명과 중복 저장 위치 안내 제거.
- 제목/설명 입력에서 드래그를 시작해 모달 밖에서 놓아도 폼 유지. 시작·끝이 모두 backdrop인 클릭만 닫음.
- 저장 목록과 대기열은 별도 편집 모드 없이 핸들 드래그. Space/방향키/Space 키보드 정렬도 지원.
- 저장 목록 순서는 놓으면 즉시 IndexedDB 저장. 실패 시 기존 순서 유지, 오류 토스트.
- 가져올 때 YouTube 공개 oEmbed 제목/채널명 조회. 기존 임시 제목은 ‘원래 곡 제목 가져오기’로 복구. 수동 이름·곡 순서·삭제를 보존.
- 새 제품 이름 loopy, loopy.bearsharks.dev용 루트 경로 빌드.
- 백업 JSON 내보내기와 확인 후 추가 가져오기. 기존 origin 데이터는 자동 이전하지 않음. 사용자는 백업 대기 없이 도메인 전환 승인.

## 검증

- 소스 기능 커밋: 868d1e2; 루트 배포 검사 추가: 912d8d8.
- 로컬 106개 테스트, 타입 검사, 모듈 경계 검사, 빌드 통과.
- GitHub Actions 38892307008: Chromium 320/390/768/1024/1280/1440 화면, 폼 상태 보존, 실제 포인터·키보드 정렬, 실패 토스트와 재시도, 모달 밖 release, iframe 유지 통과.
- GitHub Actions 38892493520: 위 검사 및 custom-domain 루트 빌드 persistence smoke 통과.
- 실제 YouTube FloP_f-VK_k 공개 응답: ‘심규선 ‘Sister’ (Live) | Official Lyric Video’, author_name 심규선. GitHub origin CORS 헤더 확인. 임의 third-party proxy/로그인/API 키 사용 없음.
- 브라우저 이미지 검수: 모바일 상세/데스크톱 라이브러리의 핸들, 간결한 안내, loopy 명칭, 넘침 없음 확인.
- 첫 Chromium 검사에서 버튼 핸들이 DnD의 interactive-element 보호로 시작되지 않음을 발견. 핸들에만 dragHandleProps를 두고 disableInteractiveElementBlocking으로 해결; 재검사 통과.

## 판정 범위

브라우저 재생은 명시적인 모의 미디어로 검증했다. 실제 YouTube 오디오, 실제 휴대전화/Safari, 모든 영상의 메타데이터 가용성, 전체 접근성 인증은 별도다. oEmbed가 실패하면 임시 제목을 유지하고 재시도할 수 있다. 도메인 DNS/인증서/배포는 별도로 확인하며 CI 통과로 HTTPS 발급 완료를 주장하지 않는다.
