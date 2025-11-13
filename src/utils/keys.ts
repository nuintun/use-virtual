/**
 * @module keys
 */

export interface Horizontal {
  readonly size: 'width';
  readonly scrollTo: 'left';
  readonly scrollSize: 'scrollWidth';
  readonly scrollOffset: 'scrollLeft';
}

export interface Vertical {
  readonly size: 'height';
  readonly scrollTo: 'top';
  readonly scrollOffset: 'scrollTop';
  readonly scrollSize: 'scrollHeight';
}

// 垂直滚动属性映射表
export const VERTICAL_KEYS: Vertical = {
  size: 'height',
  scrollTo: 'top',
  scrollOffset: 'scrollTop',
  scrollSize: 'scrollHeight'
};

// 水平滚动属性映射表
export const HORIZONTAL_KEYS: Horizontal = {
  size: 'width',
  scrollTo: 'left',
  scrollSize: 'scrollWidth',
  scrollOffset: 'scrollLeft'
};
