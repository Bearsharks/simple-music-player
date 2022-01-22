import { Options } from "../../../components/OptionSelector";
import { MusicInfo_tmp as MusicInfo, PlaylistInfo } from "../../../refs/constants";

export const musicListFixture: MusicInfo[] = [
    {
        videoID: "11",
        name: "노래1",
        query: "노래1"
    },
    {
        videoID: "22",
        name: "노래2",
        query: "노래2"
    },
    {
        videoID: "33",
        name: "노래3",
        query: "노래3"
    }
]

export const playlistInfosFixture: PlaylistInfo[] = [
    { id: "1", name: "1번", description: "1번 설명" },
    { id: "2", name: "2번", description: "2번 설명" },
    { id: "3", name: "3번", description: "3번 설명" },
    { id: "4", name: "4번", description: "4번 설명" }
]

export const OptionsFixture: Options[] = [
    { icon: "O", name: '1번선택지', onClick: () => { console.log("1번") } },
    { icon: "O", name: '2번선택지', onClick: () => { console.log("2번") } },
    { icon: "O", name: '3번선택지', onClick: () => { console.log("3번") } },
    { icon: "O", name: '4번선택지', onClick: () => { console.log("4번") } },
    { icon: "O", name: '5번선택지', onClick: () => { console.log("5번") } },
]