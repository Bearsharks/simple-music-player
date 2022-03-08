import SideMenu from 'components/SideMenu';
import { sideMenuOpenState } from 'recoilStates/sideMenu';
import { useRecoilState } from 'recoil';

function SideMenuRecoil({ children }: { children?: React.ReactNode }) {
    const [isActive, setActive] = useRecoilState(sideMenuOpenState);
    return <SideMenu children={children} isActive={isActive} setActive={setActive} />;
}

export default SideMenuRecoil;
