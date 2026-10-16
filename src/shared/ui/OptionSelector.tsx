import { useRef, useState } from "react";
import { DropdownMenuItem } from "./shadcn/dropdown-menu";
import ErrorToast from "./ErrorToast";
import styles from "./OptionSelector.module.scss";
export interface OptionInfo {
  icon: string;
  name: string;
  onClickHandler: () => void | Promise<void>;
}
/** Async actions deliberately retain the menu until their owner confirms success. */
export default function OptionSelector({ options }: { options: OptionInfo[] }) {
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const choose = async (option: OptionInfo) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await option.onClickHandler();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "작업하지 못했습니다. 다시 시도해 주세요.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return (
    <div className={styles.wrapper} aria-busy={busy}>
      {options.map((option) => (
        <DropdownMenuItem
          key={option.name}
          disabled={busy}
          variant={option.name.includes("삭제") ? "destructive" : "default"}
          onSelect={(event) => {
            event.preventDefault();
            void choose(option);
          }}
        >
          <span className="material-icons" aria-hidden="true">
            {option.icon}
          </span>
          <span>{option.name}</span>
        </DropdownMenuItem>
      ))}
      <ErrorToast message={error} />
    </div>
  );
}
