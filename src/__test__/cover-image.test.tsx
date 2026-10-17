import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import Cover from "shared/ui/Cover";
import { coverImageSources } from "shared/ui/CoverImage";
const url = "https://i.ytimg.com/vi/abcdefghijk/default.jpg";
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it("selects bounded sizes for small rows, cards and large covers", () => {
  expect(coverImageSources(url, 48, 2)[0]).toContain("mqdefault.jpg");
  expect(coverImageSources(url, 180, 2)[0]).toContain("hqdefault.jpg");
  expect(coverImageSources(url, 360, 2)[0]).toContain("sddefault.jpg");
  expect(coverImageSources(url, 1000, 4).join()).not.toContain("maxres");
  expect(coverImageSources("https://example.com/art.jpg", 500)).toEqual(["https://example.com/art.jpg"]);
  expect(coverImageSources("https://i.ytimg.com.evil.test/vi/abcdefghijk/default.jpg", 500)[0]).toContain("evil.test");
});
it("upgrades old saved URLs without rewriting storage and falls back on missing sizes", () => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 400 } as DOMRect);
  const { container, rerender } = render(<Cover id="a" thumbnail={url} />);
  const img = () => container.querySelector("img")!;
  expect(img().src).toContain("sddefault.jpg");
  Object.defineProperty(img(), "naturalWidth", { configurable: true, value: 120 });
  fireEvent.load(img());
  expect(img().src).toContain("hqdefault.jpg");
  fireEvent.error(img());
  expect(img().src).toContain("mqdefault.jpg");
  fireEvent.error(img());
  expect(img().src).toContain("/default.jpg");
  fireEvent.error(img());
  expect(container.querySelector("img")).toBeNull();
  expect(container.querySelector("svg")).not.toBeNull();
  rerender(<Cover id="b" thumbnail={url.replace("abcdefghijk", "lmnopqrstuv")} />);
  expect(img().src).toContain("lmnopqrstuv/sddefault.jpg");
});
it("updates the selected size when the rendered cover grows and disconnects observation", () => {
  let width = 48;
  let resized: (() => void) | undefined;
  const disconnect = vi.fn();
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => ({ width } as DOMRect));
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: () => void) { resized = callback; }
    observe() {}
    disconnect = disconnect;
  });
  const { container, unmount } = render(<Cover id="resize" thumbnail={url} />);
  expect(container.querySelector("img")!.src).toContain("mqdefault.jpg");
  width = 500;
  act(() => resized?.());
  expect(container.querySelector("img")!.src).toContain("sddefault.jpg");
  unmount();
  expect(disconnect).toHaveBeenCalledOnce();
  vi.unstubAllGlobals();
});
