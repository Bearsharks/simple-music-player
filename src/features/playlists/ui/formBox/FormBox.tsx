import ErrorToast from "shared/ui/ErrorToast";
import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import styles from "./FormBox.module.scss";
export interface FormItem {
  id: string;
  name: string;
  readonly?: boolean;
  value?: string;
  require?: boolean;
}
export interface FormBoxProps {
  formItems: FormItem[];
  name: string;
  closePopup: () => void;
  submit: (data: Record<string, string>) => void | Promise<void>;
  submitLabel?: string;
  children?: ReactNode;
}
export default function FormBox({
  formItems,
  closePopup,
  submit,
  submitLabel = "저장",
  name,
  children,
}: FormBoxProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const prefix = useId();
  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending.current) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const data: Record<string, string> = {};
    for (const item of formItems) {
      data[item.id] = String(values.get(item.id) ?? "").trim();
      if (item.require && !data[item.id]) {
        setError(`${item.name}을 입력해 주세요.`);
        (form.elements.namedItem(item.id) as HTMLInputElement)?.focus();
        return;
      }
    }
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await submit(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "저장하지 못했습니다. 다시 시도해 주세요.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return (
    <form onSubmit={onSubmit} className={styles.wrapper} aria-busy={busy}>
      <h2>{name}</h2>
      <fieldset disabled={busy} className={styles.fields}>
        {formItems.map((item) => (
          <div
            key={item.id}
            className={`${styles["formbox-item"]} ${item.readonly ? styles["formbox-item--readonly"] : ""}`}
          >
            <div className={styles["formbox-item__label"]}>
              <label htmlFor={`${prefix}-${item.id}`}>{item.name}</label>
            </div>
            <input
              className={styles.formbox__input}
              id={`${prefix}-${item.id}`}
              name={item.id}
              {...(item.readonly
                ? { value: item.value ?? "" }
                : { defaultValue: item.value })}
              readOnly={item.readonly}
              required={item.require}
            />
          </div>
        ))}
        {children && <div>{children}</div>}
        <ErrorToast message={error} />
        <div className={styles["formbox-actions"]}>
          <button
            type="button"
            className={styles["formbox-actions__button"]}
            onClick={closePopup}
          >
            취소
          </button>
          <button
            type="submit"
            className={`${styles["formbox-actions__button--white"]} ${styles["formbox-actions__button"]}`}
          >
            {busy ? "저장 중…" : submitLabel}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
