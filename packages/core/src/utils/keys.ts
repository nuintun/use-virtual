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

/**
 * @function getKeys
 * @description 根据滚动方向获取对应的属性映射对象
 * @param horizontal 是否为水平滚动模式，默认为 false（垂直滚动）
 */
export function getKeys(horizontal?: boolean): HorizontalKeys | VerticalKeys {
  return horizontal ? HORIZONTAL_KEYS : VERTICAL_KEYS;
}
