/**
 * @module keys
 */

export interface Keys {
  readonly scrollTo: 'left' | 'top';
  readonly size: 'width' | 'height';
  readonly scrollOffset: 'scrollLeft' | 'scrollTop';
}

// 垂直滚动属性映射表
const VERTICAL_KEYS: Keys = {
  size: 'height',
  scrollTo: 'top',
  scrollOffset: 'scrollTop'
};

// 水平滚动属性映射表
const HORIZONTAL_KEYS: Keys = {
  size: 'width',
  scrollTo: 'left',

  scrollOffset: 'scrollLeft'
};

export function getKeys(horizontal?: boolean): Keys {
  return horizontal ? HORIZONTAL_KEYS : VERTICAL_KEYS;
}
