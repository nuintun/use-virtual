/**
 * @module search
 */

import { Measurement } from './measurement';

export type Range = readonly [start: number, end: number];

/**
 * @function binarySearch
 * @description 二分法查找第一个可见元素索引
 * @param measurements 已缓存测量数组
 * @param offset 视窗滚动偏移
 * @param start 开始索引
 * @param end 结束索引
 */
function binarySearch(measurements: Measurement[], offset: number, start: number, end: number): number {
  while (start < end) {
    const middle = ((start + end) / 2) | 0;
    const measurement = measurements[middle];

    if (measurement.end <= offset) {
      start = middle + 1;
    } else if (measurement.start > offset) {
      end = middle - 1;
    } else {
      return middle;
    }
  }

  return start;
}

/**
 * @function getVirtualRange
 * @description 计算虚拟列表中可见元素的索引范围
 * @param measurements 已缓存测量数组
 * @param viewport 视窗尺寸
 * @param offset 视窗滚动偏移
 * @param anchor 锚点索引
 */
export function getVirtualRange(measurements: Measurement[], viewport: number, offset: number, anchor: number): Range | void {
  const { length } = measurements;

  if (viewport > 0 && length > 0) {
    const maxIndex = length - 1;
    const offsetEnd = offset + viewport;
    const { start: anchorOffset } = measurements[anchor];

    let start = anchor;

    if (anchorOffset > offset) {
      start = binarySearch(measurements, offset, 0, anchor);
    } else if (anchorOffset < offset) {
      start = binarySearch(measurements, offset, anchor, maxIndex);
    }

    let end = start;

    while (end < maxIndex) {
      const measurement = measurements[end];

      if (measurement.start < offsetEnd && measurement.end >= offsetEnd) {
        return [start, end];
      } else {
        end++;
      }
    }

    return [start, end];
  }
}
