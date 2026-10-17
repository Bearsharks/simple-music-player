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
import { memo, useRef, useEffect, Suspense } from "react";
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
  playlistInfoStateFamily,
  playlistItemStateFamily,
  usePlaylistManager,
} from "features/playlists/model/playlistAtoms";
import { searchByQuery } from "features/youtube/api/youtubeSearch";
import OptionSelector, { OptionInfo } from "shared/ui/OptionSelector";
import Spinner from "shared/ui/Spinner";
import FormBoxPlaylist, {
  type PlaylistDestination,
} from "features/playlists/ui/formBox/FormBoxPlaylist";
import Dialog from "shared/ui/Dialog";
import { useNotice } from "./Notice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "shared/ui/shadcn/dropdown-menu";
import ExternalMenuTrigger from "./ExternalMenuTrigger";

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
            />
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
    dialog: popupInfo.target.closest<HTMLDialogElement>("dialog[open]"),
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
  const restoreFocus = () => {
    const root = curRef.current;
    if (
      document.activeElement !== document.body &&
      !root?.contains(document.activeElement)
    )
      return;
    const target = popupInfo.target;
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
  const isBusy = () =>
    Boolean(curRef.current?.querySelector('[aria-busy="true"]'));
  return (
    <DropdownMenu
      open
      modal={false}
      onOpenChange={(open) => {
        if (!open && !isBusy()) close();
      }}
    >
      <DropdownMenuTrigger asChild>
        <ExternalMenuTrigger target={popupInfo.target} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        ref={curRef}
        aria-label="선택 메뉴"
        aria-labelledby={undefined}
        portalContainer={origin.current.dialog}
        collisionBoundary={origin.current.dialog}
        collisionPadding={8}
        sideOffset={4}
        align="end"
        className={styles.menu}
        onFocusCapture={(event) => {
          if (event.target === event.currentTarget)
            event.currentTarget
              .querySelector<HTMLElement>(
                '[role="menuitem"]:not([data-disabled])',
              )
              ?.focus();
        }}
        onEscapeKeyDown={(event) => {
          if (isBusy()) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (
            isBusy() ||
            (event.target as HTMLElement)?.closest(
              '[data-overlay-notice="error"]',
            )
          )
            event.preventDefault();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          restoreFocus();
        }}
      >
        <InnerPopup info={popupInfo} setOpen={close} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export default PopupWrapper;

/** Keep the trigger usable while local menu data resolves. No undersized popup. */
function PendingPopup({ info }: { info: PopupInfo }) {
  const close = useClosePopup();
  useEffect(() => {
    const pointer = (event: PointerEvent) => {
      if (!info.target.contains(event.target as Node)) close(info.key);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Tab") close(info.key);
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close(info.key);
      }
    };
    document.addEventListener("pointerdown", pointer, true);
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("pointerdown", pointer, true);
      document.removeEventListener("keydown", key, true);
    };
  }, [close, info]);
  return null;
}

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
            className="playlist-destination"
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
          <Suspense key={info.key} fallback={<PendingPopup info={info} />}>
            <Popup popupInfo={info} />
          </Suspense>
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
  const notice = useNotice();
  const submit = async (destination: PlaylistDestination) => {
    const existing = destination.id;
    if (existing && !playlistInfos.some((item) => item.id === existing))
      throw new Error("목록을 찾을 수 없습니다. 다른 목록을 선택해 주세요.");
    await playlistManager({
      type: existing ? PlaylistActionType.APPEND : PlaylistActionType.CREATE,
      payload: {
        info: existing
          ? { id: existing, ...destination.changes }
          : {
              id: "",
              name: destination.name,
              description: destination.description,
            },
        items: musicInfos,
      },
    });
    const savedName = destination.name;
    setPopupOpen(false);
    notice(
      existing
        ? `“${savedName}”에 ${musicInfos.length}곡을 추가했습니다.`
        : `“${savedName}”을 만들고 ${musicInfos.length}곡을 추가했습니다.`,
    );
  };

  return (
    <div className={styles["playlist"]}>
      <FormBoxPlaylist
        name={"재생목록에 추가"}
        closePopup={() => setPopupOpen(false)}
        playlistInfos={playlistInfos}
        trackCount={musicInfos.length}
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
    evTarget.focus();
    openSelectTgtPlaylistPopup(evTarget, items);
    setPopupOpen(false);
  };
  return [
    {
      icon: "queue-next",
      name: "다음 음악으로 재생",
      onClickHandler: () => addToNextMusic(musicInfos),
    },
    {
      icon: "queue",
      name: "대기열 끝에 추가",
      onClickHandler: () => appendMusic(musicInfos),
    },
    {
      icon: "playlist-add",
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
      icon: "remove",
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
      icon: "remove",
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
  const info = useAtomValue(playlistInfoStateFamily(playlistid));
  const musicListManager = useMusicListManager();
  const modalManager = useModalManager();
  const store = useStore();
  const openSelectTgtPlaylistPopup = useOpenSelectTgtPlaylistPopup();
  const addToPlaylist = async () => {
    const items = await store.get(playlistItemStateFamily(playlistid));
    evTarget.focus();
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
  const updatePlaylistInfo = (playlistid: string) => {
    evTarget.focus();
    return modalManager(ModalKind.UpdatePlaylist, playlistid);
  };
  const deletePlaylist = (playlistid: string) => {
    evTarget.focus();
    return modalManager(ModalKind.DeletePlaylist, playlistid);
  };
  const onClickHandlerWrapper =
    (callback: (id: string) => void | Promise<void>) => async () => {
      await callback(playlistid);
      setPopupOpen(false);
    };
  const options = [
    {
      icon: "playlist-add",
      name: "재생목록에 추가",
      onClickHandler: onClickHandlerWrapper(addToPlaylist),
    },
    {
      icon: "queue-next",
      name: "다음 음악으로 추가",
      onClickHandler: onClickHandlerWrapper(addToNextMusic),
    },
    {
      icon: "queue",
      name: "대기열 끝에 추가",
      onClickHandler: onClickHandlerWrapper(appendPlaylist),
    },
    {
      icon: "edit",
      name: "재생목록 수정",
      onClickHandler: onClickHandlerWrapper(updatePlaylistInfo),
    },
    ...(info.sourcePlaylistUrl
      ? [
          ...(info.hasInitialSnapshot
            ? [
                {
                  icon: "clock",
                  name: "처음 가져온 목록으로 복원",
                  onClickHandler: onClickHandlerWrapper((id) => {
                    evTarget.focus();
                    return modalManager(ModalKind.RestoreInitialPlaylist, id);
                  }),
                },
              ]
            : []),
          {
            icon: "reset",
            name: "YouTube 최신 목록 가져오기",
            onClickHandler: onClickHandlerWrapper((id) => {
              evTarget.focus();
              return modalManager(ModalKind.RefreshYTPlaylist, id);
            }),
          },
        ]
      : []),
    {
      icon: "trash",
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
      icon: "queue-next",
      name: "다음 음악으로 재생",
      onClickHandler: () =>
        addMusics(textarea, MusicListActionType.ADD_TO_NEXT),
    },
    {
      icon: "playlist-add",
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
      icon: "link",
      name: "링크에서 가져오기",
      onClickHandler: () => openModal(ModalKind.CreatePlaylist),
    },
  ];
  return <OptionSelector options={options} />;
});
