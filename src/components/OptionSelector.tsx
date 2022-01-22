
import styles from './OptionSelector.module.scss';

export interface Options {
    icon: any;
    name: string;
    onClick: () => void;
}
interface OptionSelectorProps {
    options: Options[]
}
function OptionSelector(props: OptionSelectorProps) {
    return (
        <div className={styles['wrapper']}>
            {
                props.options.map((option) =>
                    <div key={option.name} onClick={option.onClick}>{option.icon}{option.name}</div>
                )
            }
        </div>
    );
}

export default OptionSelector;