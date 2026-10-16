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
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="icon-button"
    >
      <Icon name="more" />
    </button>
  );
}
