import React from 'react';
import { useRecoilState } from 'recoil';
import HamburgerBtn from 'features/navigation/ui/HamburgerBtn';
import { sideMenuOpenState } from 'features/navigation/model/sideMenu';

interface HamburgerBtnRecoilProps {
    onClickHandler?: (e: React.MouseEvent, isOpen: boolean) => void;
    initialValue?: boolean;
}
function HamburgerBtnRecoil(props: HamburgerBtnRecoilProps) {
    const [isActive, setActive] = useRecoilState(sideMenuOpenState);

    return <HamburgerBtn {...props} isActive={isActive} setActive={setActive} />;
}

export default HamburgerBtnRecoil;
