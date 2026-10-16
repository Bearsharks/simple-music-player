interface Bounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}
/** Place a menu inside its viewport/native dialog, keeping its bottom actions usable. */
export function positionPopup(
  anchor: Pick<Bounds, "left" | "top" | "bottom">,
  size: { width: number; height: number },
  bounds: Bounds,
) {
  const edge = 8;
  const gap = 4;
  const minX = bounds.left + edge;
  const maxX = Math.max(minX, bounds.right - edge - size.width);
  const minY = bounds.top + edge;
  const maxY = Math.max(minY, bounds.bottom - edge - size.height);
  const below = anchor.bottom + gap;
  const above = anchor.top - gap - size.height;
  return {
    left: Math.max(minX, Math.min(anchor.left, maxX)),
    top:
      below <= maxY
        ? Math.max(minY, below)
        : above >= minY
          ? Math.min(maxY, above)
          : maxY,
  };
}
