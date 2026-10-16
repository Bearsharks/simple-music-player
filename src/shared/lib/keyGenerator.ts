

export default function keyGenerator(cnt?: number): string[] {
    let curcnt = 0;
    if (!cnt) cnt = 1;
    let cur = Date.now();
    return new Array(cnt).fill(null).map((el, index) => cur + "_" + curcnt++);
}