import './App.scss';
import Spinner from './Spinner';
import { useEffect, useRef, useState } from 'react';

import Playlists from './Playlists';
import MusicList from './MusicList/MusicList';
function App() {
	const [isInited, setIsInited] = useState(false);
	const [youtubeKey, setYoutubeKey] = useState("");
	const goNextMusicRef = useRef();
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
					events: {
						'onStateChange': (event) => {
							if (event.data === 0) {
								goNextMusicRef.current();
							}
						},
						'onReady': () => setIsInited(true)
					},
				});

			}

		}
	}, []);

	return (
		<div className="App">
			<div className={`playerwrapper`} id={`player`}></div>
			{!isInited && <Spinner></Spinner>}
			{isInited &&
				<main>
					<label>유튜브 api 키</label>
					<input type="text" onChange={handleChangeYoutubeKey} value={youtubeKey}></input>
					<Playlists>	</Playlists>
					<MusicList goNextRef={goNextMusicRef}></MusicList>

				</main>
			}
		</div >
	);
}

export default App;
