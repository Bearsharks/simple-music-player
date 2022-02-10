import { useRecoilValue, useSetRecoilState } from 'recoil'
import { popupOpenState, PopupInfoState, PopupInfo, PopupKind, useFormPopupManager, ModalKind } from './PopupStates';
import styles from './Popup.module.scss'
import { memo, useRef, useEffect, useState } from 'react';
import { MusicInfo, MusicInfoArrayCheck, MusicListAction, MusicListActionType, PlaylistAction, PlaylistActionType } from '../refs/constants';
import { playlistInfosState, useMusicListManager, usePlaylistManager } from '../recoilStates/atoms/playlistAtoms';
import { searchByQuery } from '../refs/youtubeSearch';
import OptionSelector from '../components/OptionSelector';

function InnerPopup() {
    const curRef = useRef<HTMLDivElement>(null);
    const info: PopupInfo = useRecoilValue(PopupInfoState);
    const setOpen = useSetRecoilState(popupOpenState);

    const children = (() => {
        switch (info.kind) {
            case PopupKind.PlaylistOptions:
                if (typeof info.data === 'string') {
                    return <PlaylistOptions setPopupOpen={setOpen} playlistid={info.data}></PlaylistOptions>
                }
                throw "playlistID is not valid can't render PlaylistOptions";
            case PopupKind.MusicOptions:
                if (MusicInfoArrayCheck(info.data)) {
                    return <MusicOptions evTarget={info.target} setPopupOpen={setOpen} musicInfos={info.data}></MusicOptions>
                }
                throw "musicInfos is not valid can't render MusicOptions";
            case PopupKind.SearchOptions:
                if ((info.data as HTMLTextAreaElement).value) {
                    return <SearchBarOptions setPopupOpen={setOpen} textarea={(info.data as HTMLTextAreaElement)}></SearchBarOptions>
                }
                throw "musicInfos is not valid can't render MusicOptions";
            case PopupKind.SelectTgtPlaylist:
                if (MusicInfoArrayCheck(info.data)) {
                    return <AppendPlaylistPopup setPopupOpen={setOpen} musicInfos={info.data}></AppendPlaylistPopup>
                }
                throw "musicInfos is not valid can't render MusicOptions";
            default:
                return "";
        }
    })();

    useEffect(() => {
        const onClickOutsideHandler = (event: MouseEvent | TouchEvent) => {
            if (curRef.current && curRef.current.contains(event.target as Node)) {
                return;
            }
            setOpen(false);
        };
        document.addEventListener('click', onClickOutsideHandler);
        document.addEventListener('touchend', onClickOutsideHandler);
        return () => {
            document.removeEventListener('click', onClickOutsideHandler);
            document.removeEventListener('touchend', onClickOutsideHandler);
        };
    }, [setOpen]);
    useEffect(() => {
        if (!curRef.current || !info.target) return;
        setOpen(true);
        const target: HTMLElement = info.target as HTMLElement;
        const { left, width, top } = target.getBoundingClientRect();

        const tgtRight = left + width;
        const x = window.innerWidth >= tgtRight + curRef.current.offsetWidth ?
            tgtRight : left - curRef.current.offsetWidth;
        const y = window.innerHeight >= top + curRef.current.offsetHeight ?
            top : top - curRef.current.offsetHeight;

        curRef.current.style.transform = `translate(${x}px, ${y}px)`;
    }, [info, setOpen])
    return (
        <div
            className={`${styles['wrapper']}`}
            ref={curRef}
        >
            {children}
        </div>
    );
}
function Popup() {
    const isOpen = useRecoilValue(popupOpenState);
    return isOpen ? <InnerPopup></InnerPopup> : <></>
}
export default Popup;




interface AppendPlaylistPopupProps {
    setPopupOpen: (isOpen: boolean) => void;
    musicInfos: MusicInfo[];
}
function AppendPlaylistPopup({ musicInfos, setPopupOpen }: AppendPlaylistPopupProps) {
    const [selectedPlaylist, selectPlaylist] = useState("");
    const playlistInfos = useRecoilValue(playlistInfosState);
    const playlistManager = usePlaylistManager();
    const submit = () => {
        if (!selectedPlaylist) return;
        const appendAction: PlaylistAction = {
            type: PlaylistActionType.APPEND,
            payload: {
                info: { id: selectedPlaylist },
                items: musicInfos
            }
        }
        playlistManager(appendAction);
        setPopupOpen(false);
    }
    return (
        <div >
            <label>선택 : </label><input type='text' value={selectedPlaylist} readOnly></input>
            {
                playlistInfos.map((info) =>
                    <div
                        key={info.id}
                        onClick={() => selectPlaylist(info.id)}
                    >
                        {`${info.id}/${info.name}/${info.description}`}
                    </div>)
            }
            <div>
                <button onClick={() => setPopupOpen(false)}>취소</button>
                <button onClick={submit}>확인</button>
            </div>
        </div>
    );
}


interface MusicOptionsProps {
    evTarget: HTMLElement;
    setPopupOpen: (isOpen: boolean) => void;
    musicInfos: MusicInfo[];
}
const MusicOptions = memo(function ({ setPopupOpen, musicInfos, evTarget }: MusicOptionsProps) {
    const musicListManager = useMusicListManager();
    const setPopupInfo = useSetRecoilState(PopupInfoState);
    const addToNextMusic = (musicInfos: MusicInfo[]) => {
        const action: MusicListAction = {
            type: MusicListActionType.ADD_TO_NEXT,
            payload: musicInfos
        }
        musicListManager(action);
    }
    const appendMusic = (musicInfos: MusicInfo[]) => {
        const action: MusicListAction = {
            type: MusicListActionType.APPEND_ITEMS,
            payload: musicInfos
        }
        musicListManager(action);
    }
    const addToPlaylist = (items: MusicInfo[]) => {
        const info: PopupInfo = {
            target: evTarget,
            kind: PopupKind.SelectTgtPlaylist,
            data: items
        }
        setPopupInfo(info);
        setPopupOpen(false);
    }
    const deleteMusic = (items: MusicInfo[]) => {
        const delAction: MusicListAction = {
            type: MusicListActionType.DELETE,
            payload: items
        }
        musicListManager(delAction);
    }
    const onClickHandlerWrapper = (callback: (data: any) => void) => {
        return () => {
            callback(musicInfos);
            setPopupOpen(false);
        }
    }
    const options = [
        { icon: "O", name: "다음 음악으로 재생", onClickHandler: onClickHandlerWrapper(addToNextMusic) },
        { icon: "O", name: "목록에 추가", onClickHandler: onClickHandlerWrapper(appendMusic) },
        { icon: "O", name: "재생목록에 추가", onClickHandler: onClickHandlerWrapper(addToPlaylist) },
        { icon: "O", name: "목록에서 삭제", onClickHandler: onClickHandlerWrapper(deleteMusic) }
    ];
    return <OptionSelector options={options} />;
})

interface PlaylistOptionsProps {
    setPopupOpen: (isOpen: boolean) => void;
    playlistid: string;
}
const PlaylistOptions = memo(function ({ setPopupOpen, playlistid }: PlaylistOptionsProps) {
    const playlistManager = usePlaylistManager();
    const musicListManager = useMusicListManager();
    const formPopupManager = useFormPopupManager();
    const appendMusiclist = (playlistid: string) => {
        const action: MusicListAction = {
            type: MusicListActionType.APPEND_PLAYLIST,
            payload: playlistid
        }
        musicListManager(action);
    }
    const addToNextMusic = (playlistid: string) => {

        const action: MusicListAction = {
            type: MusicListActionType.ADD_TO_NEXT_PLAYLIST,
            payload: playlistid
        }
        musicListManager(action);
    }
    const updatePlaylistInfo = (playlistid: string) => {
        formPopupManager(ModalKind.UpdatePlaylist, playlistid);
    }
    const deletePlaylist = (playlistid: string) => {
        playlistManager({
            type: PlaylistActionType.DELETE,
            payload: playlistid
        });
    }
    const onClickHandlerWrapper = (callback: (data: any) => void) => {
        return () => {
            callback(playlistid);
            setPopupOpen(false);
        }
    }
    const options = [
        { icon: "S", name: "재생목록에 추가", onClickHandler: onClickHandlerWrapper(appendMusiclist) },
        { icon: "A", name: "다음 음악으로 추가", onClickHandler: onClickHandlerWrapper(addToNextMusic) },
        { icon: "U", name: "재생목록 수정", onClickHandler: onClickHandlerWrapper(updatePlaylistInfo) },
        { icon: "X", name: "재생목록 삭제", onClickHandler: onClickHandlerWrapper(deletePlaylist) },
    ];
    return <OptionSelector options={options} />;
})


interface SearchBarOptionsProps {
    setPopupOpen: (isOpen: boolean) => void;
    textarea: HTMLTextAreaElement;
}
const SearchBarOptions = memo(function ({ setPopupOpen, textarea }: SearchBarOptionsProps) {
    const musicListManager = useMusicListManager();
    const addMusics = async (textarea: HTMLTextAreaElement, type?: MusicListActionType) => {
        if (!textarea.value) return;
        type = type ? type : MusicListActionType.APPEND_PLAYLIST;
        try {
            const searchResult: MusicInfo[] = await searchByQuery(textarea.value);
            if (searchResult.length <= 0) return;
            const action = {
                type: type,
                payload: searchResult
            }
            musicListManager(action);
        } catch (e) {
            console.error(e);
        } finally {
            setPopupOpen(false);
            textarea.value = "";
        }
    }
    const options = [
        {
            icon: "O", name: "다음 음악으로 재생",
            onClickHandler: () => addMusics(textarea, MusicListActionType.ADD_TO_NEXT)
        },
        {
            icon: "O", name: "목록에 추가",
            onClickHandler: () => addMusics(textarea, MusicListActionType.APPEND_ITEMS)
        }
    ]
    return <OptionSelector options={options} />;
});

