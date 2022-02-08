import { useSetRecoilState } from 'recoil'
import SearchBar from './components/SearchBar'
import { PopupInfo, PopupKind, PopupInfoState } from './Popups/PopupStates'

function SearchBarRecoil() {
    const setPopupInfo = useSetRecoilState(PopupInfoState);
    const searchOptionPopupOpen = (event: React.MouseEvent, textarea: HTMLTextAreaElement) => {
        event.stopPropagation();
        const popupInitInfo: PopupInfo = {
            target: event.target as HTMLElement,
            kind: PopupKind.SearchOptions,
            data: textarea
        }
        setPopupInfo(popupInitInfo);
    }
    return <SearchBar search={searchOptionPopupOpen} />
}
export default SearchBarRecoil;