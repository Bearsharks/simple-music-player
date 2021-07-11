
import './App.scss';
import Spinner from './Spinner';
import { useEffect, useRef, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import musicListStateManager from "./recoilStates/musicListStateManager"
import { useRecoilValue, useRecoilState, useSetRecoilState } from 'recoil';
import { musicListState, curMusicInfoState } from "./recoilStates/atoms/musicListAtoms";
function App() {
	const [musicListRaw, setMusicListRaw] = useState("");
	const musicList = useRecoilValue(musicListState);
	const curMusicInfo = useRecoilValue(curMusicInfoState);
	const [isInited, setIsInited] = useState(false);
	const appendMusicList = musicListStateManager.useAppendMusicList();
	const reorderMusicList = musicListStateManager.useReorderMusicList();
	const goPrevMusic = musicListStateManager.useGoPrevMusic();
	const goNextMusic = musicListStateManager.useGoNextMusic();
	const deleteMusic = musicListStateManager.useDeleteMusic();
	const playMusic = musicListStateManager.usePlayMusic(

		(musicInfo) => {
			if (!window.player) return;
			if (musicInfo.id) {
				window.player.loadVideoById({ videoId: musicInfo.id });
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
				modMusicList(musicInfo.idx, { id: id });
			}).catch();
		}
	);
	const modMusicList = musicListStateManager.useModMusicList();

	const handleTextAreaChange = (e) => {
		setMusicListRaw(e.target.value);
	}
	const musicListAppend = () => {
		if (musicListRaw === "") return;
		let newMusicQueryList = musicListRaw.split("\n");
		if (newMusicQueryList.length < 1) return;
		appendMusicList(newMusicQueryList);
		setMusicListRaw("");
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
	const deleteMusicHandler = (e, index) => {
		e.stopPropagation();
		e.preventDefault();
		deleteMusic(index);
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
														onClick={(e) => { playMusic(index) }}
													>
														{ele.q}<button onClick={(e) => deleteMusicHandler(e, index)}>X </button>
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
