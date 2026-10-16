import { Button } from "shared/ui/shadcn/button";
import { useEffect, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import {
  playlistItemStateFamily,
  usePlaylistManager,
} from "../model/playlistAtoms";
import { PlaylistActionType } from "shared/model/constants";
import {
  fetchVideoTitles,
  isGeneratedTitle,
} from "features/youtube/api/videoMetadata";
import ErrorToast from "shared/ui/ErrorToast";

export default function RestoreTitles({ playlistID }: { playlistID: string }) {
  const items = useAtomValue(playlistItemStateFamily(playlistID));
  const manager = usePlaylistManager();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const candidates = items.filter(isGeneratedTitle);
  if (!candidates.length && !error) return null;
  return (
    <>
      {candidates.length > 0 && (
        <Button variant="secondary"
          type="button"
          className="secondary-button"
          disabled={busy}
          onClick={async () => {
            if (controller.current) return;
            const current = new AbortController();
            controller.current = current;
            setBusy(true);
            setError("");
            try {
              const titles = await fetchVideoTitles(
                candidates.map((item) => item.videoID),
                current.signal,
              );
              if (current.signal.aborted) return;
              const patches = candidates
                .filter((item) => titles[item.videoID])
                .map((item) => ({
                  key: item.key,
                  previousName: item.name,
                  ...titles[item.videoID],
                }));
              if (patches.length)
                await manager({
                  type: PlaylistActionType.PATCH_METADATA,
                  payload: { info: { id: playlistID }, patches },
                });
              if (patches.length < candidates.length)
                setError(
                  `${candidates.length - patches.length}곡의 제목을 가져오지 못했습니다. 다시 시도할 수 있습니다.`,
                );
            } catch (e) {
              setError((e as Error).message);
            } finally {
              controller.current = null;
              setBusy(false);
            }
          }}
        >
          {busy ? "제목 불러오는 중…" : "원래 곡 제목 가져오기"}
        </Button>
      )}
      <ErrorToast message={error} />
    </>
  );
}
