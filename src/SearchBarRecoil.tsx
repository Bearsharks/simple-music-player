import { useSetRecoilState } from 'recoil'
import SearchBar from './components/SearchBar'
import { PopupInfo, PopupKind, PopupInfoState, popupOpenState } from './Popups/PopupStates'
import styles from './SearchBarRecoil.module.scss';
function SearchBarRecoil() {
    const setPopupInfo = useSetRecoilState(PopupInfoState);
    const setPopupOpen = useSetRecoilState(popupOpenState);
    const searchOptionPopupOpen = (event: React.MouseEvent, textarea: HTMLTextAreaElement) => {
        event.stopPropagation();
        const popupInitInfo: PopupInfo = {
            target: event.target as HTMLElement,
            kind: PopupKind.SearchOptions,
            data: textarea
        }
        setPopupOpen(true);
        setPopupInfo(popupInitInfo);

    }
    return <div className={styles['wrapper']}>
        <SearchBar search={searchOptionPopupOpen} />
    </div>
}
export default SearchBarRecoil;