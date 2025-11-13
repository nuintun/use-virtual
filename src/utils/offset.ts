/**
 * @module offset
 */

import { Measurement } from './measurement';

/**
 * @function getScrollOffset
 * @description 标准化滚动偏移
 * @param measurements 已缓存测量数组
 * @param viewport 视窗大小
 * @param offset 视窗滚动偏移
 */
export function getScrollOffset(measurements: Measurement[], viewport: number, offset: number): number {
  const scrollSize = measurements[measurements.length - 1]?.end;

  return Math.min(offset, scrollSize ? scrollSize - viewport : 0);
}
