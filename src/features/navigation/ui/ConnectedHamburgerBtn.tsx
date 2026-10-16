import React from 'react';
import { useAtom } from 'jotai';
import HamburgerBtn from 'features/navigation/ui/HamburgerBtn';
import { sideMenuOpenState } from 'features/navigation/model/sideMenu';

interface HamburgerBtnConnectedProps {
    onClickHandler?: (e: React.MouseEvent, isOpen: boolean) => void;
    initialValue?: boolean;
}
function HamburgerBtnConnected(props: HamburgerBtnConnectedProps) {
    const [isActive, setActive] = useAtom(sideMenuOpenState);

    return <HamburgerBtn {...props} isActive={isActive} setActive={setActive} />;
}

export default HamburgerBtnConnected;
