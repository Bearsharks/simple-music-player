import { API } from "shared/api/apiSelector";
import {
  MusicInfo,
  PlaylistInfo,
  InitialPlaylistSnapshot,
} from "shared/model/constants";
import keyGenerator from "shared/lib/keyGenerator";
import { playlistFixture } from "test/fixture";
let a: any = {
  id1: structuredClone(playlistFixture),
};
export const reset = () => {
  a = {
    id1: structuredClone(playlistFixture),
  };
};
export const testAPIget = (id: string, items: string) => {
  return a[id][items];
};
const metadata = (id: string): PlaylistInfo => {
  const { items, initialSnapshot, ...info } = a[id];
  return { ...info, ...(initialSnapshot ? { hasInitialSnapshot: true } : {}) };
};
const getInitialSnapshot = async (
  id: string,
): Promise<InitialPlaylistSnapshot | undefined> =>
  a[id]?.initialSnapshot ? structuredClone(a[id].initialSnapshot) : undefined;
const getPlaylistInfos = async (): Promise<PlaylistInfo[]> => {
  return Object.keys(a).map((id) => metadata(id));
};
const getPlaylistInfo = async (id: string): Promise<PlaylistInfo> => {
  return metadata(id);
};
const getPlaylistItems = async (id: string): Promise<MusicInfo[]> => {
  return a[id].items;
};
const createPlaylist = async (
  info: PlaylistInfo,
  items: MusicInfo[],
  initialSnapshot?: InitialPlaylistSnapshot,
): Promise<string> => {
  info = { ...info, id: keyGenerator()[0] };
  a[info.id] = {
    ...info,
    initialSnapshot: initialSnapshot
      ? structuredClone(initialSnapshot)
      : undefined,
    items: items ? items : [],
  };
  return info.id;
};
const deletePlaylist = async (id: string): Promise<boolean> => {
  if (!a[id]) return false;
  delete a[id];
  return true;
};
const updatePlaylist = async (playlist: {
  info: PlaylistInfo;
  items?: MusicInfo[];
}): Promise<boolean> => {
  if (playlist.info.id && a[playlist.info.id]) {
    let origin: any = { ...a[playlist.info.id] };
    origin.description = playlist.info.description ?? origin.description;
    origin.name = playlist.info.name ?? origin.name;
    origin.items = playlist.items ? playlist.items : origin.items;
    a[playlist.info.id] = origin;
    return true;
  }
  return false;
};

const _: API = {
  getPlaylistInfos,
  getPlaylistInfo,
  getPlaylistItems,
  getInitialSnapshot,
  createPlaylist,
  deletePlaylist,
  updatePlaylist,
};
export default _;
