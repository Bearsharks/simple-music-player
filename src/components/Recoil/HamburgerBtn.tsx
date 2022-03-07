import React from 'react';
import { useRecoilState } from 'recoil';
import HamburgerBtn from '../HamburgerBtn';
import { sideMenuOpenState } from '../../recoilStates/sideMenu';

interface HamburgerBtnRecoilProps {
    onClickHandler?: (e: React.MouseEvent, isOpen: boolean) => void;
    initialValue?: boolean;
}
function HamburgerBtnRecoil(props: HamburgerBtnRecoilProps) {
    const [isActive, setActive] = useRecoilState(sideMenuOpenState);

    return <HamburgerBtn {...props} isActive={isActive} setActive={setActive} />;
}

export default HamburgerBtnRecoil;
