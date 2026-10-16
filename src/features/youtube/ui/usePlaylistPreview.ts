import { useCallback, useEffect, useRef, useState } from "react";
import { loadIframeApi } from "features/player/api/iframe";
import { parsePlaylistUrl } from "features/library/model/library";

type Preview = {
  status: "idle" | "loading" | "ready" | "error";
  id: string;
  ids: string[];
  error: string;
  invalid: boolean;
};
const empty = (): Preview => ({
  status: "idle",
  id: "",
  ids: [],
  error: "",
  invalid: false,
});

/** Owns only the import preview, never the currently playing media instance. */
export function usePlaylistPreview(initialUrl?: string) {
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<Preview>(empty);
  const active = useRef(state);
  const generation = useRef(0);
  const cleanup = useRef<(() => void) | null>(null);
  const [request, setRequest] = useState<{
    id: string;
    generation: number;
  } | null>(null);
  const publish = useCallback((next: Preview) => {
    active.current = next;
    setState(next);
  }, []);
  const invalidate = useCallback(() => {
    generation.current++;
    cleanup.current?.();
    setRequest(null);
    publish(empty());
  }, [publish]);
  const load = useCallback(
    (url: string, retry = false) => {
      if (!url.trim()) {
        invalidate();
        return;
      }
      let id: string;
      try {
        id = parsePlaylistUrl(url).id;
      } catch (error) {
        invalidate();
        publish({
          ...empty(),
          status: "error",
          invalid: true,
          error: (error as Error).message,
        });
        return;
      }
      // Only a still-valid request/result can be reused. Any onChange invalidates
      // it, even if the user subsequently returns to the original URL.
      if (
        !retry &&
        active.current.id === id &&
        active.current.status !== "idle"
      )
        return;
      cleanup.current?.();
      const nextGeneration = ++generation.current;
      publish({ ...empty(), id, status: "loading" });
      setRequest({ id, generation: nextGeneration });
    },
    [invalidate, publish],
  );
  useEffect(() => {
    if (initialUrl) load(initialUrl);
  }, [initialUrl, load]);
  useEffect(() => {
    if (!request) return;
    let stopped = false;
    let player: any;
    let poll: ReturnType<typeof setInterval> | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const current = () => !stopped && generation.current === request.generation;
    const readable = () => current() && active.current.status !== "error";
    const stopTimers = () => {
      clearInterval(poll);
      clearTimeout(timeout);
    };
    const dispose = () => {
      if (stopped) return;
      stopped = true;
      stopTimers();
      player?.destroy();
      host.current?.replaceChildren();
      if (cleanup.current === dispose) cleanup.current = null;
    };
    cleanup.current = dispose;
    const fail = (message: string) => {
      if (!readable()) return;
      stopTimers();
      publish({ ...empty(), id: request.id, status: "error", error: message });
    };
    const read = () => {
      if (!readable()) return;
      try {
        const values = player?.getPlaylist?.();
        if (!Array.isArray(values) || !values.length) return;
        if (
          !values.every(
            (value: unknown) =>
              typeof value === "string" && /^[\w-]{11}$/.test(value),
          )
        ) {
          fail("곡 ID 형식을 확인하지 못했습니다.");
          return;
        }
        clearTimeout(timeout);
        if (
          active.current.status !== "ready" ||
          active.current.ids.join(",") !== values.join(",")
        )
          publish({
            ...empty(),
            id: request.id,
            ids: [...values],
            status: "ready",
          });
      } catch {
        fail("재생목록을 불러오지 못했습니다. 다시 시도해 주세요.");
      }
    };
    timeout = setTimeout(
      () =>
        fail(
          "재생목록을 불러오지 못했습니다. 공개 여부와 임베드 제한을 확인한 뒤 다시 시도해 주세요.",
        ),
      15000,
    );
    loadIframeApi()
      .then((YT) => {
        if (!readable() || !host.current) return;
        const mount = document.createElement("div");
        host.current.replaceChildren(mount);
        player = new YT.Player(mount, {
          width: "100%",
          height: 220,
          playerVars: {
            listType: "playlist",
            list: request.id,
            playsinline: 1,
            autoplay: 0,
            origin: location.origin,
          },
          events: {
            onReady: () =>
              queueMicrotask(() => {
                if (!readable()) return;
                read();
                if (readable() && !poll) poll = setInterval(read, 1000);
              }),
            onStateChange: read,
            onError: () =>
              fail(
                "YouTube에서 목록을 불러올 수 없습니다. 공개 여부와 임베드 제한을 확인해 주세요.",
              ),
          },
        });
        if (!current()) player.destroy();
      })
      .catch((error) =>
        fail(
          error instanceof Error
            ? error.message
            : "미리보기를 불러오지 못했습니다.",
        ),
      );
    return dispose;
  }, [request, publish]);
  return {
    ...state,
    host,
    load,
    invalidate,
    getReady: () => (active.current.status === "ready" ? active.current : null),
  };
}
