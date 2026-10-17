import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PlaylistFramePreview from "features/youtube/prototype/PlaylistFramePreview";

describe("playlist frame preview", () => {
  it("embeds the requested playlist without autoplay", () => {
    render(<PlaylistFramePreview />);
    const frame = screen.getByTitle("YouTube 재생목록");
    const url = new URL(frame.getAttribute("src")!);
    expect(url.origin).toBe("https://www.youtube.com");
    expect(url.pathname).toBe("/embed/videoseries");
    expect(url.searchParams.get("list")).toBe("PLVKdYxm17gBYbyZYbHWZDr7NU3ZwtFiB5");
    expect(url.searchParams.get("autoplay")).toBe("0");
    expect(frame.getAttribute("referrerpolicy")).toBe("strict-origin-when-cross-origin");
  });
});
