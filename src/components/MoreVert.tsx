import { MouseEventHandler } from "react";
import styles from './MoreVert.module.scss';
function MoreVert({ onClick, size = 28 }: { onClick: MouseEventHandler<HTMLElement>, size?: number }) {
    return <div onClick={onClick} className={styles['more-vert']}
    >
        <div>
            <span className="material-icons" style={{
                'fontSize': `${size}px`
            }}
            >
                more_vert
            </span>
        </div>

    </div>
}

export default MoreVert;