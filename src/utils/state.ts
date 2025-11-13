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
  readonly size: number;
  readonly items: readonly Item[];
}

/**
 * @function getInitialState
 * @description 获取初始化状态数据
 */
export function getInitialState(): State {
  const items: Item[] = [];

  return { size: 0, items: __DEV__ ? Object.freeze(items) : items };
}
