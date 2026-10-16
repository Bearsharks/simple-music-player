import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { flushSync } from "react-dom";
import { Provider } from "jotai";
import Popup from "features/overlays/Popup";
import { useOpenMusicOptionsPopup } from "features/overlays/PopupStates";
const song = {
  videoID: "abcdefghijk",
  name: "이벤트 검증 곡",
  owner: "",
  query: "",
  thumbnail: "",
};
function Example() {
  const open = useOpenMusicOptionsPopup();
  return (
    <>
      <button
        onClick={(event) => flushSync(() => open(event.currentTarget, [song]))}
      >
        메뉴 열기
      </button>
      <button>외부 버튼</button>
      <Popup />
    </>
  );
}
it("keeps a popup open when the opening click bubbles after the popup mounts", () => {
  render(
    <Provider>
      <Example />
    </Provider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "메뉴 열기" }));
  expect(screen.getByRole("menu", { name: "선택 메뉴" })).toBeInTheDocument();
  expect(
    screen.getByRole("menuitem", { name: "다음 음악으로 재생" }),
  ).toHaveFocus();
});

it("ignores inside pointer gestures and dismisses on a later outside gesture", async () => {
  const user = userEvent.setup();
  render(
    <Provider>
      <Example />
    </Provider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "메뉴 열기" }));
  fireEvent.pointerDown(
    screen.getByRole("menuitem", { name: "다음 음악으로 재생" }),
  );
  expect(screen.getByRole("menu", { name: "선택 메뉴" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "외부 버튼" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("menu", { name: "선택 메뉴" }),
    ).not.toBeInTheDocument(),
  );
});
