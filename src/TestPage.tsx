import './Test.scss';
import { useRecoilValue } from "recoil";
import { useCurMusicManager, useMusicListManager, usePlaylistManager, playlistIDsState, musicListState } from "./recoilStates/atoms/playlistAtoms";
import FormBox from './components/FormBox';
import { useState } from 'react';
import { MusicListAction, MusicListActionType, PlaylistAction, PlaylistActionType, MusicInfo_tmp as MusicInfo } from './refs/constants';
function TestPage() {
    const musicList = useRecoilValue(musicListState);
    const ids = useRecoilValue(playlistIDsState);
    const [selectedPlaylist, setPlaylist] = useState("");
    const playlistManager = usePlaylistManager();
    const curMusicInfo = useCurMusicManager();
    const musicListManager = useMusicListManager();

    const selectPlaylist: React.MouseEventHandler<HTMLDivElement> = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.stopPropagation();
        const tgt: any = e.target;
        setPlaylist(tgt.firstChild.textContent);
    }
    const addItems: React.MouseEventHandler<HTMLButtonElement> = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.stopPropagation();
        e.preventDefault();

        const action: PlaylistAction = {
            type: PlaylistActionType.UPDATE,
            payload: {
                info: {
                    id: selectedPlaylist
                },
                items: [
                    {
                        videoID: "11",
                        name: "노래1",
                        query: selectedPlaylist
                    },
                    {
                        videoID: "22",
                        name: "노래2",
                        query: selectedPlaylist
                    }]
            }
        };
        playlistManager(action);
    }

    const setMusiclist = (playlistid: string) => {
        const action: MusicListAction = {
            type: MusicListActionType.GET,
            payload: playlistid
        }
        musicListManager(action);
    }
    const appendMusiclist = (playlistid: string) => {
        const action: MusicListAction = {
            type: MusicListActionType.APPEND_PLAYLIST,
            payload: playlistid
        }
        musicListManager(action);
    }
    const createPlaylist = (form: HTMLFormElement) => {
        const inputs = form.getElementsByTagName("input");
        const info = {
            name: inputs[0].value,
            description: inputs[0].value
        }
        const createAction: PlaylistAction = {
            type: PlaylistActionType.CREATE,
            payload: {
                info: info,
                items: []
            }
        }
        playlistManager(createAction);
    }

    return (
        <div>테스트 페이지입니다.
            <button onClick={addItems}>기본추가</button>
            <div className="playlistids"
                onClick={selectPlaylist}
            >{
                    ids.map((el: string) => <div key={el}>
                        {el}
                        <button onClick={() => setMusiclist(el)}>재생</button>
                        <button onClick={() => appendMusiclist(el)}>추가</button>
                    </div>)
                }
            </div>
            <div>
                <FormBox submit={createPlaylist}></FormBox>
            </div>
            <div className="musiclists">{
                musicList.map((el: MusicInfo, idx: number) => <div key={idx}>{JSON.stringify(el)}</div>)
            }
            </div>
        </div>
    );
}


export default TestPage;