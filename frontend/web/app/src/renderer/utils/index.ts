export const defaultMapSize = (
  tileWidth: number = 1,
  tileHeight: number = 1,
): {
  width: number, height: number
}  => {
  const rows = 20;
  const columns = 40;

  return {
    width: columns * tileWidth,
    height: rows * tileHeight,
  }
}
