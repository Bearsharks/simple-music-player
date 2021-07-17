import { useEffect, useState, memo } from 'react';
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { musicListStateManager, useInitMusicPlayer } from "../recoilStates/musicListStateManager"
import { useRecoilState } from 'recoil';
import { musicListState, curMusicIndexState } from "../recoilStates/atoms/musicListStates";
import MusicListDraggable from './MusicListDraggable';
import youtubeSearch from '../refs/youtubeSearch';
function MusicList(props) {
    const [musicListRaw, setMusicListRaw] = useState("");
    const [youtubeKey, setYoutubeKey] = useState("");
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
        youtubeSearch(musicInfo.q)
            .then(json => {
                let id = json.items[0].id.videoId;
                window.player.loadVideoById({ videoId: id });
                mlsm.initMusicInfo(musicInfo.idx, musicInfo.q, json.items);
            }).catch((err) => {
                console.error(err);
            });
    }
    const stopMusic = () => {
        if (window.player && window.player.stopVideo) window.player.stopVideo();
    };
    useInitMusicPlayer(playMusic, stopMusic);

    useEffect(() => {
        props.goNextRef.current = mlsm.goNextMusic;
        setYoutubeKey(localStorage['youtubeKey']);
    }, [mlsm.goNextMusic]);

    const handleTextAreaChange = (e) => {
        setMusicListRaw(e.target.value);
    }
    const handleChangeYoutubeKey = (e) => {
        setYoutubeKey(e.target.value);
        localStorage.setItem("youtubeKey", e.target.value);
    }
    const musicListAppend = () => {
        if (musicListRaw === "") return;
        let newMusicQueryList = musicListRaw.split("\n").filter((element) => element !== "");
        if (newMusicQueryList.length < 1) return;
        setMusicListRaw("");
        mlsm.appendMusicList(newMusicQueryList);
    }


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
        <div className={`side`}>
            <label>유튜브 api 키</label>
            <input type="text" onChange={handleChangeYoutubeKey} value={youtubeKey}></input>
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
    )
}
export default memo(MusicList);