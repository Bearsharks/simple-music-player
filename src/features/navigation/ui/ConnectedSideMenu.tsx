import SideMenu from 'features/navigation/ui/SideMenu';
import { sideMenuOpenState } from 'features/navigation/model/sideMenu';
import { useAtom } from 'jotai';

function SideMenuConnected({ children }: { children?: React.ReactNode }) {
    const [isActive, setActive] = useAtom(sideMenuOpenState);
    return <SideMenu children={children} isActive={isActive} setActive={setActive} />;
}

export default SideMenuConnected;
