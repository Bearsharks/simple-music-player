import styles from './PlaylistsRecoil.module.scss';
import { useRecoilValue, useSetRecoilState } from "recoil";
import { useMusicListManager, usePlaylistManager, playlistInfosState } from "./recoilStates/atoms/playlistAtoms";
import { useFormPopupManager, OptionSelectorState, OptionSelectorOpenState, FormKind } from './recoilStates/PopupStates';
import { MusicListAction, MusicListActionType, PlaylistAction, PlaylistActionType, MusicInfo, PlaylistInfo, MusicInfoActionType } from './refs/constants';
import Playlists from './components/Playlists';
function TestPage() {
    const playlistInfos = useRecoilValue(playlistInfosState);
    const playlistManager = usePlaylistManager();
    const musicListManager = useMusicListManager();
    const formPopupManager = useFormPopupManager();
    const setOptionSelectorState = useSetRecoilState(OptionSelectorState);
    const setOptionSelectorOpen = useSetRecoilState(OptionSelectorOpenState);

    const addItems: React.MouseEventHandler<HTMLButtonElement> = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.stopPropagation();
        e.preventDefault();
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

    const setMusiclist = (playlistid: string) => {
        const action: MusicListAction = {
            type: MusicListActionType.SET,
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

    
    const openCreatePlaylistPopup = () => {
        formPopupManager(FormKind.CreatePlaylist);
    }

    const openOptionsSelector = (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        setOptionSelectorOpen(false);
        const test = (e?: any) => {
            console.log("test");
        }
        setOptionSelectorState({
            target: e.target as HTMLElement, items: [
                { icon: "S", name: "재생목록에 추가", onClickHandler: test },
                { icon: "A", name: "다음 음악으로 추가", onClickHandler: test },
                { icon: "U", name: "재생목록 수정", onClickHandler: test },
                { icon: "X", name: "재생목록 삭제", onClickHandler: test },
            ]
        });
        setOptionSelectorOpen(true);
    }

    return (
        <div>플레이리스트
            <button onClick={openCreatePlaylistPopup}>새 재생목록</button>
            <Playlists
                playlistInfos={playlistInfos}
                playPlaylist={setMusiclist}
                openOptionsSelector={openOptionsSelector}
            ></Playlists>
        </div>
    );
}


export default TestPage;