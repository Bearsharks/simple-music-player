import { useState } from "react";
import { PlaylistInfo } from "refs/constants";
import FormBox, { FormItem } from "components/formBox/FormBox";
import styles from './FormBoxPlaylist.module.scss';
import PlaylistItem from "components/PlaylistItem";

export interface FormBoxPlaylistProps {
    name: string;
    closePopup: () => void;
    playlistInfos: PlaylistInfo[]
    submit: (_: PlaylistInfo) => void;
}
function FormBoxPlaylist({ name, closePopup, submit, playlistInfos }: FormBoxPlaylistProps) {
    const [selectedPlaylist, selectPlaylist] = useState({} as PlaylistInfo);

    const playlistItemClickHandler = (tgt: PlaylistInfo) => {
        selectPlaylist(tgt);
    }
    const submitHandler = () => {
        submit(selectedPlaylist);
    }
    const formItems: FormItem[] = [{ id: "name", name: "선택한 재생목록", value: selectedPlaylist.name, require: true, readonly: true }];
    return <FormBox
        formItems={formItems}
        name={name}
        closePopup={closePopup}
        submit={submitHandler}
    >
        <div className={styles['grid-container']}>
            {playlistInfos.map((info: PlaylistInfo) =>
                <div key={info.id} className={styles['grid-item']} style={info.id === selectedPlaylist.id ? { "background": "white" } : {}}
                    onClick={() => playlistItemClickHandler(info)}>
                    <div>
                        <PlaylistItem info={info} onClick={() => { }}></PlaylistItem>
                    </div>
                </div>
            )}

        </div>
        <br></br>
    </FormBox>
}
export default FormBoxPlaylist;