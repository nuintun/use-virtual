/**
 * @module offset
 */

import { Measurement } from './measurement';

/**
 * @function clampOffset
 * @description 限制滚动偏移
 * @param measurements 已缓存测量数组
 * @param viewport 视窗大小
 * @param offset 视窗滚动偏移
 */
export function clampOffset(measurements: Measurement[], viewport: number, offset: number): number {
  const scrollSize = measurements[measurements.length - 1]?.end;

  return Math.min(offset, scrollSize != null ? scrollSize - viewport : 0);
}
