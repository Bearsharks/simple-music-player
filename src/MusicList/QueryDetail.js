import { useEffect } from "react";
import { useState } from "react";
import youtubeSearch from "../refs/youtubeSearch";

export default function QueryDetail({ query, selectQuery, curItemId, hide }) {
    const [items, setItems] = useState(null);
    const [selectedQueryIdx, setSelectedQueryIdx] = useState(0);
    useEffect(() => {
        if (items) return;

        const storageValue = window.storeManager.get(query);
        if (storageValue) {
            setItems(storageValue);
            return;
        }

        async function ytsearch(q) {
            const res = await youtubeSearch(q);
            if (res.status !== 200) throw new Error('request fail');
            const data = await res.json();
            window.storeManager.set(q, data.items);
            setItems(data.items);
        }
        ytsearch(query);
    }, []);
    useEffect(() => {
        for (let idx in items) {
            if (items[idx].id.videoId === curItemId) {
                setSelectedQueryIdx(parseInt(idx));
                break;
            }
        }
    }, [items, curItemId]);

    const onCilckHandler = (e, index) => {
        e.stopPropagation();
        selectQuery(items[index]);
    }
    return (
        <>
            {items &&
                <ul >{
                    items.map(
                        (item, index) => (
                            <li
                                key={item.id.videoId}
                                onClick={e => onCilckHandler(e, index)}
                                style={(selectedQueryIdx === index) ? { color: "blue" } : {}}
                            >
                                <img src={item.snippet.thumbnails.default.url} alt={item.snippet.title}></img>
                                {item.snippet.title}
                            </li>
                        )
                    )
                }</ul>
            }
        </>

    );
}