/**
 * @module equal
 */

import { Rect } from './rect';
import { Item, State } from './state';

type PureItem = Omit<Item, 'ref'>;

/**
 * @function isEqualItem
 * @description 对比两个 PureItem 对象是否相等
 * @param next 新的 PureItem 对象
 * @param prev 旧的 PureItem 对象
 */
export function isEqualItem(next: PureItem, prev: PureItem): boolean {
  return (
    // 校验结束位置
    next.end === prev.end &&
    // 校验尺寸
    next.size === prev.size &&
    // 校验开始位置
    next.start === prev.start &&
    // 校验索引
    next.index === prev.index
  );
}

/**
 * @function isEqualState
 * @description 对比两个状态是否相等
 * @param next 新状态
 * @param prev 旧状态
 */
export function isEqualState(next: State, prev: State): boolean {
  // 首先比较 size 属性，如果不相等直接返回 false
  if (next.size !== prev.size) {
    return false;
  }

  // 解构获取 items 数组
  const { items: nextItems } = next;
  const { items: prevItems } = prev;
  const { length } = nextItems;

  // 比较数组长度，如果不相等直接返回 false
  if (length !== prevItems.length) {
    return false;
  }

  // 逐个比较 items 数组中的每个元素
  for (let index = 0; index < length; index++) {
    // 使用 isEqualItem 比较每个 item
    if (!isEqualItem(nextItems[index], prevItems[index])) {
      return false;
    }
  }

  // 所有比较都通过，返回 true
  return true;
}

/**
 * @function isEqualRect
 * @description 对比两个 Rect 对象是否相等
 * @param next 新的 Rect 对象
 * @param prev 旧的 Rect 对象
 */
export function isEqualRect(next: Rect, prev: Rect): boolean {
  return (
    // 校验宽度
    next.width === prev.width &&
    // 校验高度
    next.height === prev.height
  );
}
