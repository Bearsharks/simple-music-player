# 후속 UI 디자인 인수

2026-10-16 · Astra · 대상 `1681ade`

## 판정

**이 UI 청크는 인수 가능. 확인한 범위에 배포를 막는 시각·UX 명세 위반 없음.** 이후 승인된 Geist Sans+Pretendard 적용은 별도 청크이며, 폰트 변경 후 좁은 폭/200%/혼용 조판을 다시 검수한다. 이 문서로 폰트 청크까지 승인한 것은 아니다.

근거: snapshot source 읽기, `shadcn-review/followup-ui-passed`의 제품 캡처 직접 검토, 부모가 확인한 Chromium CI38906497677 전체 성공. 디자이너가 별도로 브라우저 동작을 실행한 것은 아니다. prototype-*는 제품 근거에서 제외했다.

## 최신 요구 대조

| 요구 | 시각·소스 근거 | 판정 |
|---|---|---|
| RNB dim 완화 | followup-rnb-768/1024/1199에서 배경 목록·커버가 흐려지지 않고 읽힌다. Dialog의 subtle tone은 native wrapper 투명+native pseudo24%/blur none, fallback만wrapper24%. | 통과 |
| desktop overlay 유지 | followup-rnb-1200/1440에서 배경 무딤·dock 유지. 1199→1200 검증 코드가 modal 전환과 media host 수명/본문 bounding box를 검사한다. 좌측 shadow12%가 패널 경계만 만든다. | 통과 |
| 작업 modal 구분 | followup-rnb-task-1024에서 작업 창만 명확한 차단층으로 뜬다. CI는 닫은 뒤 RNB tone 복귀도 검사한다. 일반 modal의 기존 dim/blur와 혼용하지 않았다. | 통과 |
| slider-only 음량 | followup-volume-320/390/768/1200 및 dock-volume-320/390/768/1024/1199/1440을 직접 검토. popup 안 제목/%/별도버튼 없음. compact176px,range44px,focus 가시적이며 trigger/transport를 가리지 않는다. | 통과 |
| 모바일·중간 폭 footer 접근 | 320에서 트랙/재생/음량/큐가 한 줄에 들어가며 각각 조작 영역 유지. 768/1024도 같은 popup이 footer 위에 뜬다. 이름만 줄임표로 축약하며 가로 overflow 없음. | 통과 |
| 브랜드 공통화 | app-library-320/390/1440의 새 목록 CTA와 followup-dock-volume-*의 전체 재생, sidebar25×28px 마크를 대조. 긴 보라 영역+마지막 빠른 블루 전환이 일치.90deg·0/68/82/100 stop은 모든 상태 공통. | 통과 |
| 재사용 컴포넌트 | BrandPrimaryButton은 shadcn Button 얇은 wrapper. 기본/hover/pressed gradient는 공통 token이며 일반 submit·원형 play·보조+는 별도 역할 유지. | 통과 |
| 가져오기 진입 정리 | app-library-1440 sidebar/header에 standalone import 없음. app-create-form-390 안의 ‘유튜브에서 가져오기’ 유지. Playlists.tsx의 empty CTA도 새 재생목록 하나. | 통과 |

사전 검수에서 지적한 volume fill 누락은 현재 소스에 `--volume`에 따른 Chromium gradient와 Firefox range-progress로 반영됐다. CI는0/1/100 및 muted 상태를 검사한다.

## 접근성·상태 확인의 범위

- snapshot harness는 실제 hover bridge/drag 유지, touch toggle, keyboard range 진입/Home/End/arrow, Escape 후 재열림 방지, 내부 overlay만 닫기, native focus/media 수명을 검사한다. 단순 screenshot만으로 이런 동작을 통과시킨 것이 아니다.
- app-text-200-390에서 제목/액션/검색/정렬은 줄을 나누며 overflow가 없다. footer 긴 글자는 ellipsis, 버튼 영역은 유지한다.
- 음량의 실제 YouTube API 성공, iOS의 외부 player 음량 제한, Safari/WebKit은 이번 Chromium mock evidence로 보장할 수 없다. 시뮬레이션 이미지에도 실제 재생 검증이 아니라고 표시돼 있다.

## 캡처 품질 보완 1건

`followup-library-320/390/1440.png`는 로딩 화면에서 촬영됐다. harness는 reload 직후 ‘가져오기 버튼이0개’인지만 기다려 빈 로딩 DOM에서도 통과한다. **제품 결함 판정은 아님.** 같은 commit의 완성된 `app-library-*`로 시각 대조를 보완했다. 다음 폰트 CI에서는 실제 library heading/card ready 후 촬영해 사용자에게 보여 줄 결과물을 확보한다. 부모에게 전달 완료.

## 다음 인수 조건

폰트 적용 뒤 실제 Geist/한글 Pretendard glyph 확인 자료와7폭·1280·200% 캡처를 새 snapshot으로 검토한다. 현재 gradient/레이어/음량 UX를 다시 임의 변경하지 않는다.
