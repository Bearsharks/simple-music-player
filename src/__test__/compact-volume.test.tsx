import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";
import SoundController from "features/player/ui/playerController/SoundController";
import { ytPlayerInitedState } from "features/player/model/ytplayerStates";
import Dialog from "shared/ui/Dialog";

function pointer(node: Element, type: string, pointerType = "mouse") {
  const event = new MouseEvent(type, { bubbles: true, button: 0 });
  Object.defineProperty(event, "pointerType", { value: pointerType });
  fireEvent(node, event);
}
const settleLeave = () =>
  act(() => new Promise((resolve) => setTimeout(resolve, 180)));
function setup(ready = true) {
  let volume = 65;
  let muted = true;
  const player = {
    getVolume: () => volume,
    isMuted: () => muted,
    setVolume: vi.fn((next) => {
      volume = next;
    }),
    unMute: vi.fn(() => {
      muted = false;
    }),
  };
  (window as any).player = player;
  const store = createStore();
  store.set(ytPlayerInitedState, ready);
  render(
    <Provider store={store}>
      <button>다른 작업</button>
      <SoundController />
    </Provider>,
  );
  return {
    player,
    store,
    trigger: screen.getByRole("button", { name: "음량 조절" }),
    outside: screen.getByRole("button", { name: "다른 작업" }),
  };
}
beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: true })),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete (window as any).player;
});

it("opens on mouse hover without stealing focus and bridges the gap to the slider", async () => {
  const { trigger, outside } = setup();
  outside.focus();
  pointer(trigger, "pointerover");
  const slider = await screen.findByRole("slider", { name: "음량" });
  const content = slider.closest("[data-slot=popover-content]")!;
  expect(outside).toHaveFocus();
  expect(content).toHaveTextContent("");
  expect(content.querySelectorAll("input")).toHaveLength(1);
  expect(content.querySelectorAll("button")).toHaveLength(0);
  pointer(trigger, "pointerout");
  pointer(content, "pointerover");
  await settleLeave();
  expect(slider).toBeInTheDocument();
  pointer(content, "pointerout");
  await waitFor(() =>
    expect(screen.queryByRole("slider")).not.toBeInTheDocument(),
  );
  expect(outside).toHaveFocus();
});

it("keeps an outside drag alive and closes only after release when neither focus nor hover remains", async () => {
  const { trigger } = setup();
  pointer(trigger, "pointerover");
  const slider = await screen.findByRole("slider");
  pointer(slider, "pointerdown");
  pointer(trigger, "pointerout");
  await settleLeave();
  expect(slider).toBeInTheDocument();
  pointer(document.body, "pointerup");
  await waitFor(() =>
    expect(screen.queryByRole("slider")).not.toBeInTheDocument(),
  );
});

it("keeps keyboard focus on the trigger, enters the range with Tab, and does not reopen after Escape", async () => {
  const { trigger, outside, player } = setup();
  const user = userEvent.setup();
  await user.tab();
  expect(outside).toHaveFocus();
  await user.tab();
  expect(trigger).toHaveFocus();
  const slider = screen.getByRole("slider", { name: "음량" });
  expect(slider).toHaveValue("0");
  expect(slider.style.getPropertyValue("--volume")).toBe("0%");
  const muteIcon = trigger.querySelector("svg")!.innerHTML;
  await user.tab();
  expect(slider).toHaveFocus();
  fireEvent.change(slider, { target: { value: "25" } });
  expect(player.unMute).toHaveBeenCalledOnce();
  expect(slider).toHaveValue("25");
  expect(slider.style.getPropertyValue("--volume")).toBe("25%");
  expect(trigger.querySelector("svg")!.innerHTML).not.toBe(muteIcon);
  fireEvent.change(slider, { target: { value: "100" } });
  expect(slider.style.getPropertyValue("--volume")).toBe("100%");
  fireEvent.change(slider, { target: { value: "0" } });
  expect(trigger.querySelector("svg")!.innerHTML).toBe(muteIcon);
  expect(slider).toHaveValue("0");
  expect(slider.style.getPropertyValue("--volume")).toBe("0%");
  await user.keyboard("{Escape}");
  expect(trigger).toHaveFocus();
  await settleLeave();
  expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  await user.keyboard("{ArrowDown}");
  expect(screen.getByRole("slider")).toHaveFocus();
});

it("opens on the first touch even when pointer focus precedes click and explicit close stays closed", async () => {
  const { trigger } = setup();
  pointer(trigger, "pointerover", "touch");
  expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  pointer(trigger, "pointerdown", "touch");
  act(() => trigger.focus());
  fireEvent.click(trigger, { detail: 1 });
  expect(screen.getByRole("slider")).toBeInTheDocument();
  expect(trigger).toHaveFocus();
  pointer(trigger, "pointerdown", "touch");
  fireEvent.click(trigger, { detail: 1 });
  await settleLeave();
  expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

it("keeps a mouse-click dismissal closed until fresh hover and never reuses stale keyboard autofocus", async () => {
  const { trigger, outside } = setup();
  const user = userEvent.setup();
  act(() => trigger.focus());
  await user.keyboard("{ArrowUp}");
  expect(screen.getByRole("slider")).toHaveFocus();
  await user.keyboard("{Escape}");
  act(() => outside.focus());
  pointer(trigger, "pointerover");
  expect(screen.getByRole("slider")).toBeInTheDocument();
  expect(outside).toHaveFocus();
  pointer(trigger, "pointerdown");
  fireEvent.click(trigger, { detail: 1 });
  await settleLeave();
  expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  pointer(trigger, "pointerout");
  pointer(trigger, "pointerover");
  expect(screen.getByRole("slider")).toBeInTheDocument();
});

it("clears the retired popup hover area after Escape so a later hover can leave normally", async () => {
  const { trigger, outside } = setup();
  const user = userEvent.setup();
  pointer(trigger, "pointerover");
  const content = screen
    .getByRole("slider")
    .closest("[data-slot=popover-content]")!;
  pointer(trigger, "pointerout");
  pointer(content, "pointerover");
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  act(() => outside.focus());
  pointer(trigger, "pointerover");
  expect(screen.getByRole("slider")).toBeInTheDocument();
  pointer(trigger, "pointerout");
  await waitFor(() =>
    expect(screen.queryByRole("slider")).not.toBeInTheDocument(),
  );
});

it("disables an unready player and closes its open control when readiness is lost", async () => {
  const { trigger, store, player } = setup(false);
  expect(trigger).toBeDisabled();
  pointer(trigger, "pointerover");
  expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  act(() => store.set(ytPlayerInitedState, true));
  act(() => trigger.focus());
  expect(screen.getByRole("slider")).toBeInTheDocument();
  act(() => store.set(ytPlayerInitedState, false));
  expect(trigger).toBeDisabled();
  expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  expect(player.setVolume).not.toHaveBeenCalled();
});

it.each([false, true])(
  "separates a subtle panel from normal tasks with native=%s",
  (native) => {
    if (native) {
      Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
        configurable: true,
        value: function (this: HTMLDialogElement) {
          this.open = true;
        },
      });
      Object.defineProperty(HTMLDialogElement.prototype, "close", {
        configurable: true,
        value: function (this: HTMLDialogElement) {
          this.open = false;
        },
      });
    }
    const view = render(
      <Dialog label="패널" onClose={() => {}} backdropTone="subtle">
        <button>닫기</button>
      </Dialog>,
    );
    const panel = screen.getByRole("dialog");
    expect(panel.className).toContain("subtleContent");
    expect(panel.parentElement).toHaveAttribute(
      "data-native-dialog",
      String(native),
    );
    expect(panel.parentElement!.className).toContain("subtleBackdrop");
    view.rerender(
      <Dialog label="작업" onClose={() => {}}>
        <button>닫기</button>
      </Dialog>,
    );
    expect(panel.className).not.toContain("subtleContent");
    expect(panel.parentElement!.className).not.toContain("subtleBackdrop");
    view.unmount();
    if (native) {
      delete (HTMLDialogElement.prototype as any).showModal;
      delete (HTMLDialogElement.prototype as any).close;
    }
  },
);
