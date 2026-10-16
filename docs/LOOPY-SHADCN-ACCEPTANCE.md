# loopy 최종 디자인·UX 인수

2026-10-16 · Astra

## 최종 판정

**디자인 인수 승인. 이번 사용자 승인 범위에서 배포를 막을 디자인·UX 결함은 남아 있지 않다.**

최종 대상은 `88277850c7d6abe627156feacfaccd71cc550bfe`다. 기능 구현 `4b489fd`, focus 검증 대기 보정 `b4492fb`, 확대 헤더/복원 조판 보완 `8827785`를 포함한다. 부모가 독립 검수한 CI `38902713676` 전체 성공과 root 배포 빌드 성공을 함께 확인 근거로 사용한다. 배포 실행과 최종 운영 검수는 부모의 절차를 따른다.

## 사용자 요구 대조

| 확정 요구 | 최종 확인 |
|---|---|
| 로고·전체 재생의 보라→블루/시안 | 해당 두 요소에 한정한 110deg signature gradient. 핑크 stop 없음. 흰 wordmark와 기존 마크 형태 유지. 일반 primary/원형 재생은 단색. |
| 실제 shadcn/ui 도입 | 공식 Radix Button/Input/Textarea/Label/Select/DropdownMenu/Popover 7종 소스·실제 소비자·provenance 확인. registry snapshot SHA-256 7개 모두 일치. 기존 native Dialog/Notice/미디어 구조 유지. |
| URL blur 자동 미리보기 | onChange 즉시 후보 무효화, blur/URL Enter 자동 조회, 편집 없는 반복 요청 방지, ready 이전 저장 차단, 실패 재시도와 취소 정리. 저장 문구 ‘재생목록 추가’. |
| 한 화면 목록 선택·메타데이터 편집 | 큰 + 신규 카드와 기존 카드 선택 뒤 같은 화면의 실제 이름/설명 필드. 기존 ‘수정하고 추가’, 신규 ‘만들고 추가’. 목적지별 draft, 단일 APPEND/CREATE, 실패 입력 유지. |
| 전역 백업을 더보기로 | 라이브러리 헤더의 전역 메뉴. 개별 목록 메뉴와 구분. 안정 file input과 동기 사용자 activation 유지. |
| 실제 breadcrumb | 홈 ‘라이브러리’, 상세 ‘라이브러리 / 실제 이름’. 가상 ‘내 음악’ 제거, 이름 변경 동기화, 긴 이름 ellipsis와 접근 가능한 전체 이름. |
| 오른쪽 패널·footer overlay와 전체 layer | RNB 열기 전후 본문 크기 불변, dock body portal, scope별 semantic 토큰. 메뉴/음량은 native dialog 안에 표시되며 작업 modal과 알림의 조작 순서를 보존. |
| 상세 inline 곡 추가를 overlay로 | native 작업 modal, URL 초기 초점, 이름 선택 입력, 중복 확인·실패 유지·취소·성공 닫기. 명시적 곡 추가/focusAdd에서만 열림. |
| 모바일 음량 한 행과 overlay | 음량/이전/재생/다음 한 행. 음량 버튼은 popover, native range·%·음소거 조작. 닫힘 시 trigger 초점 복귀. |
| 원본 복원과 최신 조회 분리 | 목록 더보기에 두 action. 최초 snapshot 복원은 네트워크 없이 곡/순서만 되돌림. 최신 가져오기는 자동 조회 후 명시적 ‘최신 목록으로 교체’. 이름/설명·현재 큐 유지. |
| 없는 원본은 숨김 | legacy에 snapshot을 소급 생성하지 않음. snapshot 없는 목록에는 복원 옵션 없음. 불가능 안내/disabled 설명 없음. |
| 최초 기록·기존 저장·백업 호환 | 신규 import CREATE와 최초 snapshot 동시 저장, 이후 편집/최신 조회로 덮어쓰지 않음. 기존 IndexedDB 이름/버전 유지. v1 백업 호환과 snapshot 왕복/유효성/원자성 테스트 존재. |
| 설명 최소화와 단일 디자인 시스템 문서 | 요청한 감성 문구 제거. 반복 조작 설명 축소. 실제 오류·파괴 확인·필수 aria-label 유지. 저장소 루트 DESIGN_SYSTEM.md에 원칙/토큰/레이어/재사용 규칙을 기록. |

## 발견했던 결함의 종결

1. **공통 border 초기화:** Label/메뉴 항목의 불필요한 medium border 제거. 생성·편집 폼과 열린 메뉴 캡처에서 확인.
2. **320px 헤더:** 마지막 ‘리’가 고립되던 제목을 전체 폭 첫 행, 액션을 다음 행으로 정리. 정상 390px 한 행 배치는 보존.
3. **모바일 브랜드–경로 간격:** 외부 gap 16px, 내부 경로 gap 8px. 로고와 경로가 분리되며 전체 이름 의미는 유지.
4. **확대 정렬값 및 액션:** 고정 160px 제한을 없애 ‘최근 추가순’ 전체가 보임. 200% 글자 근사에서 헤더 액션은 필요한 경우 다음 행으로 이동하며 화면 밖으로 밀리지 않음.
5. **복원 확인 제목:** 모바일에서 ‘요?’만 고립되던 조판을 단어 단위 줄바꿈으로 수정.
6. **focus 검증:** 실패 캡처에서는 ring이 이미 보였으며 trace 분석으로 150ms transition 중간값 검사로 확인됐다. 최종 focus-visible/sky/2px/4px를 기다리는 검증으로 해결. 실제 키보드 focus를 제거해 테스트만 통과시킨 변경은 없다.

## 실제 캡처 검토

최종 폴더: `shadcn-review/stage3-passed`. 이전 `stage2-passed`, `stage3`, `stage3-second`는 수정 전후 비교 근거다. prototype-*는 제품 인수 근거에서 제외했다.

- 일반 320/390/768/1024/1280/1440 라이브러리·상세와 열린 정렬: 중요한 조작이 겹치거나 화면 밖으로 밀리는 결함 없음.
- 390/1440 picker 기존/신규, 생성·편집: 선택 상태와 실제 입력 가능 영역, CTA 의미가 일치.
- 390/1440 큐 하단 더보기: 위로 열리며 전체 항목과 삭제 조작이 보임. dock 뒤 가림 없음.
- 390/1440 음량 popover: 같은 행 transport 위에 열리고 패널 경계 안에 맞음. 임시 overlay가 제목/진행바 일부를 덮는 것은 의도한 열린 상태이며 닫힌 레이아웃은 보존.
- 390/1440 AddVideo 오류: 입력·CTA·실제 오류와 알림이 모두 작업 modal 안에 있고 submit을 가리지 않음.
- 390/1440 최초 복원·최신 가져오기: 두 작업의 결과가 구분되며 교체에 대한 명시적 action이 있음. 불필요한 이중 확인 없음.
- signature default/hover/focus/disabled, 로고: 최신 색상 범위와 적용 제한 일치. 기본 최소 대비 4.82:1, hover 6.33:1, pressed 4.66:1은 별도 sRGB 계산으로 확인.
- 최종 390/1440 글자 200% 근사: 헤더/정렬의 가로 overflow가 해소됨. 긴 목록 이름의 ellipsis는 전체 DOM/접근 가능한 이름을 보존하는 기존 정책이다.

## 검증 한계와 보고 기준

- 디자인 검수는 소스와 제공된 실제 Chromium 캡처의 독립 검토다. 각 시나리오를 이 디자이너가 직접 브라우저에서 모두 실행했다고 주장하지 않는다. 행동 검증은 부모가 독립 확인한 테스트/CI 결과와 연결한다.
- 130 단위 테스트 및 부모의 경계·타입·빌드 검수, 최종 6폭 Chromium/새 흐름/root/Storybook 성공을 보고받았다. 소스에서는 UI 약속과 저장/취소/실패 구조를 대조했다.
- YouTube와 재생은 CI의 모의 player를 사용한다. 실제 YouTube 네트워크 성공, 오디오 출력, 모바일 OS 음량 제한, Safari 동작은 이번 인수의 검증 결과로 주장하지 않는다.
- ‘200%’ 캡처는 스크립트로 font-size를 두 배로 만든 근사 스트레스 조건이다. 실제 브라우저 zoom/OS 글자 확대 전반의 접근성 인증은 아니다. 이 근사에서 기존 고정 폭 sidebar wordmark의 끝 점 등 장식적 잘림은 전체 제품 WCAG 적합을 선언하지 않는 이유 중 하나이며, 이번 핵심 동작 차단으로 분류하지 않는다.
- 모든 importer 상태·가상 키보드·200% picker의 독립 시각 세트를 확보했다는 주장은 하지 않는다. 전용 캡처가 없는 상태는 소스와 행동 테스트 근거로 구분한다.

현재 범위의 인수는 완료다. 새 기능 제안이나 브랜드 재선정으로 배포 범위를 다시 넓히지 않는다.

## aria 배포 검증

- 구현 source: `88277850c7d6abe627156feacfaccd71cc550bfe`
- [최종 CI 전체 성공](https://github.com/Bearsharks/simple-music-player/actions/runs/38902713676)
- 배포 gh-pages: `a8673015582178d0ff851ebda50aa192bcaed2ec`
- [GitHub Pages 배포 성공](https://github.com/Bearsharks/simple-music-player/actions/runs/38903256862)
- 2026-10-16 12:51 UTC, https://loopy.bearsharks.dev/release.json 의 sourceCommit 일치 및 실제 HTTPS 브라우저 앱 렌더·기존 검수 목록 보존 확인.
- CNAME `loopy.bearsharks.dev` 보존, 프로덕션 base `/` 빌드. 사용자 Cloudflare 설정은 변경하지 않음.
- 캡처 경로는 검수 작업공간 상대 경로이며 GitHub Actions 아티팩트에도 동일 캡처가 포함됨. 아티팩트 보관 기간 이후에는 해당 캡처 접근이 만료될 수 있음.
