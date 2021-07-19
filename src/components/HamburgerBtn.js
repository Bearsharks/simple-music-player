import styles from './HamburgerBtn.module.scss';
import { useState } from 'react';
/*
* props.clickHandler : 햄버거버튼 누르면 발생하는 이벤트처리
* props.initialValue : 초기 상태
*/
function HamburgerBtn(props) {
    const [isActive, setActive] = useState(props.initialValue);
    const togleActive = (e) => {
        const val = (isActive) ? false : true;
        setActive(val);
        props.clickHandler(e, val);
    }
    return (

        <div
            className={styles[`hamburger-btn`]}
            onClick={togleActive}
        >
            <div
                className={styles[`hamburger`] + " " + ((isActive) ? styles[`hamburger--active`] : "")}
            />
        </div>


    );
}

export default HamburgerBtn;
