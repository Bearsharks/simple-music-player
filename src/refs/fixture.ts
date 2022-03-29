import { MusicInfo, MusicInfoItem, PlaylistInfo } from "./constants"

export const playlistFixture = {
    id: "id1",
    name: "name",
    description: "description",
    items: [{
        name: "좋다고 말해",
        owner: "BOL4 - Topic",
        query: "PLOV3S2JgYNUDSUG49R2rGn-hFSIN7eZDr",
        thumbnail: "https://i.ytimg.com/vi/RRwLiAGZfc0/default.jpg",
        videoID: "RRwLiAGZfc0",
        key: "1"
    }, {
        key: "2",
        name: "첫사랑",
        owner: "Busker Busker - Topic",
        query: "PLOV3S2JgYNUDSUG49R2rGn-hFSIN7eZDr",
        thumbnail: "https://i.ytimg.com/vi/_sQhN4dLC60/default.jpg",
        videoID: "_sQhN4dLC60"
    }]
}
export const playlistInfosFixture: PlaylistInfo[] = [{
    id: "id1",
    name: "재생목록1",
    description: "description",
    thumbnails: ["https://i.ytimg.com/vi/_sQhN4dLC60/default.jpg", "https://i.ytimg.com/vi/RRwLiAGZfc0/default.jpg"],
    itemCount: 2
}, {
    id: "id2",
    name: "재생목록2",
    description: "description",
    thumbnails: ["https://i.ytimg.com/vi/RRwLiAGZfc0/default.jpg", "https://i.ytimg.com/vi/_sQhN4dLC60/default.jpg", "https://i.ytimg.com/vi/RRwLiAGZfc0/default.jpg"],
    itemCount: 3
}]

export const musicInfosFixture: MusicInfoItem[] = [{
    key: "0",
    videoID: "id1",
    name: "제목1",
    query: "쿼리1",
    owner: "소유자1",
    thumbnail: "https://i.ytimg.com/vi/RRwLiAGZfc0/default.jpg"
}, {
    key: "1",
    videoID: "id2",
    name: "제목2",
    query: "쿼리2",
    owner: "소유자2",
    thumbnail: "https://i.ytimg.com/vi/_sQhN4dLC60/default.jpg"
}]

export const options = [
    { icon: "playlist_add", name: "재생목록에 추가", onClickHandler: () => console.log("재생목록에 추가") },
    { icon: "playlist_play", name: "다음 음악으로 추가", onClickHandler: () => console.log("다음 음악으로 추가") },
    { icon: "edit", name: "재생목록 수정", onClickHandler: () => console.log("재생목록 수정") },
    { icon: "library_add_check", name: "재생목록 삭제", onClickHandler: () => console.log("재생목록 삭제") },
]
