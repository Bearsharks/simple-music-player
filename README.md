<p align="center">
  <a href="https://loopy.bearsharks.dev/">
    <img src="docs/readme/hero.jpg" width="100%" alt="loopy — 좋아하는 음악을, 나만의 흐름으로. 데스크톱과 모바일 라이브러리 화면.">
  </a>
</p>

<p align="center"><sub>예시 재생목록으로 구성한 화면</sub></p>

<p align="center">
  <strong>YouTube 재생목록을 가져와 편집하고 듣는 웹 플레이어.</strong><br>
  로그인 없이 바로 사용할 수 있습니다.
</p>

<p align="center"><a href="https://loopy.bearsharks.dev/"><strong>loopy 열기 ↗</strong></a></p>

## 재생목록 편집

공개 YouTube 재생목록을 가져오거나 영상 URL로 곡을 추가하세요. 목록 이름과 설명을 바꾸고, 곡을 더하거나 삭제할 수 있습니다. 드래그로 바꾼 순서는 바로 저장됩니다.

<img src="docs/readme/workspace.jpg" width="100%" alt="Blue hour 재생목록 상세. 전체 재생, 곡 추가, 순서 변경, 곡별 더보기.">

## 원본 목록 관리

- **YouTube 최신 목록 가져오기**: 원본의 현재 곡 구성을 불러와 확인한 뒤 교체합니다.
- **처음 가져온 목록으로 복원**: 최초 기록이 있는 목록을 처음 가져온 곡과 순서로 되돌립니다.

## 사용 방법

1. **새 재생목록**을 엽니다.
2. 이름을 붙여 만든 뒤 **곡 추가**에 영상 URL을 넣습니다. 기존 목록을 가져오려면 **유튜브에서 가져오기**에 공개 재생목록 URL을 입력하세요.
3. **전체 재생**을 누릅니다. 하단 재생바에서 현재 곡과 대기열을 열 수 있습니다.

## 저장과 백업

목록은 현재 브라우저에 저장되며 다른 기기와 자동 동기화되지 않습니다. 라이브러리 더보기의 **목록 내보내기 / 백업 가져오기**로 보관하거나 옮길 수 있습니다. 사이트 데이터를 지우거나 브라우저·접속 주소를 바꾸기 전에 백업하세요.

## 개발하기

현재 제품 코드는 **[`design/shadcn-ui`](https://github.com/Bearsharks/simple-music-player/tree/design/shadcn-ui)** 브랜치에 있습니다.

React 19 · TypeScript · Vite 8 · Jotai · IndexedDB · shadcn/ui + Radix

Node.js 24가 필요합니다. 별도 백엔드나 API 키 설정 없이 실행할 수 있습니다.

```bash
git clone --branch design/shadcn-ui https://github.com/Bearsharks/simple-music-player.git
cd simple-music-player
nvm use
npm ci
npm run dev
```

개발 주소: `http://localhost:5173/simple-music-player/`

```bash
npm run check                  # 경계 · 타입 · 테스트 · 빌드
npm run storybook              # UI 컴포넌트
VITE_BASE_PATH=/ npm run build # 루트 도메인용 빌드
```

[아키텍처](https://github.com/Bearsharks/simple-music-player/blob/design/shadcn-ui/docs/ARCHITECTURE.md) · [기능별 작업 지도](https://github.com/Bearsharks/simple-music-player/blob/design/shadcn-ui/docs/CHANGE-GUIDE.md) · [디자인 시스템](https://github.com/Bearsharks/simple-music-player/blob/design/shadcn-ui/DESIGN_SYSTEM.md)
