import styles from "shared/ui/Thumbnail.module.scss";

function Thumbnail({
  thumbnails = [],
  name,
}: {
  thumbnails: string[];
  name: string;
}) {
  const imgs = ((): string[] => {
    if (thumbnails.length === 0) return [];
    let arr: string[] = thumbnails;
    if (arr.length === 1) return arr;
    else if (arr.length === 2) arr = [arr[0], arr[0], arr[1], arr[1]];
    while (arr.length < 4) {
      arr = arr.concat(arr);
    }
    return arr.slice(0, 4);
  })();
  return (
    <div title={name} className={styles["wrapper"]}>
      <div className={styles["fallback"]} aria-hidden="true">
        {name.slice(0, 2)}
        <small>PERSONAL MIX</small>
      </div>
      {imgs.length ? (
        <div className={styles["img-wrap"]}>
          {imgs.map((img: string, idx) => (
            <img
              className={styles["img"]}
              key={img + idx}
              onError={(e) => {
                e.currentTarget.style.visibility = "hidden";
              }}
              src={img}
              alt={""}
              style={imgs.length === 1 ? { width: "100%", height: "100%" } : {}}
            ></img>
          ))}
        </div>
      ) : (
        ""
      )}
    </div>
  );
}

export default Thumbnail;
