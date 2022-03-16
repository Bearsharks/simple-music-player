import { PlaylistInfo } from "./constants"

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