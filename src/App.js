
import './App.scss';
import Spinner from './Spinner';
import { useEffect, useRef, useState } from 'react';
import Testtset from './Testtset';
function App() {
	const test = useRef();
	const [musicListRaw, setMusicListRaw] = useState("");
	const [musicList, setMusicList] = useState([]);
	const [curMusicIdx, setCurMusicIdx] = useState(-1);
	const [curMusicInfo, setCurMusicInfo] = useState("");
	const [isInited, setIsInited] = useState(false);
	const handleTextAreaChange = (e) => {
		setMusicListRaw(e.target.value);
	}
	const musicListAppend = () => {
		if (musicListRaw === "") return;
		let newMusicList = musicListRaw.split("\n").filter((element) => element !== "");
		newMusicList = newMusicList.map((el) => { return { q: el, etag: null, id: null } });
		if (newMusicList.length < 1) return;
		newMusicList = [...musicList, ...newMusicList];
		setMusicList(newMusicList);
		setMusicListRaw("");
		if (curMusicIdx === -1) setCurMusicIdx(0);
	}
	const playMusic = (idx) => {
		if (idx >= musicList.length || idx < 0) return;
		setCurMusicIdx(idx);
		setCurMusicInfo(musicList[idx]);
		if (musicList[idx].id) {
			window.player.loadVideoById({ videoId: musicList[idx].id });
			return;
		}
		let params = {
			part: `id`,
			maxResults: 1,
			type: `video`,
			topic: `/m/04rlf`,
			q: `${musicList[idx].q} official audio`
		}
		let query = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
		//const fields = `items(id,snippet(title,description,thumbnails))`;
		const fields = `etag,items(id)`;
		//const key = `AIzaSyBhZ-w1w_g-YVg1Tkovnw7FGIGsEUZz4is`
		const key = `AIzaSyBJwDMPWPGnzeDUqogskimWlGHLbqTQjcM`;
		let url = `https://www.googleapis.com/youtube/v3/search?key=${key}&fields=${fields}&${query}`;
		fetch(url, {
			method: 'GET',
			headers: {
				'If-None-Match': musicList[idx].etag
			}
		}
		).then(res => {
			if (res.status === 200) {
				return res.json();
			} else {
				throw new Error('request fail');
			}
		}).then(json => {
			if (!json.items) {
				window.player.loadVideoById({ videoId: musicList[idx].id });
				return;
			}
			let nextMusicId = json.items[0].id.videoId;
			window.player.loadVideoById({ videoId: nextMusicId });
			let music = musicList[idx];
			music.id = nextMusicId;
			music.etag = json.etag;
			setMusicList(list => {
				let copy = list.slice();
				copy[idx] = music;
				return copy;
			})
		}).catch();
	}
	const goPrevMusic = () => {
		if (curMusicIdx === 0) return;
		setCurMusicIdx(idx => idx - 1);
	}
	const goNextMusic = () => {
		if (curMusicIdx === musicList.length - 1) return;
		setCurMusicIdx(idx => idx + 1);
	}
	const deleteMusic = (e, idx) => {
		e.stopPropagation();
		const newList = musicList.filter((item, index) => index !== idx);
		if (idx === musicList.length - 1 || curMusicIdx > idx) {
			setCurMusicIdx(cur => cur - 1);
		}
		setMusicList(newList);
	}
	useEffect(() => {
		if (!window.YT) { // If not, load the script asynchronously
			const tag = document.createElement('script');
			tag.src = 'https://www.youtube.com/iframe_api';

			const firstScriptTag = document.getElementsByTagName('script')[0];
			firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

			const onStateChange = (event) => {
				if (event.data === 0) {
					setCurMusicIdx(prev => prev + 1);
				}
			}

			window.player = null;

			window.onYouTubeIframeAPIReady = function () {
				window.player = new window.YT.Player('player', {
					height: '360',
					width: '640',
					events: {
						'onStateChange': onStateChange
					},
				});
				setIsInited(true);
			}

		}
	}, [curMusicIdx]);
	const onChangeMusicIdx = (idx) => {
		if (musicList.length <= idx || idx < 0) {
			window.player.stopVideo();
		} else if (musicList[idx].id !== curMusicInfo.id) {
			playMusic(idx);
		}
	}
	useEffect(() => {
		if (window.player) {
			onChangeMusicIdx(curMusicIdx);
		}
	}, [musicList, curMusicIdx, curMusicInfo]);

	// 	events: {
	// 		'onStateChange': window.onStateChangehandler
	// 	}
	// 
	return (
		<div className="App">
			<Testtset></Testtset>
			<main>
				{!isInited && <Spinner></Spinner>}
				<div className={`playerwrapper`} ref={test} id={`player`}>

					{/* {curMusic &&
						<iframe title="player" id="ytplayer" type="text/html" width="640" height="360"
							src={`https://www.youtube.com/embed/${curMusic}?autoplay=1`}
							frameborder="0">
						</iframe>
					} */}
				</div>
				<div className={`side`}>
					<textarea value={musicListRaw} onChange={handleTextAreaChange} />
					<button onClick={musicListAppend}>append</button>
					<button onClick={goPrevMusic} >이전 </button> <button onClick={goNextMusic}>다음 </button>
					<ul>
						{
							musicList.map((ele, index) => <li key={index} className={(index === curMusicIdx) ? `curMusic` : ""} onClick={(e) => onChangeMusicIdx(index)}>{ele.q} <button onClick={(e) => deleteMusic(e, index)}>X </button></li>)
						}
					</ul>
				</div>

			</main>

		</div>
	);
}

export default App;
