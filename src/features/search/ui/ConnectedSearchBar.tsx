
import SearchBar from 'features/search/ui/SearchBar'
import { useOpenSearchOptionsPopup } from 'features/overlays/PopupStates'
function SearchBarConnected() {
    const openSearchOptionsPopup = useOpenSearchOptionsPopup();
    const searchOptionPopupOpen = (event: React.MouseEvent, textarea: HTMLTextAreaElement) => {
        openSearchOptionsPopup(event.target as HTMLElement, textarea);
    }
    return <SearchBar search={searchOptionPopupOpen} />
}
export default SearchBarConnected;
