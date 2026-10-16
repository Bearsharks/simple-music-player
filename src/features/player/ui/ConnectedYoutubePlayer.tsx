import { loadIframeApi } from '../api/iframe';
import { useEffect, useRef, } from 'react';
import { useAtomValue, useSetAtom, useAtom } from 'jotai';
import { MusicInfoActionType, MusicInfoItem, PlayerState } from 'shared/model/constants';
import { ytPlayerInitedState } from 'features/player/model/ytplayerStates'
import youtubeSearch, { SearchType } from 'features/youtube/api/youtubeSearch';
import { useCurMusicManager, curMusicInfoState } from 'features/queue/model/queue';
import { musicPlayerState, musicPlayerProgressState } from 'features/player/model/playback';

const handleKeyboardEvent = (e: KeyboardEvent) => {
	const target = e.target as HTMLElement | null;
	if (target?.closest('input,textarea,select,button,[contenteditable=true]') || e.ctrlKey || e.metaKey || e.altKey) return;
	const player = (window as any).player;
	if (!player) return;
	if ([' ', 'ArrowRight', 'ArrowLeft', 'm'].includes(e.key)) e.preventDefault();
	if (e.key === ' ') {
		if (player.getPlayerState() === PlayerState.PLAYING) {
			player.pauseVideo();
		} else {
			player.playVideo();
		}
	} else if (e.key === 'ArrowRight') {
		player.seekTo(player.getCurrentTime() + 5);
	} else if (e.key === 'ArrowLeft') {
		player.seekTo(player.getCurrentTime() - 5);
	} else if (e.key === 'm') {
		if (player.isMuted()) player.unMute();
		else player.mute();
	}
}

function YoutubePlayer() {
	const [ytPlayerInited, setYTPlayerInited] = useAtom(ytPlayerInitedState);
	const setPlayState = useSetAtom(musicPlayerState);
	const curMusicManager = useCurMusicManager();
	const curMusic = useAtomValue(curMusicInfoState);
	const setProgress = useSetAtom(musicPlayerProgressState);
	const prevMusicRef = useRef<MusicInfoItem | undefined>(undefined);
	useEffect(() => {
		window.addEventListener('keydown', handleKeyboardEvent);
		return () => {
			window.removeEventListener('keydown', handleKeyboardEvent);
		}
	}, []);
    const host = useRef<HTMLDivElement>(null);
    useEffect(() => {
        let cancelled = false;
        let player: any;
        setYTPlayerInited(false);
        loadIframeApi().then(YT => {
            if (cancelled || !host.current) return;
            const mount = document.createElement('div'); host.current.replaceChildren(mount);
            player = new YT.Player(mount, {
                width: '100%', height: '100%', playerVars: { playsinline: 1, autoplay: 1 },
                events: {
                    onReady: () => { if (!cancelled) setYTPlayerInited(true); },
                    onStateChange: (event: {data: number}) => {
                        if (cancelled) return;
                        setPlayState(event.data);
                        if (event.data === PlayerState.ENDED) {
                            setProgress({duration: player.getDuration(), currentTime: player.getDuration()});
                            void curMusicManager({type: MusicInfoActionType.NEXT});
                        }
                    },
                },
            });
            (window as any).player = player;
        }).catch(error => { if (!cancelled && host.current) host.current.textContent = error.message; });
        return () => {
            cancelled = true;
            player?.destroy();
            if ((window as any).player === player) delete (window as any).player;
            setYTPlayerInited(false);
        };
    }, [curMusicManager, setPlayState, setProgress, setYTPlayerInited]);
	useEffect(() => {
		if (!ytPlayerInited) return;
        let cancelled = false;
		const player = (window as any).player;
		if (!curMusic.query && !curMusic.videoID) {
			player.stopVideo();
			return;
		}
		if (player.getPlayerState() !== PlayerState.ENDED &&
			prevMusicRef.current &&
			curMusic.key === prevMusicRef.current.key &&
			curMusic.videoID === prevMusicRef.current.videoID) return;

		if (curMusic.videoID) {
			player.loadVideoById({ videoId: curMusic.videoID });
		} else {
			youtubeSearch(curMusic.query, SearchType.Search)
				.then(data => {
					if (cancelled || !data[0]) return;
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
        return () => { cancelled = true; };
	}, [curMusic, ytPlayerInited, curMusicManager])

	return (
		<div id="player" ref={host}></div>
	);
}

export default YoutubePlayer;
