import styles from './Thumbnail.module.scss';

function Thumbnail({ thumbnails, name }: { thumbnails: string[], name: string }) {
    const getImgs = (): string[] => {
        if (thumbnails.length === 0) return [];
        let arr: string[] = thumbnails;
        if (arr.length === 1) return arr;
        else if (arr.length === 2) arr = [arr[0], arr[0], arr[1], arr[1]];
        while (arr.length < 4) {
            arr = arr.concat(arr);
        }
        return arr.slice(0, 4);
    }
    thumbnails = getImgs();
    return <div title={name} className={styles["wrapper"]}>
        <img style={{ "width": "100%", "height": "100%" }} alt={""}
            src={"https://lh3.googleusercontent.com/wr28amLh-pMk4vmrYv_Orhly8DTtdvZJFuLwmXG5RNvZJjGlFe_WMnKp4pWlZI1gL7ihQn-xZuzZ0A6VZZbv2Z-iTEH3dpjn=s576"}>
        </img>
        {thumbnails.length ?
            <div className={styles["img-wrap"]}>{
                thumbnails.map((img: string, idx) =>
                    <img
                        className={styles["img"]} key={idx} src={img} alt={""}
                        style={thumbnails.length === 1 ? { "width": "100%", "height": "100%" } : {}}
                    ></img>)}
            </div> : ""
        }
    </div>
}

export default Thumbnail;