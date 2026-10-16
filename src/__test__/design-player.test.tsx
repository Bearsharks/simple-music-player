import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import ProgressBar from "features/player/ui/ProgressBar";
afterEach(() => {
  delete (window as any).player;
});
it("uses a keyboard-accessible local seek range instead of document width coordinates", () => {
  const seek = vi.fn();
  (window as any).player = { seekTo: seek };
  const change = vi.fn();
  render(
    <ProgressBar
      progress={{ duration: 240, currentTime: 60 }}
      setProgress={change}
    />,
  );
  const input = screen.getByRole("slider", { name: "재생 위치" });
  fireEvent.change(input, { target: { value: "120" } });
  expect(seek).toHaveBeenCalledWith(120);
  expect(change).toHaveBeenCalledWith({ duration: 240, currentTime: 120 });
});
it("handles a zero-duration track without an invalid seek value", () => {
  render(
    <ProgressBar
      progress={{ duration: 0, currentTime: 0 }}
      setProgress={vi.fn()}
    />,
  );
  expect(screen.getByRole("slider", { name: "재생 위치" })).toBeDisabled();
});

vi.mock('features/player/api/iframe', () => ({loadIframeApi: () => new Promise(() => {})}));
import YoutubePlayer from 'features/player/ui/ConnectedYoutubePlayer';
import { Provider } from 'jotai';
it('does not let global player shortcuts consume dialog, input or button keys', () => {
  const play=vi.fn(),seek=vi.fn();
  render(<Provider><YoutubePlayer/><div role="dialog" aria-label="작업 중" tabIndex={-1}>잠시 기다려 주세요.</div><input aria-label="이름"/><button>선택</button></Provider>);
  (window as any).player={getPlayerState:()=>2,playVideo:play,seekTo:seek,getCurrentTime:()=>20};
  fireEvent.keyDown(screen.getByRole('dialog'),{key:' '});
  fireEvent.keyDown(screen.getByLabelText('이름'),{key:'ArrowRight'});
  fireEvent.keyDown(screen.getByRole('button',{name:'선택'}),{key:' '});
  expect(play).not.toHaveBeenCalled();expect(seek).not.toHaveBeenCalled();
  fireEvent.keyDown(document.body,{key:' '});expect(play).toHaveBeenCalledOnce();
});
