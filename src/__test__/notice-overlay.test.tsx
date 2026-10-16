import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "jotai";
import { useState } from "react";
import { vi } from "vitest";
import Dialog from "shared/ui/Dialog";
import Notice, { useNotice } from "features/overlays/Notice";

function Example({ undo }: { undo: () => Promise<void> }) {
  const notice = useNotice();
  const [open, setOpen] = useState(false);
  const [child, setChild] = useState(false);
  const [narrow, setNarrow] = useState(true);
  return (
    <>
      <button
        onClick={() =>
          notice("곡을 삭제했습니다.", { label: "실행 취소", run: undo })
        }
      >
        삭제 알림
      </button>
      <button onClick={() => setOpen(true)}>큐 열기</button>
      <Dialog
        label="큐"
        open={open}
        modal={narrow}
        priority={0}
        onClose={() => setOpen(false)}
      >
        <button onClick={() => setChild(true)}>작업 열기</button>
        <button onClick={() => setOpen(false)}>큐 닫기</button>
      </Dialog>
      {child && (
        <Dialog label="저장 작업" onClose={() => setChild(false)}>
          <input aria-label="제목" />
          <button onClick={() => setNarrow((value) => !value)}>폭 전환</button>
          <button onClick={() => setChild(false)}>작업 닫기</button>
        </Dialog>
      )}
      <Notice />
    </>
  );
}

it("moves one pending Undo into the active modal flow through nesting and responsive changes", async () => {
  const user = userEvent.setup();
  const undo = vi.fn(async () => {});
  render(
    <Provider>
      <Example undo={undo} />
    </Provider>,
  );
  await user.click(screen.getByRole("button", { name: "삭제 알림" }));
  const button = screen.getByRole("button", { name: "실행 취소" });
  const layer = button.closest("[data-overlay-scope]");
  expect(layer).toHaveAttribute("data-overlay-scope", "page");
  await user.click(screen.getByRole("button", { name: "큐 열기" }));
  await waitFor(() =>
    expect(screen.getByRole("dialog", { name: "큐" })).toContainElement(button),
  );
  expect(layer).toHaveAttribute("data-overlay-scope", "modal");
  await user.click(screen.getByRole("button", { name: "작업 열기" }));
  const task = screen.getByRole("dialog", { name: "저장 작업" });
  await waitFor(() => expect(task).toContainElement(button));
  for (let i = 0; i < 2; i++) {
    await user.click(screen.getByRole("button", { name: "폭 전환" }));
    await waitFor(() => expect(task).toContainElement(button));
    expect(button.closest("[inert]")).toBeNull();
  }
  // The same Undo is in the dialog's Tab order, after its form controls.
  const closeTask = within(task).getByRole("button", { name: "작업 닫기" });
  closeTask.focus();
  await user.tab();
  expect(button).toHaveFocus();
  await user.tab({ shift: true });
  expect(closeTask).toHaveFocus();
  await user.click(closeTask);
  await waitFor(() =>
    expect(screen.getByRole("dialog", { name: "큐" })).toContainElement(button),
  );
  expect(screen.getByRole("button", { name: "실행 취소" })).toBe(button);
  await user.click(screen.getByRole("button", { name: "큐 닫기" }));
  await waitFor(() =>
    expect(layer).toHaveAttribute("data-overlay-scope", "page"),
  );
  expect(button.closest("[inert]")).toBeNull();
  await user.click(button);
  expect(undo).toHaveBeenCalledOnce();
});

it("does not resurrect consumed or dismissed Undo when a modal is opened or closed", async () => {
  const user = userEvent.setup();
  const undo = vi.fn(async () => {});
  render(
    <Provider>
      <Example undo={undo} />
    </Provider>,
  );
  for (const dismiss of ["실행 취소", "알림 닫기"]) {
    await user.click(screen.getByRole("button", { name: "삭제 알림" }));
    await user.click(screen.getByRole("button", { name: dismiss }));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "실행 취소" }),
      ).not.toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "큐 열기" }));
    await user.click(screen.getByRole("button", { name: "작업 열기" }));
    expect(
      screen.queryByRole("button", { name: "실행 취소" }),
    ).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("button", { name: "실행 취소" }),
    ).not.toBeInTheDocument();
  }
  expect(undo).toHaveBeenCalledOnce();
});

it("preserves Undo busy and retry errors when its modal changes scope", async () => {
  const user = userEvent.setup();
  let reject!: (error: Error) => void;
  const undo = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<void>((_yes, no) => {
          reject = no;
        }),
    )
    .mockResolvedValueOnce(undefined);
  render(
    <Provider>
      <Example undo={undo} />
    </Provider>,
  );
  await user.click(screen.getByRole("button", { name: "삭제 알림" }));
  await user.click(screen.getByRole("button", { name: "실행 취소" }));
  await user.click(screen.getByRole("button", { name: "큐 열기" }));
  await waitFor(() =>
    expect(screen.getByRole("dialog", { name: "큐" })).toContainElement(
      screen.getByRole("button", { name: "복원 중…" }),
    ),
  );
  expect(screen.getByRole("button", { name: "복원 중…" })).toBeDisabled();
  await act(async () => reject(new Error("복원 저장 실패")));
  await user.click(screen.getByRole("button", { name: "작업 열기" }));
  await waitFor(() =>
    expect(screen.getByRole("dialog", { name: "저장 작업" })).toContainElement(
      screen.getByRole("alert"),
    ),
  );
  expect(screen.getByRole("alert")).toHaveTextContent("복원 저장 실패");
  const button = screen.getByRole("button", { name: "실행 취소" });
  button.focus();
  await user.keyboard("{Enter}");
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "실행 취소" }),
    ).not.toBeInTheDocument(),
  );
  expect(undo).toHaveBeenCalledTimes(2);
});
