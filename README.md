# Simple Music Player — 로컬 URL 재생목록

현재 앱은 로그인 없이 공개 YouTube 재생목록 URL과 이름을 브라우저에 저장하고 공식 임베드로 재생합니다. 자체 서버/API 키 설정 없이 `npm ci && npm run dev`로 시작합니다. `npm run check`로 검사합니다.

저장되는 것은 링크이며 곡 파일이나 전체 메타데이터 복사본이 아닙니다. 사이트 데이터 삭제·주소 변경·다른 기기에는 자동 이전되지 않습니다. [현재 구조](docs/ARCHITECTURE.md), [작업 지도](docs/CHANGE-GUIDE.md), [변경 보고](docs/LOCAL-PLAYLISTS.md).

## 이전 버전 기록 (현재 동작 설명 아님)

# 개발 안내 — 기능 단위 구조 / 2026-10-16

- Node.js 24 (`nvm use`), `npm ci`
- `.env.example`을 `.env.local`로 복사한 뒤 `VITE_API_URL`을 설정합니다. 기존 `REACT_APP_*` 변수는 새 Vite 앱에서 자동 사용하지 않습니다.
- 백엔드 없는 **검증용 화면**: `VITE_API_MODE=fixture npm run dev`. fixture는 메모리 데이터이며 실제 YouTube 인증/저장/동기화를 제공하지 않습니다.
- 개발: `npm run dev`, 기본 경로 `/simple-music-player/`
- 검증: `npm run check` (경계·타입·테스트·production build)
- UI 카탈로그: `npm run storybook`, 정적 빌드: `npm run build-storybook`
- 산출물: `dist/`. 빌드·테스트 CI는 배포하지 않습니다. 실제 게시 작업은 별도로 승인·설정합니다.

문서: [아키텍처](docs/ARCHITECTURE.md) · [디자인/아키텍처/기능별 개선 우선순위와 검증 결과](docs/IMPROVEMENT-PLAN.md) · [에이전트 작업 지침](AGENTS.md)

## 기존 프로젝트 소개

# [간단 노래 재생기](https://bearsharks.github.io/simple-music-player)
유튜브 뮤직 클론 프로젝트로 검색, 재생목록URL, 동영상URL로 재생목록을 만들 수 있는 간단한 뮤직플레이어 입니다. \
**[링크](https://bearsharks.github.io/simple-music-player)**  \
\
<img src="https://user-images.githubusercontent.com/47706141/157233119-8e2f398f-7b3b-4cf6-9df0-7e9884595936.PNG"  width="310"/>
<img src="https://user-images.githubusercontent.com/47706141/157233121-e6e9a433-879a-4c5e-8e67-61cd8f0c65b9.PNG"  width="310" />
<img src="https://user-images.githubusercontent.com/47706141/157233110-afd3260b-6773-4225-8585-635ebf073bda.PNG"  width="310"/>                                                                                                                                         

# 간단 사용법
1. 검색창을 열고 마음에 드는 노래를 입력합니다. 유튜브 재생목록이나 동영상 URL로도 추가 할 수 있습니다.


<img src="https://user-images.githubusercontent.com/47706141/157238072-5a641a91-afea-4d95-96cb-e360fbd32be3.PNG"  width="400"/>      
2. 입력 후 검색버튼을 눌러 노래를 추가합니다.

![추가된것을 확인할수](https://user-images.githubusercontent.com/47706141/157238075-6b2498a2-1ba1-49ae-9cce-6742cdecd26c.PNG)

