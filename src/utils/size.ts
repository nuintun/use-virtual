/**
 * @module size
 */

import { Rect } from './rect';
import { isFunction } from './typeof';
import { Measurement } from './measurement';

export interface Size {
  (index: number, viewport: Rect): number;
}

/**
 * @function getSize
 * @param index 索引
 * @param size 列表项目尺寸
 * @param measurements 已缓存测量数组
 * @param viewport 视窗尺寸
 */
export function getSize(index: number, size: number | Size, measurements: Measurement[], viewport: Rect): number {
  const isFunctionSize = isFunction(size);
  const measurement: Measurement | undefined = measurements[index];
  const nextSize = measurement?.size || (isFunctionSize ? size(index, viewport) : size);

  if (__DEV__) {
    if (nextSize === 0) {
      if (isFunctionSize) {
        throw new RangeError('options.size return value must be greater than 0');
      } else {
        throw new RangeError('options.size must be greater than 0');
      }
    }
  }

  return nextSize;
}
