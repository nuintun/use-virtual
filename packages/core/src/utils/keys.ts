/**
 * @module keys
 */

export interface VerticalKeys {
  readonly size: 'height';
  readonly scrollTo: 'top';
  readonly scrollOffset: 'scrollTop';
}

export interface HorizontalKeys {
  readonly size: 'width';
  readonly scrollTo: 'left';
  readonly scrollOffset: 'scrollLeft';
}

// 垂直滚动属性映射表
const VERTICAL_KEYS: VerticalKeys = {
  size: 'height',
  scrollTo: 'top',
  scrollOffset: 'scrollTop'
};

// 水平滚动属性映射表
const HORIZONTAL_KEYS: HorizontalKeys = {
  size: 'width',
  scrollTo: 'left',
  scrollOffset: 'scrollLeft'
};

export function getKeys(horizontal?: boolean): HorizontalKeys | VerticalKeys {
  return horizontal ? HORIZONTAL_KEYS : VERTICAL_KEYS;
}
