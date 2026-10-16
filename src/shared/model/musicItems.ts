import { MusicInfo, MusicInfoItem } from './constants';
import keyGenerator from 'shared/lib/keyGenerator';
export function toMusicInfoItems(items: MusicInfo[]): MusicInfoItem[] {
    const keys = keyGenerator(items.length);
    return items.map((item, index) => ({ ...item, key: keys[index] }));
}
