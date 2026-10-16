import { MouseEventHandler } from "react";
import styles from "shared/ui/MoreVert.module.scss";
function MoreVert({
  onClick,
  size = 28,
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
      className={styles["more-vert"]}
    >
      <div>
        <span
          className="material-icons"
          aria-hidden="true"
          style={{
            fontSize: `${size}px`,
          }}
        >
          more_vert
        </span>
      </div>
    </button>
  );
}

export default MoreVert;
