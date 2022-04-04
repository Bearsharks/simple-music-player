
import styles from './OptionSelector.module.scss';


export interface OptionInfo {
    icon: any;
    name: string;
    onClickHandler: () => void;
}
interface OptionSelectorProps {
    options: OptionInfo[],
}
function OptionSelector({ options }: OptionSelectorProps) {
    return (
        <div className={styles["wrapper"]}>{
            options.map((option) =>
                <div
                    className={styles["options"]}
                    key={option.name}
                    onClick={option.onClickHandler}
                >
                    <div className={styles["options__icon"]} >
                        <span className={"material-icons"}>
                            {option.icon}
                        </span>
                    </div>
                    <div className={styles["options__text"]} >
                        {option.name}
                    </div>

                </div>)
        }
        </div>
    );
}

export default OptionSelector;