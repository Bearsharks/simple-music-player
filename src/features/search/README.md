# search: 검색 입력

로그인 제거 후 기존 편집 화면에 다시 연결되어 있다. 저장 목록은 shared/api/localAPI.ts, URL 가져오기는 youtube/ui/PlaylistImport.tsx를 사용한다.

## 최소 읽기 경로

현재 제품의 YouTube 검색은 `features/youtube/import/ExtensionImport.tsx`가 제공하며 App에서 Main의 tools 슬롯으로 연결한다. 검색어를 인코딩해 YouTube 결과를 `noopener,noreferrer` 새 탭으로 연다. 확장 설치·API 키와 무관하다. 회귀: `src/__test__/extension-import-ui.test.tsx`.

- `ui/SearchBar.tsx` — 입력·옵션·키 이벤트
- `ui/ConnectedSearchBar.tsx` — 검색 팝업 연결

## 연결과 영향 범위

navigation이 배치하고 overlays가 결과 화면을 연다. 실제 조회와 URL 해석은 youtube 기능에 있다.

`npm run impact -- search`으로 현재 코드의 직접 소비자와 외부 의존 파일을 확인한다. 내부 구현만 바꾸면 위 진입 파일부터 읽고, export/상태/타입/콜백 계약을 바꿀 때에만 소비자로 읽기 범위를 넓힌다.

## 보존할 계약

입력 UI에서 직접 API 요청이나 queue 변경을 하지 않는다. 검색 타입·값 계약 변경 시 overlays/PopupStates.ts와 Popup.tsx를 함께 확인한다.

## 검증

- 빠른 회귀: `npm test -- src/__test__/youtube.test.ts src/__test__/app.test.tsx`
- 제출 전: `npm run check`
- 검증 공백: 입력/옵션 상호작용 전용 테스트는 아직 없다. 조회 테스트만으로 검색 UX를 완료 판정하지 않는다.
- UI 변경은 관련 Storybook 또는 fixture 화면으로 확인하고 실제 확인하지 못한 항목은 보고한다.

## 완료 보고

변경한 계약, 영향을 받는 소비자, 실행한 테스트와 결과, 미검증 항목을 적는다. 새 공개 함수나 의존 관계를 만들면 이 README도 갱신한다.

[전체 구조](../../../docs/ARCHITECTURE.md) · [작업 시작 지도](../../../docs/CHANGE-GUIDE.md)

## Legacy UI audit (2026-10-17)

SearchBar/ConnectedSearchBar remain a legacy entry pair, not mounted by current navigation/Main. Their remaining icon-font spans were converted to shared inline SVG so later reuse cannot reintroduce first-open font loading. The old textarea selector is now scoped to its wrapper rather than styling every textarea. No search behavior was removed.
