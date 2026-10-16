import { useId, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import {
  playlistItemStateFamily,
  usePlaylistManager,
} from "../model/playlistAtoms";
import { useNotice } from "features/overlays/Notice";
import { fetchVideoTitles } from "features/youtube/api/videoMetadata";
import { urlToId, SearchType } from "features/youtube/api/youtubeSearch";
import { PlaylistActionType } from "shared/model/constants";
import { Button } from "shared/ui/shadcn/button";
import { Input } from "shared/ui/shadcn/input";
import { Label } from "shared/ui/shadcn/label";
import ErrorToast from "shared/ui/ErrorToast";
import "./AddVideo.scss";

export default function AddVideo({
  playlistID,
  close,
}: {
  playlistID: string;
  close: () => void;
}) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [duplicate, setDuplicate] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const composing = useRef(false);
  const id = useId();
  const manager = usePlaylistManager();
  const notice = useNotice();
  const items = useAtomValue(playlistItemStateFamily(playlistID));
  return (
    <form
      className="add-video-form"
      aria-busy={busy}
      onCompositionStart={() => {
        composing.current = true;
      }}
      onCompositionEnd={() => {
        composing.current = false;
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" && event.nativeEvent.isComposing)
          event.preventDefault();
      }}
      onSubmit={async (event) => {
        event.preventDefault();
        if (pending.current || composing.current) return;
        try {
          const parsed = urlToId(url);
          if (parsed.kind !== SearchType.Music)
            throw new Error("재생목록이 아닌 개별 영상 URL을 넣어 주세요.");
          if (
            items.some((item) => item.videoID === parsed.id) &&
            duplicate !== parsed.id
          ) {
            setDuplicate(parsed.id);
            setError(
              "이미 이 목록에 있는 영상입니다. 같은 곡을 한 번 더 추가할까요?",
            );
            return;
          }
          pending.current = true;
          setBusy(true);
          setError("");
          const metadata = name.trim()
            ? {}
            : await fetchVideoTitles([parsed.id]);
          await manager({
            type: PlaylistActionType.APPEND,
            payload: {
              info: { id: playlistID },
              items: [
                {
                  videoID: parsed.id,
                  name:
                    name.trim() ||
                    metadata[parsed.id]?.name ||
                    `동영상 (${parsed.id})`,
                  query: "",
                  owner: metadata[parsed.id]?.owner ?? "",
                  thumbnail: `https://i.ytimg.com/vi/${parsed.id}/default.jpg`,
                },
              ],
            },
          });
          close();
          notice("곡을 저장 목록에 추가했습니다.");
        } catch (error) {
          setError((error as Error).message);
        } finally {
          pending.current = false;
          setBusy(false);
        }
      }}
    >
      <h2>곡 추가</h2>
      <fieldset disabled={busy}>
        <div className="add-video-field">
          <Label htmlFor={`${id}-url`}>영상 URL</Label>
          <Input
            id={`${id}-url`}
            type="url"
            placeholder="https://www.youtube.com/watch?v=…"
            required
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              setDuplicate("");
              setError("");
            }}
          />
        </div>
        <div className="add-video-field">
          <Label htmlFor={`${id}-name`}>곡 이름 (선택)</Label>
          <Input
            id={`${id}-name`}
            maxLength={120}
            placeholder="나만의 곡 이름"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="add-video-actions">
          <Button type="button" variant="secondary" onClick={close}>
            취소
          </Button>
          <Button type="submit">
            {busy ? "추가 중…" : duplicate ? "중복해서 추가" : "추가"}
          </Button>
        </div>
      </fieldset>
      <ErrorToast message={error} />
    </form>
  );
}
