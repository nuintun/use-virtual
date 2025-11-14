/**
 * @module useLatestRef
 */

import { RefObject, useMemo, useRef } from 'react';

/**
 * @function useLatestRef
 * @description [hook] 生成自更新 useRef 对象
 * @param value 引用值
 */
export function useLatestRef<T>(value: T): RefObject<T>;
/**
 * @function useLatestRef
 * @description [hook] 生成自更新 useRef 对象
 * @param value 引用值
 */
export function useLatestRef<T>(value: T | null): RefObject<T | null>;
/**
 * @function useLatestRef
 * @description [hook] 生成自更新 useRef 对象
 * @param value 引用值
 */
export function useLatestRef<T>(value: T | undefined): RefObject<T | undefined>;
/**
 * @function useLatestRef
 * @description [hook] 生成自更新 useRef 对象
 * @param value 引用值
 */
export function useLatestRef<T>(value: T | null | undefined): RefObject<T | null | undefined> {
  const valueRef = useRef<T | null | undefined>(value);

  // https://github.com/alibaba/hooks/issues/728
  valueRef.current = useMemo(() => value, [value]);

  return valueRef;
}
