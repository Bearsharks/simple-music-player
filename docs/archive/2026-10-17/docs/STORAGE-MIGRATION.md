# 원본 코드 기준 저장소와 이전 계획

## 조사 기준

기존 master 커밋 9e52a5c를 읽었다. src/refs/apiSelector.ts는 서버 API를 선택하고, api.ts는 /playlists와 /playlist/:id/items를 호출한다. 생성 시 입력 info.id를 null로 보내고 서버가 새 ID를 반환한다. PlaylistInfo에 원본 YouTube URL 필드는 없다.

storeStateManager.ts에 localStorage get/set 도우미는 있지만 이 버전의 다른 소스에서 import/사용하는 곳이 없다. 이것만으로 옛 사용자 재생목록이 localStorage에 저장되어 있다고 추정하지 않는다. 배포 산출물이 다른 역사 버전이라면 별도 확인이 필요하다.

## 현재 결정

- IndexedDB `simple-music-player-local-v1`의 playlists object store에 목록 단위 레코드를 저장한다.
- 원본 URL이 있는 새 가져오기 목록은 sourcePlaylistUrl을 명시적으로 저장한다.
- 일반 목록은 원본 URL 없이 저장하며 원본 초기화를 표시하지 않는다.
- 옛 서버 데이터 회수/로그인/삭제는 하지 않는다. 향후 명시적으로 받은 기존 목록 데이터는 이름·곡·순서를 일반 로컬 목록으로 가져오는 것이 안전하다.
- 원본 URL을 서버 ID나 설명에서 추측하지 않는다.
- 확인되지 않은 옛 localStorage 키를 무차별 스캔하거나 삭제하지 않는다. 기존 브라우저 데이터는 보존된다.
- 이번 개발 중 잠깐 만든 localStorage 어댑터는 아직 공개 배포하지 않았다. 이를 3년 전 데이터 형식으로 취급하지 않는다.

## 저장 수명과 처리

IndexedDB의 비동기 transaction 완료를 확인한 뒤 성공을 반환한다. 레코드의 info/items는 한 transaction으로 교체한다. 저장소는 origin별이며 동기화·영구 보관·백업을 자동 제공하지 않는다. 사이트 데이터 삭제/브라우저 정책으로 소실될 수 있다.

동시에 여러 탭에서 같은 목록을 편집할 때 충돌 병합은 현재 지원하지 않는다. DB transaction 자체의 원자성과 상위 UI의 read-modify-write 경쟁은 다르다.

## 원본 연동

원본 연동은 가져오기와 사용자가 요청한 초기화에만 수행한다. 초기화 미리보기에서 다시 로드한 곡을 확인하고 교체를 승인해야 저장된다. 실패/취소 시 기존 편집본은 유지한다. 영상 추가/삭제/순서 변경은 원본에 쓰지 않는다. 이 기능은 YouTube 플레이어가 제공한 ID 목록 범위이며 전체 원본 수집이나 제목 조회를 보장하지 않는다.

## 근거

- https://github.com/Bearsharks/simple-music-player/blob/9e52a5c/src/refs/api.ts
- https://github.com/Bearsharks/simple-music-player/blob/9e52a5c/src/refs/storeStateManager.ts
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API
- https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
