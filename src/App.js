import './App.scss';
import Spinner from './Spinner';
import { useEffect, useRef, useState } from 'react';

import Playlists from './Playlists';
import MusicList from './MusicList/MusicList';
function App() {
	const [isInited, setIsInited] = useState(false);
	const goNextMusicRef = useRef();
	useEffect(() => {
		if (!window.YT) { // If not, load the script asynchronously
			const tag = document.createElement('script');
			tag.src = 'https://www.youtube.com/iframe_api';

			const firstScriptTag = document.getElementsByTagName('script')[0];
			firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

			window.player = null;

			window.onYouTubeIframeAPIReady = function () {
				window.player = new window.YT.Player('player', {
					height: '480',
					width: '640',
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
					<MusicList goNextRef={goNextMusicRef}></MusicList>
					<Playlists>	</Playlists>
				</main>
			}
		</div >
	);
}

export default App;
