# Geist Sans + Pretendard 최종 디자인 인수

2026-10-16 · Astra · 대상 `d7b983f6cb1c4e2e1a8de49829a7843602be55e4`

## 판정

**폰트 청크 인수 가능. 최신 후속 UI와 폰트에 대한 디자인 측 배포 차단 사항 없음.**

사용자가 선택한 Geist Sans+Pretendard가 단순 font-family 선언에 머무르지 않고 실제 self-host custom font로 표시된다. 한글·영문 혼용 제목의 기준선과 굵기가 자연스럽게 이어지며 작은 목록/폼에서도 내용과 조작의 우선순위가 유지된다. 소스와 실제 캡처를 검토했으며, parent CI38907578222의 기능 성공과 별개로 시각 판정을 했다.

## 근거

- 소스: `d7b983f`; `shared/ui/fonts.css`, 전역 `--font`, 앱/Storybook import, official asset/license/provenance, typography harness 읽기.
- 자료: `shadcn-review/fonts-passed`.
- 실제 font evidence: `font-pages-evidence.json`, `font-root-evidence.json`; 양쪽 failures가 빈 배열.
- 직접 확인: Pages 상세7폭320/390/768/1024/1199/1200/1440, library390, form320/390,200%390/1440, blocked-font fallback; root 상세390/1440. 추가 회귀 표본은 picker-existing390와 footer-volume320.
- 구버전 prototype 이미지는 판정 근거에서 제외했다.

## 요구 대조

| 항목 | 확인 결과 |
|---|---|
| Latin Geist, Hangul Pretendard | CDP 혼용 제목의 custom fonts에 `Geist`와 `Pretendard Variable`이 각각 실제 glyphCount>0으로 기록된다. Geist Sans는 CSS family alias이며 binary familyName Geist는 정상이다. |
| 공식 배포본·권리 | Geist1.7.2 normal100–900, Pretendard1.3.9 normal45–920 dynamic subset. OFL/copyright가 production public 경로에 포함되고 원본 URL/hash 기록이 있다. |
| 로딩 | face가 앱 진입점에서 import된다. font-display swap, self-host URL, font-src self 유지. 해당 CI 시나리오에서 font 실패/CSP/decode 오류 없이 같은 origin200. |
| 필요한 문자만 요청 | 해당 테스트 문구는 배포된93개 WOFF2 중10개를 요청한다. 전부 preload하지 않으며 사용자 문자에 따라 요청량은 달라질 수 있다. 기록된 resource encoded-body 합계252,380bytes는 이 시나리오 값이며 모든 사용자 cold-load의 보장값은 아니다. |
| 한영 조판 | 320/390에서 혼용 제목이 자연스러운2행으로 내려간다.768은 제한된 본문 너비에 맞춰2행,1024이상은1행. 긴 곡명·artist는 메뉴와 겹치지 않고 ellipsis 처리된다. |
| 폼/작업 흐름 |320/390 AddVideo 입력·CTA,390 picker 이름/설명/submit에서 clipping 없이 label/value가 분리된다. 주요 조작44px 기준 유지. |
| footer/브랜드 |320 footer의 트랙/재생/음량/큐가 유지된다. wordmark의 Geist 성격이 바뀌었지만 마크·signature CTA 색/역할은 보존된다. |
| 확대/장애 |200% 텍스트 근사에서 주요 헤더/액션/검색/select가 wrap되고 가로 overflow가 없다. font 요청 차단 때도 fallback으로 실제 폼을 읽고 조작할 수 있다. |
| root 배포 경로 |root390/1440 캡처와 glyph evidence가 Pages subpath 결과와 일치한다. |

## 비차단 조판 메모

`font-pages-text200-1440.png`에서 sidebar wordmark가 고정 rail 너비의 끝까지 커져 끝 cyan dot이 경계에 걸린다. 주요 메뉴명은2행으로 읽히고 브랜드명/기능 접근에 유의미한 손실은 없으므로 이번 배포 차단으로 보지 않는다. 다음 확대 조판 정리 시 wordmark 영역만 대응하면 된다. 이를 해결하려고 전체 본문 글자나 확대 배율을 축소하지 않는다.

## 검증 한계

- 200%는 harness의 글자 크기 근사이며 실제 OS text scaling/브라우저 zoom 전체 동작을 대신하지 않는다.
- 실제 Safari/WebKit 및 기기별 가변 폰트 렌더링은 이번 자료로 확인하지 않았다.
- YouTube와 media는 mock 검증이며 실제 audio/플랫폼 음량 정책 검증이 아니다.
- CI의 실패 차단 fallback은 확인했으나, 실사용 저속 네트워크에서 font swap의 정량 CLS까지 측정한 자료는 없다. 현 자료에서 기능을 막는 조판 결함은 발견되지 않았다.

## 최종 인계

후속 UI1681ade의 판정은 `REVIEW-FOLLOWUP-UI.md`, 이번 폰트 최종 판정은 이 문서다. 추가 소스 수정 없이 부모의 최종 검수/승인된 배포 단계로 인계한다. 디자이너는 배포를 실행하지 않았다.

## 배포 확인

- source `d7b983f6cb1c4e2e1a8de49829a7843602be55e4`
- [전체 CI](https://github.com/Bearsharks/simple-music-player/actions/runs/38907578222) 성공
- gh-pages `799ab87a2ae0fc50353ed117183ff422715ba79f`
- [Pages 배포](https://github.com/Bearsharks/simple-music-player/actions/runs/38908553507) 성공
- 2026-10-16 13:33 UTC 실제 HTTPS 앱 렌더, release.json source 일치, 기존 목록 보존, 별도 가져오기 진입 제거, 새 재생목록90deg 0/68/82/100% gradient 및 두 font face 로딩 확인. 실제 glyph 선택은 CI CDP 증거와 구분한다.
