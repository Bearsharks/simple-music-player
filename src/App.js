
import './App.scss';
import Spinner from './Spinner';
import { useEffect, useRef, useState } from 'react';
import Testtset from './Testtset';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import musicListStateManager from "./recoilStates/musicListStateManager"
import { useRecoilValue, useRecoilState, useSetRecoilState } from 'recoil';
import { musicListState, curMusicInfoState } from "./recoilStates/atoms/musicListAtoms";
function App() {
	const test = useRef();
	const [musicListRaw, setMusicListRaw] = useState("");
	const [musicList, setMusicList] = useRecoilState(musicListState);
	const [curMusicInfo, setCurMusicInfo] = useRecoilState(curMusicInfoState);
	const [isInited, setIsInited] = useState(false);
	const reorderMusicList = musicListStateManager.useReorderMusicList();
	const goPrevMusic = musicListStateManager.useGoPrevMusic();
	const goNextMusic = musicListStateManager.useGoNextMusic();
	const deleteMusic = musicListStateManager.useDeleteMusic();
	const handleTextAreaChange = (e) => {
		setMusicListRaw(e.target.value);
	}
	let keycnt = 0;
	const musicListAppend = () => {
		if (musicListRaw === "") return;
		let newMusicList = musicListRaw.split("\n").filter((element) => element !== "");
		newMusicList = newMusicList.map((el) => { return { q: el, id: null, key: "" + keycnt++ } });
		if (newMusicList.length < 1) return;
		newMusicList = [...musicList, ...newMusicList];
		setMusicList(newMusicList);
		setMusicListRaw("");
		if (curMusicInfo.key === musicListStateManager.NOT_VALID_MUSIC_INFO.key) {
			setCurMusicInfo({
				idx: 0,
				id: newMusicList[0].id,
				key: newMusicList[0].key,
			});
		}
	}
	const playMusic = (musicInfo) => {
		if (musicInfo.idx >= musicList.length || musicInfo.idx < 0) return;
		const curMusic = musicList[musicInfo.idx];
		if (curMusic.id) {
			window.player.loadVideoById({ videoId: curMusic.id });
			return;
		}
		let params = {
			part: `id`,
			maxResults: 5,
			type: `video`,
			topic: `/m/04rlf`,
			q: `${curMusic.q} official audio`
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
			if (!json.items) {
				window.player.loadVideoById({ videoId: curMusic.id });
				return;
			}
			let id = json.items[0].id.videoId;
			window.player.loadVideoById({ videoId: id });

			let curMusic_update = { ...curMusic, id: id };
			const newlist = musicList.map((item, i) => {
				if (musicInfo.idx === i) {
					return curMusic_update;
				}
				return item;
			});
			setMusicList(newlist);
		}).catch();
	}
	useEffect(() => {
		if (!window.YT) { // If not, load the script asynchronously
			const tag = document.createElement('script');
			tag.src = 'https://www.youtube.com/iframe_api';

			const firstScriptTag = document.getElementsByTagName('script')[0];
			firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

			const onStateChange = (event) => {
				if (event.data === 0) {
					goNextMusic();
				}
			}

			window.player = null;

			window.onYouTubeIframeAPIReady = function () {
				window.player = new window.YT.Player('player', {
					height: '480',
					width: '640',
					events: {
						'onStateChange': onStateChange
					},
				});
				setIsInited(true);
			}

		}
	}, [goNextMusic]);
	const selectMusic = (e, idx) => {
		debugger;
		setCurMusicInfo({
			idx: idx,
			id: musicList[idx].id,
			key: musicList[idx].key,
		});
	}

	useEffect(() => {
		if (window.player && curMusicInfo.key !== musicListStateManager.NOT_VALID_MUSIC_INFO.key) {
			playMusic(curMusicInfo);
		}
	}, [curMusicInfo]);
	// 	events: {
	// 		'onStateChange': window.onStateChangehandler
	// 	}
	// a little function to help us with reordering the result
	const reorder = (list, startIndex, endIndex) => {
		const result = Array.from(list);
		const [removed] = result.splice(startIndex, 1);
		result.splice(endIndex, 0, removed);

		return result;
	};
	const onDragEnd = (result) => {
		// dropped outside the list(리스트 밖으로 드랍한 경우)
		if (!result.destination) {
			return;
		}
		reorderMusicList(result.source.index, result.destination.index);
	}
	const onDragStart = (e) => {
		//console.log(musicList);
	}

	return (
		<div className="App">
			<Testtset></Testtset>
			<main>
				{!isInited && <Spinner></Spinner>}
				<div className={`playerwrapper`} ref={test} id={`player`}>
				</div>
				<div className={`side`}>
					<textarea value={musicListRaw} onChange={handleTextAreaChange} />
					<button onClick={musicListAppend}>append</button>
					<button onClick={goPrevMusic} >이전 </button> <button onClick={goNextMusic}>다음 </button>
					<DragDropContext
						onDragEnd={onDragEnd}
						onDragStart={onDragStart}
					>
						<Droppable droppableId="droppable">
							{(provided, snapshot) => (
								<ul ref={provided.innerRef}>
									{
										musicList.map((ele, index) =>
											<Draggable
												key={ele.key}
												draggableId={ele.key}
												index={index}
											>
												{(provided, snapshot) =>
													<li
														ref={provided.innerRef}
														{...provided.draggableProps}
														{...provided.dragHandleProps}
														onClick={(e) => { selectMusic(e, index) }}
													>
														{ele.q}<button onClick={(e) => deleteMusic(e, index)}>X </button>
													</li>
												}
											</Draggable>
										)
									}
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
