import { useEffect, useState, useRef, memo } from 'react';
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { musicListStateManager, useInitMusicPlayer } from "../recoilStates/musicListStateManager"
import { useRecoilValue, useRecoilState } from 'recoil';
import { musicListState, curMusicIndexState, musicPlayState } from "../recoilStates/atoms/musicListStates";
import MusicListDraggable from './MusicListDraggable';
import youtubeSearch from '../refs/youtubeSearch';
import styles from './MusicList.module.scss';
import { PLAYING } from '../refs/constants';
function MusicList(props) {
    const [musicListRaw, setMusicListRaw] = useState("");
    const musicListRecoilState = useRecoilState(musicListState);
    const musicList = musicListRecoilState[0];
    const curMusicIndexRecoilState = useRecoilState(curMusicIndexState);
    const curMusicIndex = curMusicIndexRecoilState[0];
    const musiclistWrapperRef = useRef();
    const isPlaying = useRecoilValue(musicPlayState);
    const [isRoop, setRoop] = useState(false);
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
            let defaultOffset = parseInt(musiclistWrapperRef.current.style.height) / 3;
            if (!musiclistWrapperRef.current.getElementsByClassName('musicListElement')[curMusicIndex]) return;
            musiclistWrapperRef.current.scrollTop = -defaultOffset + musiclistWrapperRef.current.getElementsByClassName('musicListElement')[curMusicIndex].offsetTop - musiclistWrapperRef.current.offsetTop;
        }
    }, [curMusicIndex])

    useEffect(() => {
        props.goNextRef.current = () => {
            if (!window.player) return;
            if (isRoop) window.player.seekTo(0);
            else mlsm.goNextMusic();
        }
    }, [props.goNextRef, mlsm, isRoop]);

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
    const playBtnClickHandler = () => {
        if (!window.player) return;
        (isPlaying === PLAYING) ? window.player.pauseVideo() : window.player.playVideo();
    }
    const roopBtnChangeHandler = (e) => {
        setRoop(e.target.checked ? true : false);
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
                    <button onClick={musicListAppend}>추가</button>

                </div>
                <div>
                    <button onClick={mlsm.goPrevMusic}>
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none" opacity=".87" /><path d="M17.51 3.87L15.73 2.1 5.84 12l9.9 9.9 1.77-1.77L9.38 12l8.13-8.13z" /></svg>
                    </button>
                    <button onClick={playBtnClickHandler}>
                        {(isPlaying === PLAYING) ?
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none" /><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg> :
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none" /><path d="M10 8.64L15.27 12 10 15.36V8.64M8 5v14l11-7L8 5z" /></svg>
                        }
                    </button>

                    <button onClick={mlsm.goNextMusic}><svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><g><path d="M0,0h24v24H0V0z" fill="none" /></g><g><polygon points="6.23,20.23 8,22 18,12 8,2 6.23,3.77 14.46,12" /></g></svg> </button>

                </div>

            </div>
            <div
                className={styles['musiclist-wrapper']}
                ref={musiclistWrapperRef}
            >
                <div style={
                    { float: 'right' }
                }>
                    <label>반복재생</label>
                    <input type="checkbox" onChange={roopBtnChangeHandler} />
                </div>

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