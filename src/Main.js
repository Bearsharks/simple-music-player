import Spinner from './components/Spinner';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from "react-router-dom";
import Playlists from './Playlists';
import MusicList from './MusicList/MusicList';
import HamburgerBtn from './components/HamburgerBtn';
import { useSetRecoilState } from 'recoil';
import { musicPlayState } from "./recoilStates/atoms/musicListStates";
import { PLAYING, PAUSED } from './refs/constants';

function Main() {
	const [isInited, setIsInited] = useState(false);
	const [youtubeKey, setYoutubeKey] = useState("");
	const [navActive, setNavActive] = useState(false);
	const setPlayState = useSetRecoilState(musicPlayState);
	const goNextMusicRef = useRef();
	const navigate = useNavigate();
	const handleChangeYoutubeKey = (e) => {
		setYoutubeKey(e.target.value);
		localStorage.setItem("youtubeKey", e.target.value);
	}
	useEffect(() => {
		setYoutubeKey(localStorage['youtubeKey']);
		if (!window.YT) { // If not, load the script asynchronously
			const tag = document.createElement('script');
			tag.src = 'https://www.youtube.com/iframe_api';

			const firstScriptTag = document.getElementsByTagName('script')[0];
			firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

			window.player = null;

			const widthsize = Math.min(640, window.innerWidth);
			window.onYouTubeIframeAPIReady = function () {
				window.player = new window.YT.Player('player', {
					width: widthsize,
					height: Math.round(widthsize * 10 / 16),
					playerVars: { playsinline: 1, autoplay: 1 },
					events: {
						'onStateChange': (event) => {
							if (event.data === window.YT.PlayerState.ENDED) {
								goNextMusicRef.current();
							} else if (event.data === window.YT.PlayerState.PLAYING) {
								setPlayState(PLAYING)
							} else if (event.data === window.YT.PlayerState.PAUSED) {
								setPlayState(PAUSED)
							}
						},
						'onReady': () => setIsInited(true)
					},
				});
			}
		}
	}, []);
	const navActiveBtnClickHandler = (e, value) => {
		setNavActive(value);
	}
	const logoutBtnClicked = (e) => {
		window.userInfo = undefined;
		const logoutURL = `${process.env.REACT_APP_API_URL}/main/logout`;
		fetch(logoutURL, {
			credentials: 'include',
			cache: 'no-cache'
		}).then(res => {
			return res.text();
		}).then((url) => {
			window.location = url;
		}).catch((err) => {
			console.log(err);
		});
	}
	return (
		<div className="App">
			<header>
				<div className={'nav-btn'}>
					<div className={'title'}>SimpleMusicPlayer</div>
					<HamburgerBtn
						initialValue={navActive}
						clickHandler={navActiveBtnClickHandler}
					></HamburgerBtn>
				</div>

				<nav className={`navigation ` + ((navActive) ? `` : `navigation--hide`)}>
					<label>유튜브 api 키</label>
					<input type="text" onChange={handleChangeYoutubeKey} value={youtubeKey}></input>
					<div onClick={logoutBtnClicked}>로그아웃</div>
					<Playlists>	</Playlists>
				</nav>
			</header>

			<div className={`playerwrapper`} id={`player`}></div>

			{!isInited && <Spinner></Spinner>}
			{isInited &&
				<main>
					<div className={`musiclist-wrapper`}>
						<MusicList goNextRef={goNextMusicRef}></MusicList>
					</div>
				</main>
			}
		</div >
	);
}

export default Main;
