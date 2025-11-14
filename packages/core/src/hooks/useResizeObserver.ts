/**
 * @module useResizeObserver
 */

import { useCallback, useEffect, useMemo } from 'react';

export interface Unobserve {
  (): void;
}

export interface Observe {
  (
    // 监听目标
    target: Element | null,
    // 监听回调
    callback: ResizeObserverCallback,
    // 监听选项
    options?: ResizeObserverOptions
  ): Unobserve;
}

export interface ResizeObserverCallback {
  (entry: ResizeObserverEntry): void;
}

/**
 * @function useResizeObserver
 * @description [hook] 监听元素尺寸变化
 */
export function useResizeObserver(): Observe {
  const callbacks = useMemo(() => {
    return new Map<Element, ResizeObserverCallback>();
  }, []);

  const observer = useMemo(() => {
    return new ResizeObserver(entries => {
      for (const entry of entries) {
        const { target } = entry;
        const callback = callbacks.get(target);

        if (callback) {
          callback(entry);
        }
      }
    });
  }, []);

  const observe = useCallback<Observe>((target, callback, options) => {
    if (target != null) {
      callbacks.set(target, callback);

      observer.observe(target, options);
    }

    return () => {
      if (target != null) {
        callbacks.delete(target);

        observer.unobserve(target);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      callbacks.clear();

      observer.disconnect();
    };
  }, []);

  return observe;
}
