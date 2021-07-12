
import './App.scss';
import Spinner from './Spinner';
import { useEffect, useRef, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { musicListStateManager, usePlayMusic } from "./recoilStates/musicListStateManager"
import { useRecoilValue, useRecoilState } from 'recoil';
import { musicListState, curMusicInfoState } from "./recoilStates/atoms/musicListAtoms";
import { storeState } from "./recoilStates/atoms/storeAtoms";
import storeStateManager from './recoilStates/storeStateManager';
import MusicListEle from './MusicList/MusicListEle';
function App() {
	const [musicListRaw, setMusicListRaw] = useState("");
	const [isInited, setIsInited] = useState(false);
	const a = useRecoilState(musicListState);
	const musicList = a[0];
	const mlsm = new musicListStateManager(a, useRecoilState(curMusicInfoState));
	const ssm = new storeStateManager(useRecoilState(storeState));
	const playMusic = usePlayMusic(

		(musicInfo) => {
			if (!window.player) return;
			if (musicInfo.id) {
				window.player.loadVideoById({ videoId: musicInfo.id });
				return;
			}
			let storageData = ssm.get(musicInfo.q);
			if (storageData) {
				debugger;
				let id = storageData.items[0].id.videoId;
				mlsm.modMusicList(musicInfo.idx, { id: id });
				window.player.loadVideoById({ videoId: id });
				return;
			}
			let params = {
				part: `id`,
				maxResults: 5,
				type: `video`,
				topic: `/m/04rlf`,
				q: `${musicInfo.q} official audio`
			}
			let query = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
			const fields = `items(id,snippet(title,description,thumbnails))`;
			//const key = `AIzaSyBhZ-w1w_g-YVg1Tkovnw7FGIGsEUZz4is`
			const key = `AIzaSyBJwDMPWPGnzeDUqogskimWlGHLbqTQjcM`;
			let url = `https://www.googleapis.com/youtube/v3/search?key=${key}&fields=${fields}&${query}`;
			fetch(url, { method: 'GET' }).then(res => {
				if (res.status === 200) {
					return res.json();
				} else {
					throw new Error('request fail');
				}
			}).then(json => {
				let id = json.items[0].id.videoId;
				window.player.loadVideoById({ videoId: id });
				mlsm.modMusicList(musicInfo.idx, { id: id });
				debugger;
				ssm.store(musicInfo.q, json);
			}).catch();
		},
		() => {
			if (window.player && window.player.stopVideo) window.player.stopVideo();
		}
	);

	const handleTextAreaChange = (e) => {
		setMusicListRaw(e.target.value);
	}
	const musicListAppend = () => {
		if (musicListRaw === "") return;
		let newMusicQueryList = musicListRaw.split("\n").filter((element) => element !== "");
		if (newMusicQueryList.length < 1) return;
		mlsm.appendMusicList(newMusicQueryList);
		for (let q of newMusicQueryList) {
			ssm.store(q);
		}
		setMusicListRaw("");
	}

	const goNextMusicRef = useRef();
	goNextMusicRef.current = mlsm.goNextMusic;

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
						}
					},
				});
				setIsInited(true);
			}

		}
	}, []);
	const onDragEnd = (result) => {
		// dropped outside the list(리스트 밖으로 드랍한 경우)
		if (!result.destination) {
			return;
		}
		mlsm.reorderMusicList(result.source.index, result.destination.index);
	}
	const onDragStart = (e) => {
		//console.log(musicList);
	}
	const deleteMusic = (idx) => {
		debugger;
		ssm.delete(musicList[idx].q);
		mlsm.deleteMusic(idx);
	}
	return (
		<div className="App">
			<main>
				{!isInited && <Spinner></Spinner>}
				<div className={`playerwrapper`} id={`player`}>
				</div>
				<div className={`side`}>
					<textarea value={musicListRaw} onChange={handleTextAreaChange} />
					<button onClick={musicListAppend}>append</button>
					<button onClick={mlsm.goPrevMusic} >이전 </button> <button onClick={mlsm.goNextMusic}>다음 </button>
					<DragDropContext
						onDragEnd={onDragEnd}
						onDragStart={onDragStart}
					>
						<Droppable droppableId="droppable">
							{(provided, snapshot) => (
								<ul ref={provided.innerRef}>
									{
										musicList.map((ele, index) =>
											<MusicListEle
												key={ele.key}
												ele={ele}
												index={index}
												playMusic={playMusic}
												deleteMusic={deleteMusic}
											/>
										)
									}
									{provided.placeholder}
								</ul>
							)}

						</Droppable>
					</DragDropContext>

				</div>

			</main>

		</div >
	);
}

export default App;
