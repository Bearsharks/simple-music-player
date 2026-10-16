import { fireEvent, render, screen } from "@testing-library/react";
import { vi, it, expect } from "vitest";
import Dialog from "shared/ui/Dialog";
it("does not dismiss an inside-to-outside drag, but accepts a deliberate backdrop click", () => {
  const close = vi.fn();
  render(
    <Dialog label="편집" onClose={close}>
      <input aria-label="제목" />
    </Dialog>,
  );
  const dialog = screen.getByRole("dialog");
  vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({
    left: 20,
    right: 100,
    top: 20,
    bottom: 100,
    width: 80,
    height: 80,
    x: 20,
    y: 20,
    toJSON: () => ({}),
  });
  const input = screen.getByLabelText("제목");
  // jsdom has no PointerEvent constructor: MouseEvent supplies the actual coordinates.
  const pointer = (target: Element, type: string, x: number, y: number) =>
    fireEvent(
      target,
      new MouseEvent(type, {
        bubbles: true,
        button: 0,
        clientX: x,
        clientY: y,
      }),
    );
  pointer(input, "pointerdown", 40, 40);
  pointer(dialog, "pointerup", 5, 5);
  fireEvent.click(dialog, { clientX: 5, clientY: 5 });
  expect(close).not.toHaveBeenCalled();
  pointer(dialog, "pointerdown", 5, 5);
  pointer(dialog, "pointerup", 5, 5);
  fireEvent.click(dialog, { clientX: 5, clientY: 5 });
  expect(close).toHaveBeenCalledOnce();
});
it("ignores cancelled gestures and outside-to-inside releases", () => {
  const close = vi.fn();
  render(
    <Dialog label="편집" onClose={close}>
      <input aria-label="제목" />
    </Dialog>,
  );
  const dialog = screen.getByRole("dialog"),
    backdrop = dialog.parentElement!;
  fireEvent.pointerDown(backdrop, { button: 0, pointerId: 1 });
  fireEvent.pointerCancel(backdrop);
  fireEvent.click(backdrop);
  expect(close).not.toHaveBeenCalled();
  fireEvent.pointerDown(backdrop, { button: 0, pointerId: 1 });
  fireEvent.pointerUp(screen.getByLabelText("제목"), { pointerId: 1 });
  fireEvent.click(backdrop);
  expect(close).not.toHaveBeenCalled();
});
