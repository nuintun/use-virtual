/**
 * @module easing
 */

import { isFunction } from './typeof';

export interface Easing {
  (time: number): number;
}

export interface Duration {
  (distance: number): number;
}

/**
 * @function easeInOutSine
 * @description easeInOutSine
 * @param time 当前动画时间，0-1 之间
 */
export function easeInOutSine(time: number): number {
  return (1 - Math.cos(Math.PI * time)) / 2;
}

/**
 * @function easingDuration
 * @description 缓动动画持续时间
 * @param distance 缓动动画移动总距离
 */
export function easingDuration(distance: number): number {
  return Math.min(500, Math.max(100, distance * 0.075));
}

/**
 * @function getDuration
 * @description 获取滚动时长
 * @param duration 原始滚动时长参数
 * @param distance 滚动距离
 */
export function getDuration(duration: number | Duration, distance: number): number {
  return isFunction(duration) ? duration(Math.abs(distance)) : duration;
}
