import { createPortal } from "react-dom";
import { useStore, useAtomValue } from "jotai";
import {
  getPopupInfoState,
  PopupInfo,
  PopupKind,
  useModalManager,
  ModalKind,
  useOpenSelectTgtPlaylistPopup,
  useClosePopup,
} from "features/overlays/PopupStates";
import styles from "features/overlays/Popup.module.scss";
import { memo, useRef, Suspense, useCallback, useLayoutEffect } from "react";
import {
  MusicInfo,
  MusicInfoArrayCheck,
  MusicInfoItem,
  MusicListAction,
  MusicListActionType,
  PlaylistAction,
  PlaylistActionType,
  PlaylistInfo,
} from "shared/model/constants";
import { useMusicListManager } from "features/queue/model/queue";
import {
  playlistInfosState,
  playlistItemStateFamily,
  usePlaylistManager,
} from "features/playlists/model/playlistAtoms";
import { searchByQuery } from "features/youtube/api/youtubeSearch";
import OptionSelector, { OptionInfo } from "shared/ui/OptionSelector";
import Spinner from "shared/ui/Spinner";
import FormBoxPlaylist from "features/playlists/ui/formBox/FormBoxPlaylist";
import OuterClickEventCatcher from "shared/ui/OuterClickEventCatcher";
import Dialog from "shared/ui/Dialog";
import { useNotice } from "./Notice";

function InnerPopup({
  setOpen,
  info,
}: {
  setOpen: (_: boolean) => void;
  info: PopupInfo;
}) {
  const children = (() => {
    switch (info.kind) {
      case PopupKind.PlaylistOptions:
        if (typeof info.data === "string") {
          return (
            <PlaylistOptions
              evTarget={info.target}
              setPopupOpen={setOpen}
              playlistid={info.data}
            ></PlaylistOptions>
          );
        }
        throw "playlistID is not valid can't render PlaylistOptions";
      case PopupKind.MusicOptions:
        if (MusicInfoArrayCheck(info.data)) {
          return (
            <MusicOptions
              evTarget={info.target}
              setPopupOpen={setOpen}
              musicInfos={info.data}
            ></MusicOptions>
          );
        }
        throw "musicInfos is not valid can't render MusicOptions";
      case PopupKind.SearchOptions:
        if ((info.data as HTMLTextAreaElement).value) {
          return (
            <SearchBarOptions
              setPopupOpen={setOpen}
              textarea={info.data as HTMLTextAreaElement}
            ></SearchBarOptions>
          );
        }
        throw "musicInfos is not valid can't render MusicOptions";
      case PopupKind.SelectTgtPlaylist:
        if (MusicInfoArrayCheck(info.data)) {
          return (
            <Suspense fallback={<Spinner />}>
              <AppendPlaylistPopup
                setPopupOpen={setOpen}
                musicInfos={info.data}
              ></AppendPlaylistPopup>
            </Suspense>
          );
        }
        throw "musicInfos is not valid can't render MusicOptions";
      case PopupKind.YTOptions:
        return <YTOptions setPopupOpen={setOpen}></YTOptions>;
      case PopupKind.PlaylistItemOptions:
        const playlistID: string = (info.data as any).playlistID;
        const musicInfos: MusicInfoItem[] = (info.data as any).musicInfos;
        if (playlistID && musicInfos.length && musicInfos[0].key) {
          return (
            <PlaylistItemOptions
              evTarget={info.target}
              setPopupOpen={setOpen}
              playlistID={playlistID}
              musicInfos={musicInfos}
            ></PlaylistItemOptions>
          );
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
  // Capture the invoking row before deletion can detach it. Keep the menu in
  // its original native-dialog scope until its own cleanup has completed.
  const list = popupInfo.target.closest<HTMLElement>("[data-track-list]");
  const origin = useRef({
    dialog: popupInfo.target.closest("dialog[open]"),
    list,
    index: list
      ? [...list.querySelectorAll("[data-track-key]")].indexOf(
          popupInfo.target.closest("[data-track-key]")!,
        )
      : -1,
    scope: popupInfo.target.closest("dialog, [data-track-scope], main"),
  });
  const closePopup = useClosePopup();
  const close = () => {
    closePopup(popupInfo.key);
  };
  const handleResize = useCallback(
    (width: number, height: number) => {
      const target: HTMLElement = popupInfo.target as HTMLElement;
      if (!curRef.current || !target) return;
      const { offsetWidth, offsetHeight } = curRef.current;
      const { left, top, bottom } = target.getBoundingClientRect();
      const x = width >= left + offsetWidth ? left : width - offsetWidth;
      const y =
        height >= bottom + offsetHeight
          ? bottom
          : top - offsetHeight >= 0
            ? top - offsetHeight
            : height - offsetHeight;
      curRef.current.style.transform = `translate(${x}px, ${y}px)`;
      curRef.current.style.visibility = "initial";
    },
    [popupInfo.target],
  );

  useLayoutEffect(() => {
    const root = curRef.current!;
    const resize = () => handleResize(window.innerWidth, window.innerHeight);
    resize();
    root.querySelector<HTMLElement>('button, input, [tabindex="0"]')?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !root.querySelector('[aria-busy="true"]')) {
        event.preventDefault();
        event.stopPropagation();
        closePopup(popupInfo.key);
      }
    };
    const focusout = (event: FocusEvent) => {
      if (
        event.relatedTarget &&
        !root.contains(event.relatedTarget as Node) &&
        !root.querySelector('[aria-busy="true"]')
      )
        closePopup(popupInfo.key);
    };
    root.addEventListener("keydown", keydown);
    root.addEventListener("focusout", focusout);
    window.addEventListener("resize", resize);
    return () => {
      root.removeEventListener("keydown", keydown);
      root.removeEventListener("focusout", focusout);
      window.removeEventListener("resize", resize);
      const target = popupInfo.target;
      if (
        !root.contains(document.activeElement) &&
        document.activeElement !== document.body
      )
        return;
      if (target.isConnected && !target.closest("[inert]")) {
        target.focus();
        return;
      }
      const { list, index, scope } = origin.current;
      const rows = list?.querySelectorAll<HTMLElement>("[data-track-key]");
      const neighbor = rows?.[Math.min(Math.max(index, 0), rows.length - 1)];
      const fallback =
        neighbor?.querySelector<HTMLElement>("[data-track-focus]") ??
        scope?.querySelector<HTMLElement>("[data-empty-track-focus]");
      if (fallback?.isConnected && !fallback.closest("[inert], [hidden]"))
        fallback.focus();
    };
  }, [popupInfo.key, popupInfo.target, handleResize, closePopup]);

  const node = (
    <div
      data-dialog-popover
      className={`${styles["wrapper"]}`}
      ref={curRef}
      style={{ visibility: "hidden" }}
    >
      <InnerPopup info={popupInfo} setOpen={close}></InnerPopup>
      <OuterClickEventCatcher
        openState={[
          true,
          () => {
            if (!curRef.current?.querySelector('[aria-busy="true"]')) close();
          },
        ]}
        wrapper={curRef}
      ></OuterClickEventCatcher>
    </div>
  );
  // Menus invoked inside a native player sheet belong to its focus/top-layer scope.
  const scope = origin.current.dialog;
  return scope ? createPortal(node, scope) : node;
}
export default PopupWrapper;

function PopupWrapper() {
  const popupInfo: PopupInfo[] = useAtomValue(getPopupInfoState);
  const close = useClosePopup();
  return (
    <>
      {popupInfo.map((info) =>
        info.kind === PopupKind.SelectTgtPlaylist &&
        MusicInfoArrayCheck(info.data) ? (
          <Dialog
            key={info.key}
            label="재생목록에 추가"
            onClose={() => close(info.key)}
          >
            <Suspense fallback={<Spinner />}>
              <AppendPlaylistPopup
                setPopupOpen={() => close(info.key)}
                musicInfos={info.data as MusicInfo[]}
              />
            </Suspense>
          </Dialog>
        ) : (
          <Popup key={info.key} popupInfo={info} />
        ),
      )}
    </>
  );
}

interface AppendPlaylistPopupProps {
  setPopupOpen: (isOpen: boolean) => void;
  musicInfos: MusicInfo[];
}
function AppendPlaylistPopup({
  musicInfos,
  setPopupOpen,
}: AppendPlaylistPopupProps) {
  const playlistInfos = useAtomValue(playlistInfosState);
  const playlistManager = usePlaylistManager();
  const modalManager = useModalManager();
  const openNewPlaylistModal = () => {
    modalManager(ModalKind.CreatePlaylist, musicInfos);
    setPopupOpen(false);
  };
  const playlistDummy: PlaylistInfo = {
    id: "newPlaylist",
    name: "새 재생목록",
    description: "",
    thumbnails: [],
    itemCount: -1,
  };

  const submit = async (tgt: PlaylistInfo) => {
    if (tgt.id === playlistDummy.id) {
      openNewPlaylistModal();
      return;
    }
    let info = playlistInfos.find((element) => element.id === tgt.id);
    if (!info) throw "해당 재생목록이 존재하지 않음!";
    const appendAction: PlaylistAction = {
      type: PlaylistActionType.APPEND,
      payload: {
        info: { id: tgt.id },
        items: musicInfos,
      },
    };
    await playlistManager(appendAction);
    setPopupOpen(false);
  };

  return (
    <div className={styles["playlist"]}>
      <FormBoxPlaylist
        name={"재생목록에 추가"}
        closePopup={() => setPopupOpen(false)}
        playlistInfos={[playlistDummy, ...playlistInfos]}
        submit={submit}
      />
    </div>
  );
}

interface MusicOptionsProps {
  evTarget: HTMLElement;
  setPopupOpen: (isOpen: boolean) => void;
  musicInfos: MusicInfo[];
}
const useGetMusicOptions = (
  musicInfos: MusicInfo[],
  setPopupOpen: (isOpen: boolean) => void,
  evTarget: HTMLElement,
): OptionInfo[] => {
  const musicListManager = useMusicListManager();
  const openSelectTgtPlaylistPopup = useOpenSelectTgtPlaylistPopup();
  const addToNextMusic = async (musicInfos: MusicInfo[]) => {
    const action: MusicListAction = {
      type: MusicListActionType.ADD_TO_NEXT,
      payload: musicInfos,
    };
    await musicListManager(action);
    setPopupOpen(false);
  };
  const appendMusic = async (musicInfos: MusicInfo[]) => {
    const action: MusicListAction = {
      type: MusicListActionType.APPEND_ITEMS,
      payload: musicInfos,
    };
    await musicListManager(action);
    setPopupOpen(false);
  };
  const addToPlaylist = (items: MusicInfo[]) => {
    openSelectTgtPlaylistPopup(evTarget, items);
    setPopupOpen(false);
  };
  return [
    {
      icon: "playlist_play",
      name: "다음 음악으로 재생",
      onClickHandler: () => addToNextMusic(musicInfos),
    },
    {
      icon: "queue_music",
      name: "대기열 끝에 추가",
      onClickHandler: () => appendMusic(musicInfos),
    },
    {
      icon: "playlist_add",
      name: "재생목록에 추가",
      onClickHandler: () => addToPlaylist(musicInfos),
    },
  ];
};
const MusicOptions = memo(function ({
  setPopupOpen,
  musicInfos,
  evTarget,
}: MusicOptionsProps) {
  const musicOptions = useGetMusicOptions(musicInfos, setPopupOpen, evTarget);
  const musicListManager = useMusicListManager();
  const notice = useNotice();
  const deleteMusic = async (items: MusicInfo[]) => {
    const delAction: MusicListAction = {
      type: MusicListActionType.DELETE,
      payload: items,
    };
    const result = await musicListManager(delAction);
    if (result?.deletedCount)
      notice(`${result.deletedCount}곡을 대기열에서 삭제했습니다.`, {
        label: "실행 취소",
        run: result.undo,
      });
    setPopupOpen(false);
  };
  const options = [
    ...musicOptions,
    {
      icon: "remove_circle_outline",
      name: "대기열에서 삭제",
      onClickHandler: () => deleteMusic(musicInfos),
    },
  ];
  return <OptionSelector options={options} />;
});

interface PlaylistItemOptionsProps {
  evTarget: HTMLElement;
  setPopupOpen: (isOpen: boolean) => void;
  playlistID: string;
  musicInfos: MusicInfoItem[];
}
const PlaylistItemOptions = memo(function ({
  setPopupOpen,
  evTarget,
  musicInfos,
  playlistID,
}: PlaylistItemOptionsProps) {
  const musicOptions = useGetMusicOptions(musicInfos, setPopupOpen, evTarget);
  const manager = usePlaylistManager();
  const notice = useNotice();
  const deleteMusic = async (items: MusicInfoItem[]) => {
    const result = await manager({
      type: PlaylistActionType.DELETE_ITEMS,
      payload: { id: playlistID, items },
    });
    if (result?.deletedCount)
      notice(`${result.deletedCount}곡을 저장 목록에서 삭제했습니다.`, {
        label: "실행 취소",
        run: result.undo,
      });
    setPopupOpen(false);
  };
  const options = [
    ...musicOptions,
    {
      icon: "remove_circle_outline",
      name: "재생목록에서 삭제",
      onClickHandler: () => deleteMusic(musicInfos),
    },
  ];
  return <OptionSelector options={options} />;
});

interface PlaylistOptionsProps {
  setPopupOpen: (isOpen: boolean) => void;
  evTarget: HTMLElement;
  playlistid: string;
}
const PlaylistOptions = memo(function ({
  evTarget,
  setPopupOpen,
  playlistid,
}: PlaylistOptionsProps) {
  const musicListManager = useMusicListManager();
  const modalManager = useModalManager();
  const store = useStore();
  const openSelectTgtPlaylistPopup = useOpenSelectTgtPlaylistPopup();
  const addToPlaylist = async () => {
    const items = await store.get(playlistItemStateFamily(playlistid));
    openSelectTgtPlaylistPopup(evTarget, items);
  };
  const addToNextMusic = async (playlistid: string) => {
    const action: MusicListAction = {
      type: MusicListActionType.ADD_TO_NEXT_PLAYLIST,
      payload: playlistid,
    };
    await musicListManager(action);
  };
  const appendPlaylist = async (playlistid: string) => {
    await musicListManager({
      type: MusicListActionType.APPEND_PLAYLIST,
      payload: playlistid,
    });
  };
  const updatePlaylistInfo = (playlistid: string) =>
    modalManager(ModalKind.UpdatePlaylist, playlistid);
  const deletePlaylist = (playlistid: string) =>
    modalManager(ModalKind.DeletePlaylist, playlistid);
  const onClickHandlerWrapper =
    (callback: (id: string) => void | Promise<void>) => async () => {
      await callback(playlistid);
      setPopupOpen(false);
    };
  const options = [
    {
      icon: "playlist_add",
      name: "재생목록에 추가",
      onClickHandler: onClickHandlerWrapper(addToPlaylist),
    },
    {
      icon: "playlist_play",
      name: "다음 음악으로 추가",
      onClickHandler: onClickHandlerWrapper(addToNextMusic),
    },
    {
      icon: "queue_music",
      name: "대기열 끝에 추가",
      onClickHandler: onClickHandlerWrapper(appendPlaylist),
    },
    {
      icon: "edit",
      name: "재생목록 수정",
      onClickHandler: onClickHandlerWrapper(updatePlaylistInfo),
    },
    {
      icon: "delete_outline",
      name: "재생목록 삭제",
      onClickHandler: onClickHandlerWrapper(deletePlaylist),
    },
  ];
  return <OptionSelector options={options} />;
});

interface SearchBarOptionsProps {
  setPopupOpen: (isOpen: boolean) => void;
  textarea: HTMLTextAreaElement;
}
const SearchBarOptions = memo(function ({
  setPopupOpen,
  textarea,
}: SearchBarOptionsProps) {
  const musicListManager = useMusicListManager();
  const addMusics = async (
    textarea: HTMLTextAreaElement,
    type?: MusicListActionType,
  ) => {
    if (!textarea.value) return;
    type = type ? type : MusicListActionType.APPEND_PLAYLIST;
    try {
      const searchResult: MusicInfo[] = await searchByQuery(textarea.value);
      if (searchResult.length <= 0) return;
      const action = {
        type: type,
        payload: searchResult,
      };
      await musicListManager(action);
    } catch (e) {
      console.error(e);
    } finally {
      setPopupOpen(false);
      textarea.value = "";
    }
  };
  const options = [
    {
      icon: "playlist_play",
      name: "다음 음악으로 재생",
      onClickHandler: () =>
        addMusics(textarea, MusicListActionType.ADD_TO_NEXT),
    },
    {
      icon: "playlist_add",
      name: "대기열 끝에 추가",
      onClickHandler: () =>
        addMusics(textarea, MusicListActionType.APPEND_ITEMS),
    },
  ];
  return <OptionSelector options={options} />;
});
const YTOptions = memo(function ({
  setPopupOpen,
}: {
  setPopupOpen: (isOpen: boolean) => void;
}) {
  const modalManager = useModalManager();
  const openModal = (kind: ModalKind) => {
    modalManager(kind);
    setPopupOpen(false);
  };
  const options = [
    {
      icon: "add_link",
      name: "링크에서 가져오기",
      onClickHandler: () => openModal(ModalKind.ImportYTPlaylistLink),
    },
  ];
  return <OptionSelector options={options} />;
});
