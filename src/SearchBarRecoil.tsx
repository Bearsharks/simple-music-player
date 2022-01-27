import { useSetRecoilState } from 'recoil'
import SearchBar from './components/SearchBar'
import { OptionSelectorInfo, OptionSelectorState, OptionSelectorOpenState } from './recoilStates/PopupStates'
import { useMusicListManager } from './recoilStates/atoms/playlistAtoms';
import { MusicInfo, MusicListActionType } from './refs/constants';
import youtubeSearch from './refs/youtubeSearch';
function SearchBarRecoil() {
    const setPopupOpen = useSetRecoilState(OptionSelectorOpenState);
    const setPopupInfo = useSetRecoilState(OptionSelectorState);
    const musicListManager = useMusicListManager();

    const search = async (query: string): Promise<MusicInfo[]> => {
        let queryList: string[] = query.split("\n").filter((element) => element !== "");
        if (queryList.length <= 0) return [];
        let newMusicList: MusicInfo[] = [];
        for (let i = 0; i < queryList.length; i++) {
            if (queryList[i].substring(0, 4) === 'http') {
                let result: any = {};
                let qs = queryList[i].substring(queryList[i].indexOf('?') + 1).split('&');
                for (let j = 0; j < qs.length; j++) {
                    const [kind, value] = qs[j].split('=');
                    result[kind] = value;
                }
                if (result['list']) {
                    const searchResult: any = await youtubeSearch(result['list'], 'list');
                    const musicInfos: MusicInfo[] = searchResult.map((el: any): MusicInfo => { return { name: el.title, videoID: el.videoId, query: "" } });
                    newMusicList.push(...musicInfos);
                } else if (result['v']) {
                    //result.push(...await this.appendMusic(g.id));
                    const searchResult: any = await youtubeSearch(result['v'], 'music');
                    const musicInfos: MusicInfo[] = searchResult.map((el: any): MusicInfo => { return { name: el.title, videoID: el.videoId, query: "" } });
                    newMusicList.push(...musicInfos);
                } else {
                    console.log(`${i}번째 검색어 잘 못된 url`);
                }
            } else {
                newMusicList.push({
                    videoID: "",
                    name: queryList[i],
                    query: queryList[i]
                })
            }
        }
        return newMusicList;
    }

    const addMusics = async (textarea: HTMLTextAreaElement, type?: MusicListActionType) => {
        type = type ? type : MusicListActionType.APPEND_PLAYLIST;
        try {
            const searchResult: MusicInfo[] = await search(textarea.value);
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
    const searchOptionPopupOpen = (event: React.MouseEvent, textarea: HTMLTextAreaElement) => {
        event.stopPropagation();
        const popupInitInfo: OptionSelectorInfo = {
            target: event.target as HTMLElement,
            items: [
                {
                    icon: "O", name: "다음 음악으로 재생",
                    onClickHandler: () => addMusics(textarea, MusicListActionType.ADD_TO_NEXT)
                },
                {
                    icon: "O", name: "목록에 추가",
                    onClickHandler: () => addMusics(textarea, MusicListActionType.APPEND_ITEMS)
                }
            ]
        }
        setPopupInfo(popupInitInfo);
        setPopupOpen(true);
    }
    return (
        <div>
            <SearchBar search={searchOptionPopupOpen} />
        </div>
    )
}
export default SearchBarRecoil;