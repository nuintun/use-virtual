/**
 * @module equal
 */

import { Rect } from './rect';
import { Item, State } from './state';

type PureItem = Omit<Item, 'ref'>;

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
  if (next.size !== prev.size) {
    return false;
  }

  const { items: nextItems } = next;
  const { items: prevItems } = prev;
  const { length } = nextItems;

  if (length !== prevItems.length) {
    return false;
  }

  for (let index = 0; index < length; index++) {
    if (!isEqualItem(nextItems[index], prevItems[index])) {
      return false;
    }
  }

  return true;
}

export function isEqualRect(next: Rect, prev: Rect): boolean {
  return (
    // 校验宽度
    next.width === prev.width &&
    // 校验高度
    next.height === prev.height
  );
}
