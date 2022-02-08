
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
        <div>
            {
                options.map((option) =>
                    <div
                        key={option.name}
                        onClick={option.onClickHandler}
                    >
                        {option.icon}{option.name}
                    </div>
                )
            }
        </div>
    );
}

export default OptionSelector;