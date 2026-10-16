import { useRef, useState } from 'react';
import styles from './OptionSelector.module.scss';
export interface OptionInfo {
  icon: string;
  name: string;
  onClickHandler: () => void | Promise<void>;
}
export default function OptionSelector({ options }: { options: OptionInfo[] }) {
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const choose = async (option: OptionInfo) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try { await option.onClickHandler(); }
    catch (error) { setError(error instanceof Error ? error.message : '작업하지 못했습니다. 다시 시도해 주세요.'); }
    finally { pending.current = false; setBusy(false); }
  };
  return <div className={styles.wrapper} role="group" aria-label="선택 메뉴" aria-busy={busy}>
    {options.map(option => <button type="button" className={styles.options} key={option.name}
      disabled={busy} onClick={() => choose(option)}>
      <span className={styles.options__icon} aria-hidden="true"><span className="material-icons">{option.icon}</span></span>
      <span className={styles.options__text}>{option.name}</span>
    </button>)}
    {error && <p role="alert">{error}</p>}
  </div>;
}
