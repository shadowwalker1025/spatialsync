export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function round(val: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

export function roundVector(vec: [number, number, number], decimals = 2): [number, number, number] {
  return [round(vec[0], decimals), round(vec[1], decimals), round(vec[2], decimals)];
}

export function snapValue(val: number, step: number): number {
  if (step <= 0) return val;
  return Math.round(val / step) * step;
}
