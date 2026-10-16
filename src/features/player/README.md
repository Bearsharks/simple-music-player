# player

YouTube iframe 수명·재생 제어·진행률·음량. api/iframe.ts가 외부 스크립트 로딩을 소유한다. 전역 player 접근 제거는 후속 과제다.

공통 지침: [아키텍처](../../../docs/ARCHITECTURE.md). 변경 뒤 `npm run check`. 컴포넌트와 스타일은 함께 이동하고 테스트에 같은 변경을 반영한다.
