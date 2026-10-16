import { useAtomValue } from "jotai";
import MusicList from "./musicList/MusicList";
import { useOpenMusicOptionsPopup } from "features/overlays/PopupStates";
import {
  curMusicIdxState,
  useCurMusicManager,
  useMusicListManager,
} from "../model/queue";
import {
  MusicInfoActionType,
  MusicInfoItem,
  MusicListActionType,
} from "shared/model/constants";
export default function ConnectedMusicList({
  items,
  editing = false,
  currentStatus,
}: {
  items: MusicInfoItem[];
  editing?: boolean;
  currentStatus?: string;
}) {
  const options = useOpenMusicOptionsPopup();
  const manage = useMusicListManager();
  const current = useCurMusicManager();
  const index = useAtomValue(curMusicIdxState);
  return (
    <MusicList
      items={items}
      editing={editing}
      currentIndex={index}
      currentStatus={currentStatus}
      playMusic={(idx) => {
        void current({ type: MusicInfoActionType.SET_IDX, payload: idx });
      }}
      openOptionsPopup={options}
      changeOrder={(from, to) => {
        void manage({
          type: MusicListActionType.CHANGE_ORDER,
          payload: { from, to },
        });
      }}
    />
  );
}
