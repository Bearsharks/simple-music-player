import styles from './Thumbnail.module.scss';

function Thumbnail({ thumbnails, name }: { thumbnails: string[], name: string }) {
    const getImgs = (): string[] => {
        let arr: string[] = thumbnails;
        if (arr.length === 0) return ["https://lh3.googleusercontent.com/wr28amLh-pMk4vmrYv_Orhly8DTtdvZJFuLwmXG5RNvZJjGlFe_WMnKp4pWlZI1gL7ihQn-xZuzZ0A6VZZbv2Z-iTEH3dpjn=s576"];
        else if (arr.length === 1) return arr;
        else if (arr.length === 2) arr = [arr[0], arr[0], arr[1], arr[1]];
        while (arr.length < 4) {
            arr = arr.concat(arr);
        }
        return arr.slice(0, 4);
    }
    thumbnails = getImgs();
    return <div title={name} className={styles["wrapper"]}>
        {thumbnails.length === 1 ?
            <img src={thumbnails[0]} alt={""} style={{ "width": "100%", "height": "100%" }}></img> :
            thumbnails.map((img: string, idx) => <div key={idx}
                style={{ 'background': `url(${img}) -25px -10px` }}
            ></div>)}
    </div>
}

export default Thumbnail;