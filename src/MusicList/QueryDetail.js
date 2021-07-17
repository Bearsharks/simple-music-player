import { useEffect } from "react";
import { useState } from "react";
import youtubeSearch from "../refs/youtubeSearch";

export default function QueryDetail({ query, selectQuery, curItemId, hide }) {
    const [items, setItems] = useState(null);
    const [selectedQueryIdx, setSelectedQueryIdx] = useState(0);
    useEffect(() => {
        if (items) return;
        const storageValue = window.storeManager.get(query, 'query');
        if (storageValue) {
            setItems(storageValue);
            return;
        }
        async function ytsearch(q) {
            try {
                const data = await youtubeSearch(q);

                window.storeManager.set(q, data, 'query');
                setItems(data);
            } catch (err) {
                console.error(err);
            }

        }
        ytsearch(query);
    }, []);
    useEffect(() => {
        for (let idx in items) {
            if (items[idx].videoId === curItemId) {
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
                                key={item.videoId}
                                onClick={e => onCilckHandler(e, index)}
                                style={(selectedQueryIdx === index) ? { color: "blue" } : {}}
                            >
                                <img src={item.thumbnail} alt={item.title}></img>
                                {item.title}
                            </li>
                        )
                    )
                }</ul>
            }
        </>

    );
}