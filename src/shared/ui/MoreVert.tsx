import { Button } from "shared/ui/shadcn/button";
import type { MouseEventHandler } from "react";
import Icon from "./Icon";
export default function MoreVert({
  onClick,
  label = "더보기",
}: {
  onClick: MouseEventHandler<HTMLElement>;
  size?: number;
  label?: string;
}) {
  return (
    <Button variant="ghost"
      type="button"
      aria-label={label}
      aria-haspopup="menu"
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
      className="icon-button"
    >
      <Icon name="more" />
    </Button>
  );
}
