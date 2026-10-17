import Icon from "./Icon";
import styles from "./FieldError.module.scss";

/** Place after the input and reference id with aria-describedby. */
export default function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return <p id={id} className={styles.error} role="alert"><Icon name="warning"/><span>{message}</span></p>;
}
