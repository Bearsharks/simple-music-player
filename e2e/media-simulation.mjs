// Verification-only adapter. No real video, duration, audio, or network playback is tested.
export async function installMediaSimulation(page) {
  await page.route("https://**/*", (route) =>
    route.fulfill({ status: 200, contentType: "text/plain", body: "" }),
  );
  await page.addInitScript(() => {
    const originalTransaction = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (...args) {
      if (args[1] === "readwrite" && window.__failNextWrite) {
        window.__failNextWrite = false;
        throw new Error("검증용 저장 실패");
      }
      return originalTransaction.apply(this, args);
    };
    window.__simulatedPlayer = {
      loads: [],
      time: 0,
      state: 0,
      instances: 0,
      destroys: 0,
      volume: 100,
      muted: false,
    };
    window.YT = {
      Player: class {
        constructor(host, config) {
          this.config = config;
          this.number = ++window.__simulatedPlayer.instances;
          host.dataset.simulatedPlayer = String(this.number);
          host.textContent = "YouTube 모의 플레이어 · 실제 재생 검증 아님";
          host.style.cssText =
            "height:100%;display:grid;place-items:center;text-align:center;padding:20px;color:#a1a1b3;font:12px sans-serif;background:#161625";
          if (!config.playerVars?.list)
            window.__simulateMediaError = () =>
              config.events.onError?.({ data: 150 });
          if (config.playerVars?.list)
            window.__simulatePreviewError = () =>
              config.events.onError?.({ data: 150 });
          queueMicrotask(() => config.events.onReady());
        }
        destroy() {
          window.__simulatedPlayer.destroys++;
        }
        stopVideo() {
          window.__simulatedPlayer.state = 0;
          this.config.events.onStateChange?.({ data: 0 });
        }
        getPlayerState() {
          return window.__simulatedPlayer.state;
        }
        getDuration() {
          return 180;
        }
        getCurrentTime() {
          return window.__simulatedPlayer.time;
        }
        getVolume() {
          return window.__simulatedPlayer.volume;
        }
        isMuted() {
          return window.__simulatedPlayer.muted;
        }
        setVolume(value) {
          window.__simulatedPlayer.volume = value;
        }
        mute() {
          window.__simulatedPlayer.muted = true;
        }
        unMute() {
          window.__simulatedPlayer.muted = false;
        }
        playVideo() {
          window.__simulatedPlayer.state = 1;
          this.config.events.onStateChange?.({ data: 1 });
        }
        pauseVideo() {
          window.__simulatedPlayer.state = 2;
          this.config.events.onStateChange?.({ data: 2 });
        }
        seekTo(time) {
          window.__simulatedPlayer.time = time;
        }
        loadVideoById(value) {
          window.__simulatedPlayer.loads.push(value.videoId);
          window.__simulatedPlayer.time = 0;
          this.playVideo();
        }
        getPlaylist() {
          return (
            window.__simulatedPlaylistIDs ?? ["abcdefghijk", "lmnopqrstuv"]
          );
        }
      },
    };
  });
}

// Explicit fixture for official playlist oEmbed shape. Never a live metadata check.
export async function installPlaylistMetadataSimulation(page) {
  await page.route("https://www.youtube.com/oembed?*", async (route) => {
    const endpoint = new URL(route.request().url());
    const source = new URL(endpoint.searchParams.get("url"));
    if (source.pathname !== "/playlist") return route.fallback();
    const id = source.searchParams.get("list");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify({
        provider_name: "YouTube",
        title: "실제 응답 형태의 모의 목록",
        html: `<iframe src="https://www.youtube.com/embed/videoseries?list=${id}"></iframe>`,
      }),
    });
  });
}
