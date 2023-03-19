import { useRecoilSnapshot, useRecoilValue } from 'recoil'
import { getPopupInfoState, PopupInfo, PopupKind, useModalManager, ModalKind, useOpenSelectTgtPlaylistPopup, useClosePopup } from './PopupStates';
import styles from './Popup.module.scss'
import { memo, useRef, useEffect, Suspense, useCallback } from 'react';
import {
    MusicInfo,
    MusicInfoArrayCheck,
    MusicInfoItem,
    MusicListAction,
    MusicListActionType,
    PlaylistInfo
} from 'refs/constants';
import { playlistInfosState, playlistItemStateFamily, useMusicListManager} from 'recoilStates/playlistAtoms';
import { searchByQuery } from 'refs/youtubeSearch';
import OptionSelector, { OptionInfo } from 'components/OptionSelector';
import Spinner from 'components/Spinner';
import FormBoxPlaylist from 'components/formBox/FormBoxPlaylist';
import OuterClickEventCatcher from 'components/OuterClickEventCatcher';
import ResizeEventCatcher from 'components/ResizeEventCatcher';
import {
    useAppendSimplePlaylistItems,
    useDeleteSimplePlaylist,
    useDeleteSimplePlaylistItems
} from "../serverStates/simplePlaylistState";

function InnerPopup({ setOpen, info }: { setOpen: (_: boolean) => void, info: PopupInfo }) {
    const children = (() => {
        switch (info.kind) {
            case PopupKind.PlaylistOptions:
                if (typeof info.data === 'string') {
                    return <PlaylistOptions evTarget={info.target} setPopupOpen={setOpen} playlistid={info.data}></PlaylistOptions>
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
                    return <Suspense fallback={<Spinner />}>
                        <AppendPlaylistPopup setPopupOpen={setOpen} musicInfos={info.data}></AppendPlaylistPopup>
                    </Suspense>
                }
                throw "musicInfos is not valid can't render MusicOptions";
            case PopupKind.YTOptions:
                return <YTOptions setPopupOpen={setOpen} ></YTOptions>
            case PopupKind.PlaylistItemOptions:
                const playlistID: string = (info.data as any).playlistID;
                const musicInfos: MusicInfoItem[] = (info.data as any).musicInfos;
                if (playlistID && musicInfos.length && musicInfos[0].key) {
                    return <PlaylistItemOptions
                        evTarget={info.target}
                        setPopupOpen={setOpen}
                        playlistID={playlistID}
                        musicInfos={musicInfos}
                    ></PlaylistItemOptions>
                }
                throw "playlistID is not valid can't render PlaylistItemOptions";
            default:
                return "";
        }
    })();
    return <>{children}</>;
}

function Popup({ popupInfo }: { popupInfo: PopupInfo }) {
    const curRef = useRef<HTMLDivElement>(null);
    const closePopup = useClosePopup();
    const close = () => {
        closePopup(popupInfo.key);
    }
    const handleResize = useCallback((width: number, height: number) => {
        const target: HTMLElement = popupInfo.target as HTMLElement;
        if (!curRef.current || !target) return;
        const { offsetWidth, offsetHeight } = curRef.current;
        const { left, top, bottom } = target.getBoundingClientRect();
        const x = width >= left + offsetWidth ? left : (width - offsetWidth);
        const y = height >= bottom + offsetHeight ? bottom :
            (top - offsetHeight >= 0 ? top - offsetHeight : height - offsetHeight);
        curRef.current.style.transform = `translate(${x}px, ${y}px)`;
        curRef.current.style.visibility = "initial";
    }, [popupInfo.target]);

    useEffect(() => {
        const { innerWidth, innerHeight } = window;
        handleResize(innerWidth, innerHeight);
    }, [popupInfo.target, handleResize]);

    return <div
        className={`${styles['wrapper']}`}
        ref={curRef}
        style={{ 'visibility': 'hidden' }}
    >
        <InnerPopup info={popupInfo} setOpen={close}></InnerPopup>
        <OuterClickEventCatcher openState={[true, close]} wrapper={curRef}></OuterClickEventCatcher>
        <ResizeEventCatcher
            target={window.document.getElementById("root") as Element}
            onResizeHandler={handleResize}
        ></ResizeEventCatcher>
    </div>
}
export default PopupWrapper;

function PopupWrapper() {
    const popupInfo: PopupInfo[] = useRecoilValue(getPopupInfoState);
    return <>
        {popupInfo.map((info) => <Popup key={info.key} popupInfo={info}></Popup>)}
    </>
}



interface AppendPlaylistPopupProps {
    setPopupOpen: (isOpen: boolean) => void;
    musicInfos: MusicInfo[];
}
function AppendPlaylistPopup({ musicInfos, setPopupOpen }: AppendPlaylistPopupProps) {
    const playlistInfos = useRecoilValue(playlistInfosState);
    const appendPlaylist = useAppendSimplePlaylistItems();
    const modalManager = useModalManager();
    const openNewPlaylistModal = () => {
        modalManager(ModalKind.CreatePlaylist, musicInfos);
        setPopupOpen(false);
    }
    const playlistDummy: PlaylistInfo = {
        id: "newPlaylist", name: '새 재생목록', description: "",
        thumbnails: ["https://www.gstatic.com/youtube/media/ytm/images/pbg/create-playlist-@210.png"]
        , itemCount: -1
    }

    const submit = (tgt: PlaylistInfo) => {
        if (tgt.id === playlistDummy.id) {
            openNewPlaylistModal();
            return;
        }
        let info = playlistInfos.find((element) => element.id === tgt.id);
        if (!info) throw "해당 재생목록이 존재하지 않음!";

        appendPlaylist.mutate(info.id, musicInfos, () => setPopupOpen(false));
    }

    return <div className={styles['playlist']}>
        <FormBoxPlaylist
            name={"재생목록에 추가"}
            closePopup={() => setPopupOpen(false)}
            playlistInfos={[playlistDummy, ...playlistInfos]}
            submit={submit}
        />
    </div>
}


interface MusicOptionsProps {
    evTarget: HTMLElement;
    setPopupOpen: (isOpen: boolean) => void;
    musicInfos: MusicInfo[];
}
const useGetMusicOptions = (musicInfos: MusicInfo[], setPopupOpen: (isOpen: boolean) => void, evTarget: HTMLElement): OptionInfo[] => {
    const musicListManager = useMusicListManager();
    const openSelectTgtPlaylistPopup = useOpenSelectTgtPlaylistPopup();
    const addToNextMusic = (musicInfos: MusicInfo[]) => {
        const action: MusicListAction = {
            type: MusicListActionType.ADD_TO_NEXT,
            payload: musicInfos
        }
        musicListManager(action);
        setPopupOpen(false);
    }
    const appendMusic = (musicInfos: MusicInfo[]) => {
        const action: MusicListAction = {
            type: MusicListActionType.APPEND_ITEMS,
            payload: musicInfos
        }
        musicListManager(action);
        setPopupOpen(false);
    }
    const addToPlaylist = (items: MusicInfo[]) => {
        openSelectTgtPlaylistPopup(evTarget, items);
    }
    return [{ icon: "playlist_play", name: "다음 음악으로 재생", onClickHandler: () => addToNextMusic(musicInfos) },
    { icon: "queue_music", name: "목록에 추가", onClickHandler: () => appendMusic(musicInfos) },
    { icon: "playlist_add", name: "재생목록에 추가", onClickHandler: () => addToPlaylist(musicInfos) }];
}
const MusicOptions = memo(function ({ setPopupOpen, musicInfos, evTarget }: MusicOptionsProps) {
    const musicOptions = useGetMusicOptions(musicInfos, setPopupOpen, evTarget);
    const musicListManager = useMusicListManager();
    const deleteMusic = (items: MusicInfo[]) => {
        const delAction: MusicListAction = {
            type: MusicListActionType.DELETE,
            payload: items
        }
        musicListManager(delAction);
        setPopupOpen(false);
    }
    const options = [
        ...musicOptions,
        { icon: "remove_circle_outline", name: "목록에서 삭제", onClickHandler: () => deleteMusic(musicInfos) }
    ];
    return <OptionSelector options={options} />;
})

interface PlaylistItemOptionsProps {
    evTarget: HTMLElement;
    setPopupOpen: (isOpen: boolean) => void;
    playlistID: string,
    musicInfos: MusicInfoItem[]
}
const PlaylistItemOptions = memo(function ({ setPopupOpen, evTarget, musicInfos, playlistID }: PlaylistItemOptionsProps) {
    const musicOptions = useGetMusicOptions(musicInfos, setPopupOpen, evTarget);
    const deleteItems = useDeleteSimplePlaylistItems();
    const deleteMusic = (items: MusicInfoItem[]) => {
        deleteItems.mutate(playlistID, items, () => setPopupOpen(false));
    }
    const options = [
        ...musicOptions,
        { icon: "remove_circle_outline", name: "재생목록에서 삭제", onClickHandler: () => deleteMusic(musicInfos) }
    ];
    return <OptionSelector options={options} />;
})

interface PlaylistOptionsProps {
    setPopupOpen: (isOpen: boolean) => void;
    evTarget: HTMLElement;
    playlistid: string;
}
const PlaylistOptions = memo(function ({ evTarget, setPopupOpen, playlistid }: PlaylistOptionsProps) {
    const deleteSimplePlaylist = useDeleteSimplePlaylist();
    const musicListManager = useMusicListManager();
    const modalManager = useModalManager();
    const snapshot = useRecoilSnapshot();
    const openSelectTgtPlaylistPopup = useOpenSelectTgtPlaylistPopup();
    const addToPlaylist = async () => {
        const items = await snapshot.getPromise(playlistItemStateFamily(playlistid));
        openSelectTgtPlaylistPopup(evTarget, items);
    }
    const addToNextMusic = (playlistid: string) => {
        const action: MusicListAction = {
            type: MusicListActionType.ADD_TO_NEXT_PLAYLIST,
            payload: playlistid
        }
        musicListManager(action);
    }
    const updatePlaylistInfo = (playlistid: string) => {
        modalManager(ModalKind.UpdatePlaylist, playlistid);
    }
    const deletePlaylist = () => {
        deleteSimplePlaylist.mutate(playlistid, () => setPopupOpen(false));
    }
    const onClickHandlerWrapper = (callback: (data: any) => void) => {
        return () => {
            callback(playlistid);
            setPopupOpen(false);
        }
    }
    const options = [
        { icon: "playlist_add", name: "재생목록에 추가", onClickHandler: onClickHandlerWrapper(addToPlaylist) },
        { icon: "playlist_play", name: "다음 음악으로 추가", onClickHandler: onClickHandlerWrapper(addToNextMusic) },
        { icon: "edit", name: "재생목록 수정", onClickHandler: onClickHandlerWrapper(updatePlaylistInfo) },
        { icon: "library_add_check", name: "재생목록 삭제", onClickHandler: deletePlaylist },
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
            icon: "playlist_play", name: "다음 음악으로 재생",
            onClickHandler: () => addMusics(textarea, MusicListActionType.ADD_TO_NEXT)
        },
        {
            icon: "playlist_add", name: "목록에 추가",
            onClickHandler: () => addMusics(textarea, MusicListActionType.APPEND_ITEMS)
        }
    ]
    return <OptionSelector options={options} />;
});

const YTOptions = memo(function ({ setPopupOpen }: { setPopupOpen: (isOpen: boolean) => void }) {
    const modalManager = useModalManager();
    const openModal = (kind: ModalKind) => {
        modalManager(kind);
        setPopupOpen(false);
    }
    const options = [
        {
            icon: "playlist_add", name: "내 재생목록 가져오기",
            onClickHandler: () => openModal(ModalKind.ImportMyYTPlaylist)
        },
        {
            icon: "add_link", name: "링크에서 가져오기",
            onClickHandler: () => openModal(ModalKind.ImportYTPlaylistLink)
        }
    ]
    return <OptionSelector options={options} />;
});