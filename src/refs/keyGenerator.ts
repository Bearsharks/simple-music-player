

export default function keyGenerator(cnt: number): string | string[] {
    let curcnt = 0;
    if (cnt) {
        let cur = Date.now();
        return new Array(cnt).fill(null).map((el, index) => cur + "_" + curcnt++);
    }
    return Date.now() + "_" + curcnt++;
}