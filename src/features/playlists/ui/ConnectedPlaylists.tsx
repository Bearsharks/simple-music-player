import ErrorToast from "shared/ui/ErrorToast";
import { revealQueueOnFirstPlay } from "features/queue/model/musiclistOpenState";

import { useAtomValue, useSetAtom } from "jotai";
import { useMusicListManager } from "features/queue/model/queue";
import { playlistInfosState } from "features/playlists/model/playlistAtoms";
import {
  useModalManager,
  ModalKind,
  useOpenPlaylistOptionsPopup,
} from "features/overlays/PopupStates";
import { MusicListAction, MusicListActionType } from "shared/model/constants";
import Playlists from "features/playlists/ui/playlists/Playlists";
import Spinner from "shared/ui/Spinner";
import { Suspense, useState } from "react";

interface PlaylistsConnectedProps {
  goToPlaylistPage: (id: string, focusAdd?: boolean) => void;
}
function PlaylistsConnected(props: PlaylistsConnectedProps) {
  const [error, setError] = useState("");
  const setQueueOpen = useSetAtom(revealQueueOnFirstPlay);
  const playlistInfos = useAtomValue(playlistInfosState);
  const musicListManager = useMusicListManager();
  const formPopupManager = useModalManager();
  const setPopupInfoState = useOpenPlaylistOptionsPopup();
  const setMusiclist = (playlistid: string) => {
    if (
      !playlistInfos.find((playlist) => playlist.id === playlistid)?.itemCount
    )
      return;
    const action: MusicListAction = {
      type: MusicListActionType.LOAD_PLAYLIST,
      payload: playlistid,
    };
    setError("");
    void musicListManager(action)
      .then(() => setQueueOpen())
      .catch((error) => {
        setError(
          error instanceof Error
            ? error.message
            : "재생목록을 불러오지 못했습니다.",
        );
      });
  };

  const openOptionsSelector = (
    e: React.MouseEvent<HTMLElement>,
    playlistid: string,
  ) => {
    setPopupInfoState(e.currentTarget, playlistid);
  };
  const openCreatePlaylistPopup = () => {
    formPopupManager(ModalKind.CreatePlaylist);
  };
  return (
    <div>
      <ErrorToast message={error} />
      <Suspense fallback={<Spinner></Spinner>}>
        <Playlists
          goToPlaylistPage={props.goToPlaylistPage}
          openCreatePlaylistPopup={openCreatePlaylistPopup}
          playlistInfos={playlistInfos}
          playPlaylist={setMusiclist}
          openOptionsSelector={openOptionsSelector}
        ></Playlists>
      </Suspense>
    </div>
  );
}

export default PlaylistsConnected;
