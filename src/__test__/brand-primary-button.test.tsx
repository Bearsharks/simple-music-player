import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BrandPrimaryButton from "shared/ui/BrandPrimaryButton";
import { Button } from "shared/ui/shadcn/button";

it("preserves native Button ref, disabled and keyboard behavior without branding ordinary actions", async () => {
  const ref = createRef<HTMLButtonElement>();
  const click = vi.fn();
  const view = render(
    <>
      <BrandPrimaryButton ref={ref} onClick={click}>
        새 재생목록
      </BrandPrimaryButton>
      <Button>저장</Button>
    </>,
  );
  const brand = screen.getByRole("button", { name: "새 재생목록" });
  expect(ref.current).toBe(brand);
  expect(brand).toHaveClass("brand-primary-button", "loopy-control");
  expect(screen.getByRole("button", { name: "저장" })).not.toHaveClass(
    "brand-primary-button",
  );
  const user = userEvent.setup();
  await user.tab();
  expect(brand).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(click).toHaveBeenCalledOnce();
  view.rerender(
    <BrandPrimaryButton disabled onClick={click}>
      새 재생목록
    </BrandPrimaryButton>,
  );
  await user.click(screen.getByRole("button", { name: "새 재생목록" }));
  expect(click).toHaveBeenCalledOnce();
});
it("passes asChild semantics to the adopted Button without creating another DOM wrapper", () => {
  render(
    <BrandPrimaryButton asChild>
      <a href="/library">라이브러리</a>
    </BrandPrimaryButton>,
  );
  const link = screen.getByRole("link", { name: "라이브러리" });
  expect(link).toHaveAttribute("href", "/library");
  expect(link).toHaveClass("brand-primary-button");
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
