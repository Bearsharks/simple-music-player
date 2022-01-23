import './Test.scss';
import { useRecoilValue, useSetRecoilState } from "recoil";
import { useCurMusicManager, useMusicListManager, usePlaylistManager, playlistIDsState, musicListState } from "./recoilStates/atoms/playlistAtoms";
import { useState } from 'react';
import PlaylistsRecoil from './PlaylistsRecoil'
import { FormPopupState, FormPopupOpenState } from './recoilStates/PopupStates';
import { MusicListAction, MusicListActionType, PlaylistAction, PlaylistActionType, MusicInfo_tmp as MusicInfo } from './refs/constants';
import FormPopup, { FormPopupData } from './FormPopup';
function TestPage() {
    const musicList = useRecoilValue(musicListState);
    const curMusicInfo = useCurMusicManager();
    const musicListManager = useMusicListManager();
    const setFormPopupState = useSetRecoilState(FormPopupState);
    const setPopupOpen = useSetRecoilState(FormPopupOpenState);
    //
    //1
    /**todo
     * 1. 새로운 재생목록 만들수 있도록 팝업을 만든다. 팝업생성시 데이터를 넘겨줄수 있다.
     * 1-1 재생목록 생성을 누르면 재생목록생성팝업이 뜬다. 입력하면 재생목록이 생성된다
     * 1-1-1 재생목록생성팝업은 이름 설명입력할 수 있고, 취소버튼을 누르거나 다른곳을 누르면 종료된다.
     * 1-1-1-1 팝업은 리코일로 제어한다
     * 
     * 2. 검색바를 통해 음악 목록을 추가할수 있다.
     * 2.1 추가시 팝업창을 띄우고 다음으로 재생하거나 마지막에 추가를 선택할수 있는 옵션선택팝업을 띄운다
     * 2.2.선택하면 그 동작대로 현재 재생목록에 추가한다.
     * 
     * 3. 현재재생목록에서 현재 재생목록을 전체를 저장 할 수 있다. 팝업으로 정보를 전달한다.
     * 3.1. 음악에서 생성버튼을 누르면 그 음악만을 포함해서 재생목록을 만들 수 있다
     * 3.2. 재생목록생성버튼을 누르면 팝업으로 빈 재생목록, 나의 유튜브보관함에서 가져오기, 유튜브 링크로 가져오기중 선택할수있다.
     * 
     * 4. 재생목록을 수정한다. 수정 팝업이 나온다 수정팝업은 폼팝업이다.
     * 
     * 5. 팝업은 옵션선택기와 폼두가지로 나뉜다. 팝업은 데이터를 받아서 생성한다. 팝업은 다른곳클릭하면 알아서 꺼진다.
     * 5.1. 옵션선택기는 위치를 지정 할 수 있고, 기본적으로 오른쪽 아래로 펼쳐지고, 자리가 부족하면 왼쪽이나 위로 펼쳐진다
     * 5.2. 재생목록생성옵션선택 음악관련기능 선택, 재생목록 관련기능 선택 3가지가 있다.
     * 5.3. 폼은 중간에 딱 차지하게 나온다.
     * 
     * 5.4. 폼은 입력데이터를 보고 어떤 동작을 처리하는 기본동작을 수행한다.
     * 5.5. 폼 자식은 해당 입력데이터의 구성을 표현한다.
     * 5.6. 폼 자식을 받아서 처리한다.
     */

    const onSubmitHandler = (data: any) => {
        console.log(data);
    }
    const openFormPopup = () => {
        setPopupOpen(true);
        const formInitData: FormPopupData = {
            items: [
                { id: "name", name: "이름" },
                { id: "desc", name: "설명" },
            ],
            submit: onSubmitHandler
        }
        setFormPopupState(formInitData);
    }
    return (
        <div>테스트 페이지입니다.
            <FormPopup></FormPopup>
            <button onClick={openFormPopup}>팝업열기</button>
            <PlaylistsRecoil></PlaylistsRecoil>
            <div className="musiclists">{
                musicList.map((el: MusicInfo, idx: number) => <div key={idx}>{JSON.stringify(el)}</div>)
            }
            </div>

        </div>
    );
}


export default TestPage;