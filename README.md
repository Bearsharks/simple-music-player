<p align="center">
  <a href="https://loopy.bearsharks.dev/">
    <img src="docs/readme/hero.jpg" width="100%" alt="loopy — 좋아하는 음악을, 나만의 흐름으로. 데스크톱과 모바일의 실제 라이브러리 화면.">
  </a>
</p>

<p align="center">
  <a href="https://loopy.bearsharks.dev/"><strong>loopy 시작하기 ↗</strong></a>
  &nbsp; · &nbsp;
  <a href="#첫-재생목록-만들기">사용 방법</a>
  &nbsp; · &nbsp;
  <a href="#개발하기">개발 안내</a>
</p>

<br>

## 취향은 모으고, 순서는 내 마음대로.

이름과 설명을 붙이고 곡을 더하거나 빼고 옮기며, 나만의 목록으로 다듬어 보세요.

| 모으기 | 정리하기 | 이어 듣기 |
| :--- | :--- | :--- |
| 공개 재생목록과 영상 URL에서 시작하세요. 가능한 곡은 원래 제목도 불러옵니다. | 이름·설명·곡 순서까지. 드래그한 순서는 바로 저장됩니다. | 저장한 목록과 오늘의 대기열을 따로 편집하며 듣습니다. |

<br>

<a href="https://loopy.bearsharks.dev/">
  <img src="docs/readme/workspace.jpg" width="100%" alt="Blue hour 예시 재생목록의 실제 상세 화면. 전체 재생, 곡 추가, 드래그 순서 변경, 곡별 더보기를 제공합니다.">
</a>

### 내 브라우저에 저장합니다.
유튜브 연동도 로그인도 필요없습니다. 목록과 곡 정보는 브라우저에 저장됩니다.

<br>

## 첫 재생목록 만들기

1. **[loopy 열기](https://loopy.bearsharks.dev/)** → **새 재생목록**을 선택합니다.
2. 이름을 붙여 빈 목록을 만들거나, **유튜브에서 가져오기**에 공개 재생목록 URL을 붙여 넣습니다. URL 입력을 마치면 목록을 불러옵니다.
3. **곡 추가**로 원하는 영상을 더하고 **전체 재생**으로 듣기를 시작하세요.

<details>
<summary><strong>저장과 재생에 대해 알아두기</strong></summary>

- 계정이나 기기 간 자동 동기화는 없습니다. 가져온 재생목록의 스냅샷을 저장합니다.
- 음악 파일을 저장하거나 다운로드하지 않습니다. 재생은 YouTube 공식 임베드를 사용합니다.

</details>

<br>

## 개발하기

현재 서비스의 소스는 **[`main`](https://github.com/Bearsharks/simple-music-player/tree/main)** 브랜치에 있습니다.

**React 19 · TypeScript · Vite 8 · Jotai · IndexedDB · shadcn/ui + Radix**

Node.js 24에서 시작합니다. 기본 사용에는 별도 백엔드, 로그인, API 키 설정이 필요하지 않습니다.

```bash
git clone --branch main https://github.com/Bearsharks/simple-music-player.git
cd simple-music-player
nvm use
npm ci
npm run dev
```

개발 주소: `http://localhost:5173/simple-music-player/`

```bash
npm run check             # 기능 경계 · 타입 · 단위 테스트 · 프로덕션 빌드
npm run storybook         # 공통 UI와 상태별 컴포넌트
VITE_BASE_PATH=/ npm run build  # 루트 도메인용 빌드
```

[아키텍처](https://github.com/Bearsharks/simple-music-player/blob/main/docs/ARCHITECTURE.md) · [기능별 작업 지도](https://github.com/Bearsharks/simple-music-player/blob/main/docs/CHANGE-GUIDE.md) · [디자인 시스템](https://github.com/Bearsharks/simple-music-player/blob/main/DESIGN_SYSTEM.md)

<br>
