import { positionPopup } from "features/overlays/positionPopup";

it("flips the desktop queue's last-row menu above its trigger and dock", () => {
  const result = positionPopup(
    { left: 1376, top: 656, bottom: 700 },
    { width: 240, height: 206 },
    { left: 1120, top: 0, right: 1440, bottom: 872 },
  );
  expect(result).toEqual({ left: 1192, top: 446 });
  expect(result.top + 206).toBeLessThanOrEqual(872 - 8);
  expect(result.left + 240).toBeLessThanOrEqual(1440 - 8);
});

it("prefers below when the entire menu fits the sheet", () => {
  expect(
    positionPopup(
      { left: 330, top: 100, bottom: 144 },
      { width: 240, height: 206 },
      { left: 0, top: 0, right: 390, bottom: 844 },
    ),
  ).toEqual({ left: 142, top: 148 });
});

it("clamps a tall menu into the container when neither side of the trigger fits", () => {
  expect(
    positionPopup(
      { left: 5, top: 250, bottom: 294 },
      { width: 240, height: 350 },
      { left: 0, top: 64, right: 390, bottom: 500 },
    ),
  ).toEqual({ left: 8, top: 142 });
});
