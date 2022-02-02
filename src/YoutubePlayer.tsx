import { useEffect, useRef, useState } from 'react';
import { useRecoilValue, useSetRecoilState ,useRecoilState} from 'recoil';
import { MusicInfoActionType, playerState } from './refs/constants';
import {ytPlayerInitedState} from './recoilStates/atoms/ytplayerStates'
import youtubeSearch, { SearchType } from './refs/youtubeSearch';
import { musicPlayerState, useCurMusicManager, useMusicListManager,curMusicInfoState, musicPlayerProgressState } from './recoilStates/atoms/playlistAtoms';

function YoutubePlayer() {
    const [ytPlayerInited, setYTPlayerInited] = useRecoilState(ytPlayerInitedState);
    const setPlayState = useSetRecoilState(musicPlayerState);
    const musicListManager = useMusicListManager();
    const curMusicManager = useCurMusicManager();
    const curMusic = useRecoilValue(curMusicInfoState);
	const [progress, setProgress] = useRecoilState(musicPlayerProgressState);
	useEffect(() => {
		if (!(window as any).YT) { // If not, load the youtube ifram api script asynchronously
			const tag = document.createElement('script');
			tag.src = 'https://www.youtube.com/iframe_api';

			const firstScriptTag = document.getElementsByTagName('script')[0];
			firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
			const widthsize = Math.min(640, window.innerWidth);

			(window as any).onYouTubeIframeAPIReady = function () {
				(window as any).player = new (window as any).YT.Player('player', {
					width: widthsize,
					height: Math.round(widthsize * 10 / 16),
					playerVars: { playsinline: 1, autoplay: 1 },
					events: {
						'onStateChange': (event:any) => {
							if (event.data === (window as any).YT.PlayerState.ENDED) {
                                curMusicManager({type:MusicInfoActionType.NEXT})
								const progress= {duration:1, currentTime:0};
								setProgress(progress);
							} else if (event.data === (window as any).YT.PlayerState.PLAYING) {
								setPlayState(playerState.PLAYING);
								const progress= {duration:(window as any).player.getDuration(), currentTime:(window as any).player.getCurrentTime()};
								setProgress(progress);
							} else if (event.data === (window as any).YT.PlayerState.PAUSED) {
								setPlayState(playerState.PAUSED);							
							}							
						},
						'onReady': () => setYTPlayerInited(true)
					},
				});
			}
		}
	}, []);
    useEffect(()=>{
        if(!ytPlayerInited || (!curMusic.query && !curMusic.videoID)) return;
        if(curMusic.videoID){
            (window as any).player.loadVideoById({ videoId: curMusic.videoID });
        }else{
            youtubeSearch(curMusic.query, SearchType.Search)
            .then(data => {
                curMusicManager({
                    type: MusicInfoActionType.SET,
                    payload:data[0]
                })
            }).catch((err) => {
                console.error(err);
            });
        } 
    },[curMusic, ytPlayerInited])
    
	return (
		<div className={`playerwrapper`} id={`player`}></div>
	);
}

export default YoutubePlayer;
