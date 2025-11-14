/**
 * @module measurement
 */

export interface Measurement {
  readonly end: number;
  readonly size: number;
  readonly start: number;
}

/**
 * @function setMeasurementAt
 * @param measurements 已缓存测量数组
 * @param index 索引
 * @param size 列表项目尺寸
 */
export function setMeasurementAt(measurements: Measurement[], index: number, size: number): void {
  const start = measurements[index - 1]?.end || 0;

  measurements[index] = { start, size, end: start + size };
}
