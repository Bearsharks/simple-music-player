import type { ReactNode } from 'react';
export interface SideMenuProps { isActive: boolean; setActive: (active: boolean) => void; children?: ReactNode }
export default function SideMenu({isActive, setActive, children}: SideMenuProps) {
  return isActive ? <aside aria-label="메뉴"><p>이 브라우저에 저장되는 로컬 재생목록</p>{children}<button onClick={() => setActive(false)}>닫기</button></aside> : null;
}
