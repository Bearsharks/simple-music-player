import styles from './PlaylistsRecoil.module.scss';
import { useRecoilValue } from "recoil";
import { useMusicListManager, usePlaylistManager, playlistIDsState } from "./recoilStates/atoms/playlistAtoms";
import { MusicListAction, MusicListActionType, PlaylistAction, PlaylistActionType, MusicInfo_tmp as MusicInfo } from './refs/constants';
function TestPage() {
    const ids = useRecoilValue(playlistIDsState);
    const playlistManager = usePlaylistManager();
    const musicListManager = useMusicListManager();

    const addItems: React.MouseEventHandler<HTMLButtonElement> = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.stopPropagation();
        e.preventDefault();
        //그냥
        const selectedPlaylist = "";
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

    const selectPlaylist: React.MouseEventHandler<HTMLDivElement> = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.stopPropagation();
        const tgt: any = e.target;
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
        <div>플레이리스트
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
        </div>
    );
}


export default TestPage;