import React, { useRef } from "react";
import { doSignIn } from "refs/api";
import styles from './LoginPage.module.scss'
const imgSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAArlBMVEVHcEw/hfbvgxs6ic4yqlQ/gvJAhvhhepCmcULsQjPsQjPqQjPsQjQzqVPrQjPxeSAyq1QyqlQxp1PnQTL8vwAzqVTrQjMyqlQ5qVE/hPU/hPYyqlQ+g/X9wAA/h/TtQjP7vADqQTP9wAA/hPU/hff7uQXzhxk3l5zAth4+g/P8wAA5k7LeuhPnQTM+gvEyp1P5uwAxplM/hPUyp1H3rAjtaCSIsDI6i8w0n3RXq0M974clAAAALXRSTlMAjQ8P7TDhAwjwcUbYSKE0gNAdHr1rup0x8Lm1SomBgmBf6c2gpff892Rt4qhtntK7AAACRUlEQVRYw+1XaXeiMBRFgg1r2GQTq7XaTjszGiitM/P//9gQljSWABFPv3nVox+89928Je8gSTfc8M1QfdsgsH11Als2dGSaGoFpIt2QL6P7eqgdWGjh1r8gum4eugi3oi6ML9EpkC2UOm74GqYxnk51ox36YdrX8TVdHfV/HV/anvE1M0QIhaYmyoc+mz8TGb4MJSj7BtLE4quIiY5sVYKNsGqEInzJ0JjjnneNvBHgy08flL+FX04H4Sgf2o/vz218OGH+4H2WZbUCmjK/UF6UAtn7h0i/cWE/Zo3CZsoBJPiQNXhmDEAw5wD0pqDCgqkgXN9xsOZZVJ9agXtWdnbs4m3PFVi0Aj9HBZa8KslU4GFM4LgE3yFw0RHAlUnk5qCnjLO3TwxXQaKN9BIzAqvZJ3atArcPYNPK2Qk7kB1jCrBsBV7510GVxZd/OXZj7h9WScNP5v3jTPgYR9wk7VsDO9A7jqeC8LESwAEDx1nPtMq/TznOq3dXAc5pCpNV30RbCq4MYKJwbhOudsN9WPdSVAnUp4hixoQX/DqOG5Ck2K3jk1cpYXmgXCyqZzkuzn+0AnswcCtZSpUDAuLCTaMoSl2l/F0Uf/9U/Lv54G5ylAJ3QfTyWiF5Hb4wS4UunSgQD+UxkjUYuVtBR6Gg36XCKL/0ECiV57YlmqrUpXGAyP1upZj2Q+2++mDsWoIbywtcGhRTI4rjiW8ZL0gVNollRZ34sn0FLKdsgBpu6ljehHUHvdgiiD110rJsbqTbU8sNAvgPj0mre8ZWN6oAAAAASUVORK5CYII='


function SignInPage() {
    const inputRef = useRef<HTMLInputElement>(null);
    const signIn = () => {
        if (inputRef.current) {
            doSignIn(inputRef.current.checked);
        }
    }
    const testSignIn = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const loginURL = `${process.env.REACT_APP_API_URL}/testLogin`;
        try {
            const res = await fetch(loginURL, { credentials: 'include' });
            if (res.status !== 200) throw new Error("500");
            (window as any).location = "/simple-music-player";
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <div className={styles['wrapper']}>
            <div className={styles['login-box']}>
                <div className={styles['login-box__login-button']} onClick={signIn}>
                    <img src={imgSrc} alt='구글로그인아이콘' />
                    <label>Google 계정으로 로그인</label>
                </div>
                <div className={styles['login-box__stay']}>
                    <label>
                        로그인 유지
                        <input type="checkbox" ref={inputRef} name="chk_info"></input>
                    </label>

                </div>
                <button onClick={testSignIn}>테스트 계정으로 로그인</button>
            </div>
        </div>
    );
}
export default SignInPage;