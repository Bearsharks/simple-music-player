# loopy 구조 검토

## 현재 책임 경계

- App은 라우터·Main·YouTube 도구를 조립하고, 실제 화면 라우팅은 navigation/Main이 소유한다.
- YouTube 기능은 URL 정규화, 공개 메타데이터, 가져오기 상태, 편집 UI와 스타일을 소유한다.
- 확장은 basket·대상 탭·ACK를 소유한다. 앱 시작/수동 연결 확인 및 저장 알림에 반응하며, 창 메시지는 payload 없는 조회 신호로만 사용한다.
- 저장은 기존 IndexedDB/localAPI, 큐는 queue manager, 재생은 player가 소유한다. 저장소 이름·스키마·사용자 데이터는 구조 정리의 대상이 아니다.
- shared→feature/app 및 feature→app 의존은 alias와 상대 경로 모두 검사한다. 순환 의존·동적 import까지 분석하는 도구는 아니다.
- 배포 입력은 main SHA, lockfile, 고정 Node다. 두 빌드의 파일 hash 일치와 봉인된 artifact를 검증하며 게시 단계에서는 재빌드하지 않는다. 자세한 계약은 DEPLOYMENT.md를 따른다.

## 유지할 동작

URL 검사, 중복·순서·선택, snapshot 불변성, 실패 시 편집 보존, transaction 완료 후 성공 표시, 대기열과 저장 목록의 독립성, iframe 수명, modal 포커스·Undo, 대상 탭 ACK 후 basket 비우기.

## 추가로 검증할 위험

| 경계 | 현재 위험 | 다음 결정에 필요한 증거 |
| --- | --- | --- |
| overlays ↔ playlists/queue | 중앙 메뉴·모달이 업무 명령도 조합한다 | 한 작업 경로의 소유권 이동 후 focus/Undo/실패 회귀 |
| shared/model/constants | 일부 action payload가 any다 | 실제 각 명령의 payload 계약을 수집한 뒤 구별된 union과 잘못된 입력의 컴파일 실패 검사 |
| player | 컨트롤과 가져오기가 window.player 수명을 공유한다 | 준비/종료/재연결과 RNB resize 중 동일 iframe을 보존하는 playback port 검사 |
| localAPI | metadata 조회가 곡과 snapshot record까지 읽을 수 있다 | 많은 목록에서 읽기 횟수·정규화 비용 측정. 수치 없이 DB migration을 추가하지 않는다 |
| 다중 탭 저장 | 같은 store의 직렬화가 다른 탭의 stale read를 막지는 않는다 | 두 탭 append/reorder/delete 경합 재현 후 revision conflict 또는 transaction 내부 read-modify-write 검토 |
| CSS | 전역 컨트롤 규칙과 shadcn 스타일이 공존한다 | 실제 소비자별 computed style·focus·모바일 비교 |

이 항목들은 자동 검사 통과만으로 해결됐다고 볼 수 없다. 각각 별도 변경 단위로 검증하며 전면 재작성·새 상태 라이브러리·데이터 스키마 변경을 기본 해법으로 사용하지 않는다.

## 검증 범위

`npm run check`는 경계·확장·패키징·배포 무결성·타입·단위 테스트·빌드를 검사한다. `npm run test:browser`는 실제 앱 진입점에서 저장·재생 UI·반응형·메뉴를 검증한다. `e2e/extension-import.mjs`는 실제 확장 메시지와 격리 IndexedDB를 사용하지만 외부 YouTube 응답은 fixture다. 실제 공개 YouTube 경로는 `e2e/extension-import-live.mjs`로 별도 확인한다. 배포 workflow의 publish=false는 운영 변경 없이 재현성·전체 검사·artifact 생성까지 검증한다.
