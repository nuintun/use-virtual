/**
 * @module useInternal
 */

import { useRef } from 'react';
import { getKeys } from '/utils/keys';
import { Internal } from '/utils/interface';

/**
 * @function useInternal
 * @description [hook] 使用内部状态
 * @param horizontal 布局方向
 */
export function useInternal(horizontal?: boolean): Internal {
  const internalRef = useRef<Internal | null>(null);

  // 初始化内部状态
  if (internalRef.current == null) {
    internalRef.current = {
      anchorIndex: 0,
      mounted: false,
      scrollOffset: 0,
      items: new Map(),
      measurements: [],
      scrolling: false,
      scrollToRaf: null,
      remeasureIndex: -1,
      scrollingRaf: null,
      keys: getKeys(horizontal),
      viewport: { width: 0, height: 0 }
    };
  }

  return internalRef.current;
}
