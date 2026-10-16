import SideMenu from 'features/navigation/ui/SideMenu';
import { sideMenuOpenState } from 'features/navigation/model/sideMenu';
import { useRecoilState } from 'recoil';

function SideMenuRecoil({ children }: { children?: React.ReactNode }) {
    const [isActive, setActive] = useRecoilState(sideMenuOpenState);
    return <SideMenu children={children} isActive={isActive} setActive={setActive} />;
}

export default SideMenuRecoil;
