import styles from './PlaylistsRecoil.module.scss';
import { useRecoilValue, useSetRecoilState } from "recoil";
import { useMusicListManager, usePlaylistManager, playlistIDsState } from "./recoilStates/atoms/playlistAtoms";
import { FormPopupState, FormPopupOpenState, getFormInitData, OptionSelectorState, OptionSelectorOpenState } from './recoilStates/PopupStates';
import { MusicListAction, MusicListActionType, PlaylistAction, PlaylistActionType, MusicInfo_tmp as MusicInfo, PlaylistInfo } from './refs/constants';
function TestPage() {
    const ids = useRecoilValue(playlistIDsState);
    const playlistManager = usePlaylistManager();
    const musicListManager = useMusicListManager();
    const setFormPopupState = useSetRecoilState(FormPopupState);
    const setPopupOpen = useSetRecoilState(FormPopupOpenState);
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

    const selectPlaylist: React.MouseEventHandler<HTMLDivElement> = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
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

    const onSubmitHandler = (data: unknown) => {
        const playListInfo: PlaylistInfo = data as PlaylistInfo;
        if (playListInfo && playListInfo.name && playListInfo.description) {
            console.log(playListInfo);
            const createAction: PlaylistAction = {
                type: PlaylistActionType.CREATE,
                payload: {
                    info: playListInfo,
                    items: []
                }
            }
            playlistManager(createAction);
            setPopupOpen(false);
        }
    }
    const openFormPopup = () => {

        setFormPopupState(getFormInitData(onSubmitHandler));
        setPopupOpen(true);
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
            <button onClick={openFormPopup}>팝업열기</button>
            <div className="playlistids"
                onClick={selectPlaylist}
            >{
                    ids.map((el: string) => <div key={el}>
                        {el}
                        <button onClick={openOptionsSelector}>::</button>
                    </div>)
                }
            </div>
        </div>
    );
}


export default TestPage;