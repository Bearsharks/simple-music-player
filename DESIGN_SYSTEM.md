# loopy 디자인 시스템

2026-10-16 · Astra 확정안 · 실제 제품 기준의 공통 규칙과 이번 overlay 확장 계약.

이 문서는 저장소 루트 `DESIGN_SYSTEM.md`로 인계할 단일 기준이다. 별도 design-system 관리 폴더나 새로운 앱 계층을 만들지 않는다. 기존 `shared/ui`, `shared/lib`, feature별 UI/SCSS를 유지한다. 앞선 시안과 충돌하면 최신 사용자 지시를 반영한 이 문서를 우선한다.

## 1. 원칙

- **불필요한 설명은 최대한 하지 않는다. UI/UX로 처리하고, 툴팁이나 설명은 정말 부득이한 특이사항일 때만 사용한다.**
- 선택 카드, 실제 편집 필드, 명확한 CTA, enabled/disabled/선택 상태로 동작을 드러낸다. 장문의 조작 설명, 상시 단계 안내, 없어도 되는 감성 문구를 추가하지 않는다.
- 기능 자체가 없는 대상에서는 해당 옵션을 숨긴다. 예: 최초 snapshot이 없는 목록의 복원 옵션. 불가능한 항목을 disabled로 보여주며 설명하는 방식은 쓰지 않는다.
- 준비 중인 작업의 CTA disabled, 실제 저장 실패, 파괴적 변경 확인, 필수 aria-label/접근 가능한 이름과 상태 알림은 위 원칙과 별개로 유지한다. 오류를 숨기거나 중요한 결과를 생략하라는 뜻이 아니다.
- 저장 재생목록, 최초 원본 기록, 현재 재생 큐는 별개다. 편집/복원/최신 가져오기/새 목록 추가가 현재 곡과 큐를 암묵적으로 바꾸지 않는다.
- 사용자 작업 중 입력, 현재 곡, iframe instance를 잃는 UI 전환은 허용하지 않는다.

## 2. 공통 토큰과 재사용

| 역할                | 기존 토큰/값                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| 바탕                | `--canvas: #0B0B14`                                                                            |
| 표면/메뉴           | `--surface: #1A1A26`                                                                           |
| hover 표면          | `--surface-raised: #242435`                                                                    |
| 본문/보조 글자      | `--text: #FFFFFF`, `--muted: #A1A1B3`                                                          |
| 구획/입력 테두리    | `--line: #353545`, `--control-line: #6B6B80`                                                   |
| 핵심 조작           | `--purple: #A855FF`                                                                            |
| hover/pressed       | `--brand-hover: #B875FF`, `--brand-pressed: #A553FA`                                           |
| 핵심 버튼 글자      | `--on-brand: #0B0B14`                                                                          |
| 로고·전체 재생 한정 | `--signature-gradient: linear-gradient(110deg, #A855FF 0%, #6C70EF 55%, #4CC9FF 100%)`         |
| signature hover     | `--signature-gradient-hover: linear-gradient(110deg, #B875FF 0%, #8388F4 55%, #6AD3FF 100%)`   |
| signature pressed   | `--signature-gradient-pressed: linear-gradient(110deg, #A553FA 0%, #6A6EEB 55%, #43B8EF 100%)` |
| focus               | `--sky: #4CC9FF`                                                                               |
| 위험/오류           | `--danger: #FF9DB6`                                                                            |

- **최신 사용자 지시(2026-10-16 12:23 UTC): 로고 마크와 ‘전체 재생’ 버튼만 보라→인디고→블루/시안 그라데이션으로 변경한다.** 위 signature 토큰을 사용하며 핑크/빨강 stop은 넣지 않는다. 앞선 두 요소의 단색 결정은 이 지시로 대체된다.
- 전체 재생의 dark foreground `#0B0B14`를 유지한다. 기본 gradient 전체 구간의 최소 대비는 sRGB 샘플 계산 약 4.82:1, hover 약 6.33:1이다. pressed도 4.5:1 이상을 유지한다. 흰 작은 글자로 바꾸지 않는다. glow/광택 줄무늬/움직이는 gradient는 추가하지 않는다.
- 로고 4개 막대 전체에 하나의 좌→우 색 흐름을 적용한다. 막대마다 전체 gradient를 반복하지 않는다. 기존 막대 높이/간격/형태와 흰 loopy wordmark를 유지한다. 로고 끝 점은 종단 sky `#4CC9FF`로 맞춘다. 모바일은 기존 wordmark와 끝 점에 같은 규칙을 사용한다.
- **공용 primary, 카드의 원형 재생, dock/상세 플레이어 원형 재생은 단색 보라를 유지한다.** 커버의 다색 그래픽, 오류/재생 상태의 의미색도 유지한다. signature를 공용 `--purple`이나 모든 Button default에 확산하지 않는다. 단색 dark foreground 대비는 기본 5.04:1, hover 6.55:1, pressed 4.87:1.
- 일반 컨트롤/터치 영역 최소 44px, 전체 재생 48px, 상세 플레이어 재생 56px. radius는 컨트롤 10px, popover 12px, dialog 16px. 필드 16px, 메뉴/버튼 14px 이상.
- focus-visible sky 2px/offset 4px. 팝오버 항목은 clipping 없는 내부 ring. 비활성은 실제 disabled와 opacity .42, hover/pressed 미적용. reduced-motion에서는 이동/등장 효과 제거.
- 공식 shadcn **Radix** Button/Input/Textarea/Label/Select/DropdownMenu를 사용한다. 이번 음량 overlay에는 공식 Radix Popover를 하나 추가한다. native Dialog/Notice/ErrorToast/미디어 Tabs/range는 현재 검증된 구현을 유지한다.
- `shared/ui/shadcn`의 공통 primitive, 기존 Dialog/OverlayPortal, feature-owned action을 재사용한다. 기능별 복제 modal/volume menu를 만들지 않는다.
- source provenance/license/snapshot을 남기고 Tailwind utility는 prefix/소스 경계를 제한한다. Preflight는 도입하지 않는다. 기존 `--muted`는 글자색이며 shadcn muted 배경 의미로 덮어쓰지 않는다.
- Preflight가 없으므로 공통 marker의 border-style만 solid로 켜지 않는다. 기본 border-width 0을 명시한 뒤 input/trigger/popover만 1px를 적용한다. 기존 SCSS와 실제 computed style을 확인한다.

공식 참고: [shadcn Radix Popover](https://ui.shadcn.com/docs/components/radix/popover), [Radix Popover API](https://www.radix-ui.com/primitives/docs/components/popover). 제품별 portal/close adapter는 공식 source 위의 명시적 로컬 확장이다.

## 3. 레이어 체계

z-index는 **같은 stacking context 안의 순서**다. native top layer, inert, portal 위치, 조상 overflow/transform까지 함께 다룬다. 숫자만 높여 고치지 않는다.

| semantic token      |  값 | 용도                                   |
| ------------------- | --: | -------------------------------------- |
| `--z-content`       |   0 | 기본 페이지                            |
| `--z-sticky`        |  10 | 페이지 내부 sticky header              |
| `--z-dock`          |  40 | 하단 고정 재생 컨트롤                  |
| `--z-panel`         |  60 | desktop 비모달 오른쪽 플레이어 overlay |
| `--z-popover`       |  80 | 현재 scope의 메뉴/Select/음량 popover  |
| `--z-dialog`        | 100 | native dialog fallback/작업 layer      |
| `--z-notice`        | 120 | 현재 활성 scope의 오류/Undo 알림       |
| `--z-accessibility` | 140 | focus된 skip link 등 제한된 보조 UI    |

### 실제 순서와 host

1. dock, desktop panel과 body-level transient는 app의 transform/overflow로 갇히지 않는 안정 host에 둔다. 기본 콘텐츠 위에서 overlay하며 레이아웃 열을 추가하지 않는다.
2. menu/Select/volume은 **트리거가 속한 열린 native dialog 안**을 portal container로 사용한다. 없으면 body. 메뉴가 열린 동안 container를 고정한다. native modal보다 body의 z-index를 높여 덮으려 하지 않는다.
3. desktop panel은 비모달이며 main을 inert로 만들지 않는다. mobile/narrow panel은 기존 native `showModal()` sheet로 main/dock을 비활성화한다. 이 차이를 숫자 토큰으로 흉내내지 않는다.
4. 작업 modal은 native top layer에서 panel 위에 열린다. 기존 priority/stack, 포커스 복귀, body lock을 유지한다. panel이 열린 채 task를 열고 resize하더라도 iframe host를 옮기거나 재생성하지 않는다.
5. Notice/ErrorToast는 이미 존재한다. 기존 안정 OverlayPortal을 재사용하여 **현재 활성 modal 안**으로 이동한다. 일반 페이지에서는 `--z-notice`, modal에서는 그 scope 안에서 조작 가능하게 둔다. 토스트가 submit/닫기/재생을 덮지 않으며 modal 안에서는 현재 flow 배치를 유지해도 된다.
6. app/menu/panel 코드에서 `9999` 등 임의 숫자를 추가하지 않는다. 원인 scope를 찾고 위 토큰/host를 사용한다. 실제 CSS가 30/40/101/102/140/200으로 분산된 부분은 의미에 맞게 연결한다.

### 닫기·초점

- DropdownMenu/Popover는 non-modal. Select에는 존재하지 않는 modal prop을 붙이지 않는다.
- 첫 Escape는 가장 안쪽 메뉴/음량만 닫고 trigger 복귀. 다음 Escape에서 task/panel을 닫는다. 한 제스처로 native cancel이 연쇄 실행되지 않는다.
- 실제 drag 중 Escape는 드래그 취소가 우선이다. 바깥 panel을 같이 닫지 않는다.
- 메뉴에서 task dialog로 이동하면 메뉴를 닫고 새 task에 초점을 넘긴다. 이전 메뉴의 restore가 새 task 초점을 빼앗지 않는다.
- task 저장 pending 중 중복 실행/닫기 차단, preview fetch 중에는 취소 허용. 실패하면 폼/후보를 남긴다.
- popover가 바깥 클릭으로 닫히는 것과 panel 자체의 닫기를 분리한다. desktop panel은 main 클릭만으로 자동 종료하지 않는다. 편집과 재생을 함께 사용할 수 있어야 한다.

## 4. footer와 오른쪽 플레이어 overlay

- dock은 fixed footer. page grid에 별도 열/행으로 끼워 넣지 않는다. 마지막 곡/버튼을 스크롤로 드러낼 수 있도록 실제 scroll owner에 dock 높이+safe-area+16px 이상의 바닥 여백을 둔다. footer가 콘텐츠 접근을 막는 것은 허용하지 않는다.
- desktop RNB를 열어도 main의 width/grid/card column count가 변하지 않는다. 현재 `.studio-shell.queue-open { padding-right: var(--queue) }`를 제거한다.
- desktop panel은 기존 `--queue` 폭을 유지하고 viewport 오른쪽에 fixed, 아래 끝은 dock 상단. 분리감을 위해 1px 경계와 약한 좌측 shadow만 사용한다. 본문을 축소하거나 강한 dim/backdrop을 넣지 않는다.
- narrow/mobile는 현재 380px 또는 full-width native sheet의 반응형 정책을 유지한다. 본문을 밀지 않는다. 닫았을 때 해당 queue/current-track trigger로 복귀한다.
- 닫기·탭 전환·breakpoint 이동은 동일한 YoutubePlayer/iframe instance를 보존한다. `open=false`라고 player subtree를 조건부 제거하지 않는다.
- 패널 제목 아래 **‘음악과 함께하는 나만의 시간’은 제거**하며 대체 감성 문구나 불필요한 빈 높이를 넣지 않는다.
- 현재 곡/큐 접근 버튼, 현재 재생 상태, 숨긴 패널을 다시 여는 동작은 유지한다.

## 5. 곡 추가 overlay

- 상세의 inline AddVideo를 기존 native 작업 Dialog로 옮긴다. 기존 URL 파싱/곡 제목/중복 확인/APPEND 로직을 재사용한다.
- 진입: ‘곡 추가’ 버튼. dialog 제목 ‘곡 추가’, 필드 ‘영상 URL’, ‘곡 이름 (선택)’, 취소 / ‘추가’. 긴 상시 사용법은 제거한다.
- URL에 초기 focus. `focusAdd`로 들어온 빈 목록/신규 목록도 같은 dialog를 연다. 상세 뒤의 목록은 높이/배치가 변하지 않는다.
- 빈 목록 상세를 단순히 열거나 마지막 곡을 삭제한 것만으로 dialog를 자동 표시하지 않는다. 이 경우 빈 상태의 ‘곡 추가’ CTA를 유지한다. 자동 진입은 명시적 추가 의도가 있는 `focusAdd` 경로에만 적용한다.
- URL을 바꾸면 이전 중복 확인을 해제. 기존 곡이면 현재 명시적 **‘중복해서 추가’** 확인을 유지한다. 실수로 두 번 클릭한 것과 사용자 허용 중복은 구분한다.
- 성공한 transaction 후 dialog 닫기, 짧은 성공 알림, trigger focus. 현재 큐/재생 상태 유지. 다음 곡을 추가하려면 같은 버튼으로 다시 연다.
- 저장 실패/메타데이터 처리 실패는 토스트와 열린 입력값 유지. 저장 중 중복 제출/취소 방지. 저장 전 취소에는 쓰기 없음.
- field Enter로 저장, IME 조합 중 Enter 무시. 320px/키보드 열린 상태에서 필드와 CTA에 스크롤로 접근 가능. 작업 modal 아래의 오른쪽 panel은 같은 instance로 남는다.

## 6. 모바일 음량 popover

- 요청된 **상세 플레이어**에서 기존 별도 volume row를 없애고 **음량 / 이전 / 재생·일시정지 / 다음**을 같은 행에 둔다. compact footer의 기존 트랙/재생/큐 구성은 무리하게 늘리지 않는다.
- 버튼 최소 44px, 중앙 재생 56px. 재생 중심을 맞추려면 44/44/56/44/44의 5-track grid(마지막은 비어 있는 layout 공간), gap 8px를 사용할 수 있다. 실제 조작은 네 개뿐이다. 총 264px로 320px 화면의 panel 내용 안에 들어간다.
- 음량 trigger는 `aria-label='음량 조절'`, expanded 상태와 현재 muted 아이콘. 클릭은 popup을 열며 즉시 mute하지 않는다. ready 전 disabled.
- Popover는 width 약224px/max viewport-32px, 위쪽으로 열고 공간이 없으면 flip. surface/radius/border는 공통 menu와 같다. native sheet 안에서 portal하며 내용이 밖으로 잘리지 않는다.
- 내용: 짧은 제목 ‘음량’, 현재 % 값, native range 0–100(터치 높이44px), 별도 음소거/해제 버튼. 추가 도움말/툴팁은 없음. 열면 range에 focus, Escape/닫힘 시 음량 trigger로 복귀.
- slider 방향키/Home/End와 native value semantics 유지. 슬라이더 변경 시 기존 player API를 사용하며 실제 mute/volume과 UI 상태를 동기화한다. player가 준비되지 않은 상태를 조절 성공처럼 표현하지 않는다.
- 바깥 클릭/Escape로 popover만 닫힌다. 음량 변경/열기/닫기로 음악이 멈추거나 queue sheet가 닫히지 않는다.

## 7. 최초 기록 복원과 최신 YouTube 가져오기

상세 하단의 모호한 ‘원본으로 초기화’ 버튼을 제거하고 **해당 재생목록 더보기**에 두 action으로 분리한다. 전역 라이브러리 메뉴에 넣지 않는다.

### ‘처음 가져온 목록으로 복원’

- source URL과 유효한 최초 snapshot이 있는 목록에만 표시한다. 없으면 **숨긴다**. 불가능 이유 안내줄/tooltip/disabled 항목을 추가하지 않는다.
- 네트워크 없이 최초 성공 import 때 기록한 곡과 순서를 사용한다. 현재 사용자 목록 이름/설명은 보존한다. 영상 서비스에서 삭제된 곡이 다시 재생 가능해진다는 보장은 하지 않는다.
- 한 번의 파괴 확인: ‘처음 가져온 N곡으로 복원할까요?’와 ‘추가·삭제·정렬한 곡 구성이 바뀝니다. 목록 이름·설명과 현재 대기열은 유지됩니다.’ 취소 / ‘복원’.
- 확인 후 단일 transaction으로 현재 곡을 교체. 실패하면 현재 목록을 그대로 두고 확인 화면/오류를 유지. 성공 시 닫고 짧은 알림. 이전 곡 삭제 Undo가 전체 교체를 되돌려 쓰지 않도록 기존 replacement-version 계약을 유지한다.

### ‘YouTube 최신 목록 가져오기’

- source URL 있는 목록에 표시한다. URL을 다시 입력하도록 요구하지 않고 열 때 자동 로드한다.
- task 제목 ‘YouTube 최신 목록 가져오기’. 로딩/실제 얻은 N곡/오류 상태만 제공한다. 현재 사용자 목록 이름/설명은 수정하지 않는다. 원본 URL은 편집 필드로 위장하지 않고 필요 시 plain link로만 표현한다.
- 준비 전 교체 CTA disabled. 준비되면 preview/곡 수와 로컬 추가·삭제·정렬이 교체된다는 짧은 경고, 취소 / **‘최신 목록으로 교체’**. 이 명시적 action이 파괴 확인이다. 같은 내용을 다시 묻는 중첩 확인 모달은 추가하지 않는다.
- 자동 load만으로 저장하지 않는다. 조회 실패는 기존 ErrorToast와 재시도. 취소/실패는 현재 로컬 곡/큐를 변경하지 않는다.
- 조회·검증·쓰기 완료 후에만 닫는다. 성공해도 최초 snapshot은 절대 덮어쓰지 않는다. 실제 조회 범위를 넘어 ‘YouTube 전체 최신 곡을 모두 가져왔다’고 보장하지 않는다.

### 저장·백업 계약

- 새 YouTube import의 **최초 성공 CREATE에만** 초기 snapshot을 같은 transaction으로 저장한다. snapshot은 version/capturedAt/정규화된 MusicInfo 배열을 포함하는 optional 필드로 두고 live items와 별도 복사한다. 구체 필드 위치는 기존 API의 가장 작은 변경으로 구현한다.
- 로컬 추가/삭제/정렬/이름·설명 편집/제목 복구/복원/최신 가져오기는 최초 snapshot을 변경하지 않는다. 복원 시 runtime item key는 현재 모델의 전체 교체 규칙에 맞게 새로 생성한다.
- 과거 데이터에 snapshot이 없으면 현재 곡이나 오늘의 YouTube 결과를 과거의 최초 기록으로 소급 생성하지 않는다. legacy의 최신 가져오기 성공 후에도 과거 최초 snapshot은 없는 상태다.
- 기존 IndexedDB DB명/키 경로/저장 데이터를 유지한다. additive optional record로 가능하면 DB version 변경/일괄 마이그레이션은 하지 않는다.
- 백업은 기존 v1(해당 필드 없음)을 계속 읽는다. 새 export/import는 유효 snapshot을 보존하고 version/시각/곡 형식/영상 ID/용량 상한을 검사한다. malformed snapshot을 최초 원본으로 인정하지 않는다.
- 현재 곡 10000개 상한을 snapshot 때문에 갑자기 절반으로 낮추지 않는다. snapshot에도 별도 유한 상한을 두고 파싱/메모리 사용 전체를 제한한다. 파일10MB/목록500개 정책과 안전한 원자적 가져오기는 유지한다.
- 실패 시 live items와 snapshot 중 하나만 쓰이는 부분 성공이 없어야 한다. backup 왕복 후에도 ‘복원 가능/불가능’ 의미가 같아야 한다.

## 8. 앞선 여섯 묶음에 대한 최신 조정

- Import: 입력 변화 즉시 후보 무효화, blur/URL Enter 자동 load. 편집 없는 반복 blur만 no-op; onChange 후 원래 URL 복귀도 새 load. 수동 preview 단계/버튼 없음. CTA ‘재생목록 추가’.
- Picker: 카드 선택 후 같은 화면의 진짜 이름/설명 입력. 기존 ‘수정하고 추가’, 신규 ‘만들고 추가’. 목적지별 draft 보존. **상시 ‘목록을 선택해 주세요’/‘선택한 목록의 변경만 저장됩니다’ 설명은 제거**하고 무선택 CTA disabled 및 카드/필드 상태로 표현. 선택 알림은 ‘○○ 선택’처럼 짧게 제공한다.
- 새 카드의 큰 +와 ‘새 재생목록 만들기’ 유지. 없는 기존 목록의 복사/복원 등 불가능 action은 노출하지 않는다.
- 라이브러리 백업은 헤더 전역 더보기, 개별 목록 action과 분리. 파일 chooser는 동기 사용자 activation과 안정 input 수명을 유지한다.
- breadcrumb는 라이브러리 / 실제 목록 이름. 가상 상위 ‘내 음악’ 없음. 긴 이름은 시각적으로 ellipsis하되 accessible name 보존.

## 9. 수정 파일과 검수

공통 토큰은 `shared/ui/electric-night.scss`, 공통 primitive는 `shared/ui/shadcn`, 레이어 동작은 기존 `Dialog`/`OverlayPortal`에 둔다. feature 코드에 전역 레이어 숫자를 복제하지 않는다.

직접 소비자: `navigation/pages/StudioShell.scss`, `player/ui/playerDetail/PlayerDetail.tsx/.scss`, `player/ui/playerController/PlayerController.tsx`, `SoundController.tsx`, `ListeningDock.scss`, `playlists/pages/PlaylistPage.tsx`, `overlays/Popup.tsx`, `youtube/ui/PlaylistImport.tsx`. snapshot은 `shared/model/constants.ts`, 기존 localAPI/playlistAtoms/backup 처리의 최소 변경으로 구현한다.

필수 검수:

1. 1440/1280에서 RNB 열기 전후 main bounding box/card columns 불변. main 편집 가능, footer 접근 가능, 마지막 곡 scroll 접근.
2. 320/390에서 panel→메뉴/volume→task→오류토스트 조합. hit testing/포커스/닫기 순서, 메뉴가 dock/panel 뒤로 가려지지 않음. 같은 Escape의 연쇄 닫힘 없음.
3. overlay 열기/닫기/탭/resize 전후 iframe instance 동일, 현재 곡/queue 불변. drag Escape 취소 및 즉시 저장 실패 회귀.
4. AddVideo URL 초기 focus, 단일/중복 추가, 실패 유지/재시도, 취소, focusAdd, 성공 후 닫힘. inline 폼/상시 설명이 남지 않음.
5. mobile transport 한 행, volume popover keyboard/touch/mute/ready 상태, 닫힘 후 초점, 실제 player 상태 동기화.
6. 신규 import snapshot→로컬 편집→네트워크 없이 최초 복원, 최신 조회→명시 교체→최초 snapshot 불변. legacy restore 옵션 숨김. backup v1/신규 왕복/잘못된 snapshot/transaction 실패.
7. metadata/곡 복원과 현재 재생 큐 독립, 다중 클릭 중복 저장 없음. 파괴 확인·실제 오류·필수 a11y는 설명 최소화 원칙 때문에 사라지지 않음.

픽셀 캡처와 행동 테스트를 함께 확인한다. mock iframe의 성공을 실제 YouTube/오디오 검증으로 보고하지 않는다. 배포는 부모의 최종 인수 절차를 따른다.
