/**
 * @module state
 */

interface RefCallback<T> {
  (element: T | null): () => void;
}

export interface Item {
  readonly end: number;
  readonly size: number;
  readonly index: number;
  readonly start: number;
  readonly ref: RefCallback<Element>;
}

export interface State {
  readonly items: readonly Item[];
  readonly list: readonly [offset: number, size: number];
}

/**
 * @function getInitialState
 * @description 获取初始化状态数据
 */
export function getInitialState(): State {
  const items: Item[] = [];

  return { items: __DEV__ ? Object.freeze(items) : items, list: [0, -1] };
}
