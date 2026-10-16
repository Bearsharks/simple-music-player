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
