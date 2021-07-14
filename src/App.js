import './App.scss';
import Spinner from './Spinner';
import { useEffect, useRef, useState, memo } from 'react';
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { musicListStateManager, useInitMusicPlayer } from "./recoilStates/musicListStateManager"
import { useRecoilState } from 'recoil';
import { musicListState, curMusicIndexState } from "./recoilStates/atoms/musicListStates";
import MusicListDraggable from './MusicList/MusicListDraggable';
import youtubeSearch from './refs/youtubeSearch';
function App() {
	const [musicListRaw, setMusicListRaw] = useState("");
	const [isInited, setIsInited] = useState(false);
	const musicListRecoilState = useRecoilState(musicListState);
	const musicList = musicListRecoilState[0];
	const curMusicIndexRecoilState = useRecoilState(curMusicIndexState);
	const curMusicIndex = curMusicIndexRecoilState[0];
	const mlsm = new musicListStateManager(musicListRecoilState, curMusicIndexRecoilState);
	const playMusic = (musicInfo) => {
		if (!window.player) return;
		if (musicInfo.id) {
			window.player.loadVideoById({ videoId: musicInfo.id });
			return;
		}
		youtubeSearch(musicInfo.q).then(res => {
			if (res.status === 200) {
				return res.json();
			} else {
				throw new Error('request fail');
			}
		}).then(json => {
			let id = json.items[0].id.videoId;
			window.player.loadVideoById({ videoId: id });
			mlsm.initMusicInfo(musicInfo.idx, musicInfo.q, json.items);
		}).catch();
	}
	const stopMusic = () => {
		if (window.player && window.player.stopVideo) window.player.stopVideo();
	};
	useInitMusicPlayer(playMusic, stopMusic);

	const handleTextAreaChange = (e) => {
		setMusicListRaw(e.target.value);
	}
	const musicListAppend = () => {
		if (musicListRaw === "") return;
		let newMusicQueryList = musicListRaw.split("\n").filter((element) => element !== "");
		if (newMusicQueryList.length < 1) return;
		mlsm.appendMusicList(newMusicQueryList);
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
											<MusicListDraggable
												key={ele.key}
												ele={ele}
												index={index}
												selectMusic={mlsm.selectMusic}
												deleteMusic={deleteMusic}
												modMusicList={mlsm.modMusicList}
												isCurMusic={(curMusicIndex == index)}
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

export default memo(App);
