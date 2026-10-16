import Icon from "./Icon";
import styles from "./Spinner.module.scss";
export default function Spinner() {
  return (
    <div className={styles.spinnerWrapper} role="status">
      <span className={styles.spinner}>
        <Icon name="reset" />
      </span>
      <span>불러오는 중…</span>
    </div>
  );
}
