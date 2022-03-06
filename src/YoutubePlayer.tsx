import { useEffect, useRef, } from 'react';
import { useRecoilValue, useSetRecoilState, useRecoilState } from 'recoil';
import { MusicInfoActionType, MusicInfoItem, PlayerState } from './refs/constants';
import { ytPlayerInitedState } from './recoilStates/atoms/ytplayerStates'
import youtubeSearch, { SearchType } from './refs/youtubeSearch';
import { musicPlayerState, useCurMusicManager, curMusicInfoState, musicPlayerProgressState } from './recoilStates/atoms/playlistAtoms';

function YoutubePlayer() {
	const [ytPlayerInited, setYTPlayerInited] = useRecoilState(ytPlayerInitedState);
	const setPlayState = useSetRecoilState(musicPlayerState);
	const curMusicManager = useCurMusicManager();
	const curMusic = useRecoilValue(curMusicInfoState);
	const setProgress = useSetRecoilState(musicPlayerProgressState);
	const prevMusicRef = useRef<MusicInfoItem>();
	useEffect(() => {
		if (!(window as any).YT) { // If not, load the youtube ifram api script asynchronously
			const tag = document.createElement('script');
			tag.src = 'https://www.youtube.com/iframe_api';

			const firstScriptTag = document.getElementsByTagName('script')[0];
			firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

			(window as any).onYouTubeIframeAPIReady = function () {
				(window as any).player = new (window as any).YT.Player('player', {
					width: '100%',
					height: '100%',
					playerVars: { playsinline: 1, autoplay: 1 },
					events: {
						'onStateChange': (event: any) => {
							if (event.data === (window as any).YT.PlayerState.ENDED) {
								setProgress({ duration: (window as any).player.getDuration(), currentTime: (window as any).player.getDuration() });
								curMusicManager({ type: MusicInfoActionType.NEXT })
							} else if (event.data === (window as any).YT.PlayerState.PLAYING) {
								setPlayState(PlayerState.PLAYING);
								const progress = { duration: (window as any).player.getDuration(), currentTime: (window as any).player.getCurrentTime() };
								setProgress(progress);
							} else if (event.data === (window as any).YT.PlayerState.PAUSED) {
								setPlayState(PlayerState.PAUSED);
							}
						},
						'onReady': () => setYTPlayerInited(true)
					},
				});
			}
		}
	}, []);
	useEffect(() => {
		if (!ytPlayerInited || (!curMusic.query && !curMusic.videoID)) return;
		const player = (window as any).player;
		if (player.getPlayerState() !== PlayerState.ENDED &&
			prevMusicRef.current &&
			curMusic.key === prevMusicRef.current.key &&
			curMusic.videoID === prevMusicRef.current.videoID) return;

		if (curMusic.videoID) {
			player.loadVideoById({ videoId: curMusic.videoID });
		} else {
			youtubeSearch(curMusic.query, SearchType.Search)
				.then(data => {
					curMusicManager({
						type: MusicInfoActionType.SET_INFO,
						payload: data[0]
					})
				}).catch((err) => {
					console.error(err);
					return;
				});
		}
		prevMusicRef.current = curMusic;
	}, [curMusic, ytPlayerInited])

	return (
		<div id={`player`}></div>
	);
}

export default YoutubePlayer;
