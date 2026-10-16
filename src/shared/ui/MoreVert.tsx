import { MouseEventHandler } from "react";
import styles from "shared/ui/MoreVert.module.scss";
function MoreVert({
  onClick,
  size = 28,
}: {
  onClick: MouseEventHandler<HTMLElement>;
  size?: number;
}) {
  return (
    <button
      type="button"
      aria-label="더보기"
      onClick={onClick}
      className={styles["more-vert"]}
    >
      <div>
        <span
          className="material-icons"
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
