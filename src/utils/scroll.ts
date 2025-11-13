/**
 * @module scroll
 */

import { Align } from './align';
import { isNumber } from './typeof';
import { Duration, easeInOutSine, Easing, easingDuration } from './easing';

export interface Scrolling {
  readonly easing?: Easing;
  readonly duration?: number | Duration;
}

export interface ScrollToOptions {
  readonly offset: number;
  readonly smooth?: boolean;
}

export interface ScrollTo {
  (offset: number, callback?: () => void): void;
  (options: ScrollToOptions, callback?: () => void): void;
}

export interface ScrollToItemOptions {
  readonly index: number;
  readonly smooth?: boolean;
  readonly align?: `${Align}`;
}

export interface ScrollToItem {
  (index: number, callback?: () => void): void;
  (options: ScrollToItemOptions, callback?: () => void): void;
}

/**
 * @function getScrollingOptions
 * @description 获取滚动参数配置
 * @param scrolling 原始滚动配置
 */
export function getScrollingOptions(scrolling?: Scrolling): Required<Scrolling> {
  const { easing, duration } = scrolling || {};

  return {
    easing: easing || easeInOutSine,
    duration: duration || easingDuration
  };
}

/**
 * @function getScrollToOptions
 * @description 获取 scrollTo 方法参数
 * @param value 原始参数
 */
export function getScrollToOptions(value: number | ScrollToOptions): ScrollToOptions {
  return isNumber(value) ? { offset: value } : value;
}

/**
 * @function getScrollToItemOptions
 * @description 获取 scrollToItem 方法参数
 * @param value 原始参数
 */
export function getScrollToItemOptions(value: number | ScrollToItemOptions): ScrollToItemOptions {
  return isNumber(value) ? { index: value } : value;
}
