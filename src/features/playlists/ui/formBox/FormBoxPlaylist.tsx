import { useState } from "react";
import { PlaylistInfo } from "shared/model/constants";
import FormBox, { FormItem } from "features/playlists/ui/formBox/FormBox";
import styles from 'features/playlists/ui/formBox/FormBoxPlaylist.module.scss';
import PlaylistItem from "features/playlists/ui/PlaylistItem";

export interface FormBoxPlaylistProps {
    name: string;
    closePopup: () => void;
    playlistInfos: PlaylistInfo[]
    submit: (_: PlaylistInfo) => void | Promise<void>;
}
function FormBoxPlaylist({ name, closePopup, submit, playlistInfos }: FormBoxPlaylistProps) {
    const [selectedPlaylist, selectPlaylist] = useState({} as PlaylistInfo);

    const playlistItemClickHandler = (tgt: PlaylistInfo) => {
        selectPlaylist(tgt);
    }
    const submitHandler = () => {
        return submit(selectedPlaylist);
    }
    const formItems: FormItem[] = [{ id: "name", name: "선택한 재생목록", value: selectedPlaylist.name, require: true, readonly: true }];
    return <FormBox
        formItems={formItems}
        name={name}
        closePopup={closePopup}
        submit={submitHandler}
        submitLabel="추가"
    >
        <div className={styles['grid-container']}>
            {playlistInfos.map((info: PlaylistInfo) =>
                <button type="button" key={info.id} className={styles['grid-item']}
                    aria-pressed={info.id === selectedPlaylist.id} aria-label={`${info.name} 선택`}
                    onClick={() => playlistItemClickHandler(info)}>
                    <div>
                        <PlaylistItem info={info} onClick={() => { }}></PlaylistItem>
                    </div>
                </button>
            )}

        </div>
        <br></br>
    </FormBox>
}
export default FormBoxPlaylist;
