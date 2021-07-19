import { useEffect, useState, useRef, memo } from 'react';
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { musicListStateManager, useInitMusicPlayer } from "../recoilStates/musicListStateManager"
import { useRecoilState } from 'recoil';
import { musicListState, curMusicIndexState } from "../recoilStates/atoms/musicListStates";
import MusicListDraggable from './MusicListDraggable';
import youtubeSearch from '../refs/youtubeSearch';
import styles from './MusicList.module.scss';
function MusicList(props) {
    const [musicListRaw, setMusicListRaw] = useState("");
    const musicListRecoilState = useRecoilState(musicListState);
    const musicList = musicListRecoilState[0];
    const curMusicIndexRecoilState = useRecoilState(curMusicIndexState);
    const curMusicIndex = curMusicIndexRecoilState[0];
    const musiclistWrapperRef = useRef();
    const mlsm = new musicListStateManager(musicListRecoilState, curMusicIndexRecoilState);
    const playMusic = (musicInfo) => {
        if (!window.player) return;
        if (musicInfo.id) {
            window.player.loadVideoById({ videoId: musicInfo.id });
            return;
        }
        youtubeSearch(musicInfo.q)
            .then(data => {
                window.player.loadVideoById({ videoId: data[0].videoId });
                mlsm.initMusicInfo(musicInfo.idx, musicInfo.q, data, 0);
            }).catch((err) => {
                console.error(err);
            });
    }
    const stopMusic = () => {
        if (window.player && window.player.stopVideo) window.player.stopVideo();
    };
    useInitMusicPlayer(playMusic, stopMusic);

    useEffect(() => {
        let musiclistWrapperTop = window.pageYOffset + musiclistWrapperRef.current.getBoundingClientRect().top;
        let musiclistWrapperHeight = window.innerHeight - Math.ceil(musiclistWrapperTop);
        musiclistWrapperRef.current.style.height = `${musiclistWrapperHeight}px`;
    }, [])

    useEffect(() => {
        if (curMusicIndex >= 0) {
            debugger;
            let defaultOffset = parseInt(musiclistWrapperRef.current.style.height) / 3;
            musiclistWrapperRef.current.scrollTop = -defaultOffset + musiclistWrapperRef.current.getElementsByClassName('musicListElement')[curMusicIndex].offsetTop - musiclistWrapperRef.current.offsetTop;
        }
    }, [curMusicIndex])

    useEffect(() => {
        props.goNextRef.current = mlsm.goNextMusic;
    }, [mlsm.goNextMusic]);

    const handleTextAreaChange = (e) => {
        setMusicListRaw(e.target.value);
    }

    const musicListAppend = async () => {
        if (musicListRaw === "") return;
        let newMusicQueryList = musicListRaw.split("\n").filter((element) => element !== "");
        if (newMusicQueryList.length < 1) return;
        setMusicListRaw("");
        await mlsm.appendMusicList(newMusicQueryList);
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
        <div>
            <div className={styles[`controller`]}>
                <div className={styles[`controller-append`]}>
                    <textarea
                        cols={30} rows={5}
                        value={musicListRaw}
                        onChange={handleTextAreaChange}
                        placeholder={`음악명 ex) next level aespa
혹은 유튜브링크 복붙`}
                    />
                    <button onClick={musicListAppend}>append</button>
                </div>
                <div>
                    <button onClick={mlsm.goPrevMusic}>이전 </button>
                    <button onClick={mlsm.goNextMusic}>다음 </button>
                </div>

            </div>
            <div
                className={styles['musiclist-wrapper']}
                ref={musiclistWrapperRef}
            >
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

        </div>
    )
}
export default memo(MusicList);