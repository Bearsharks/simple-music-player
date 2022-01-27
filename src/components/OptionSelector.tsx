
import { MusicInfo } from '../refs/constants';
import styles from './OptionSelector.module.scss';

export interface Options {
    icon: any;
    name: string;
    onClickHandler: (data: unknown) => void;
}
export interface OptionSelectorProps {
    options: Options[],
    data?: unknown
}
function OptionSelector(props: OptionSelectorProps) {

    return (
        <div className={styles['wrapper']}>
            {
                props.options.map((option) =>
                    <div key={option.name} onClick={() => option.onClickHandler(props.data)}>{option.icon}{option.name}</div>
                )
            }
        </div>
    );
}

export default OptionSelector;