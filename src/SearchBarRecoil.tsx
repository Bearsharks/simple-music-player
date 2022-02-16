
import SearchBar from './components/SearchBar'
import { useOpenSearchOptionsPopup } from './Popups/PopupStates'
import styles from './SearchBarRecoil.module.scss';
function SearchBarRecoil() {
    const openSearchOptionsPopup = useOpenSearchOptionsPopup();
    const searchOptionPopupOpen = (event: React.MouseEvent, textarea: HTMLTextAreaElement) => {
        openSearchOptionsPopup(event.target as HTMLElement, textarea);
    }
    return <div className={styles['wrapper']}>
        <SearchBar search={searchOptionPopupOpen} />
    </div>
}
export default SearchBarRecoil;