/**
 * @module interface
 */

import { Align } from './align';
import { RefObject } from 'react';

export interface Rect {
  readonly width: number;
  readonly height: number;
}

export interface Measure {
  readonly end: number;
  readonly size: number;
  readonly start: number;
}

export interface Unobserve {
  (): void;
}

export interface Observe {
  (element: HTMLElement): Unobserve;
}

export interface Item {
  readonly end: number;
  readonly size: number;
  readonly index: number;
  readonly start: number;
  readonly observe: Observe;
}

export type VirtualRange = readonly [
  // Start index.
  start: number,
  // End index.
  end: number
];

export interface ResizeEvent {
  readonly width: number;
  readonly height: number;
  readonly items: VirtualRange;
  readonly visible: VirtualRange;
}

export interface OnResize {
  (event: ResizeEvent): void;
}

export interface ScrollEvent {
  readonly delta: number;
  readonly offset: number;
  readonly items: VirtualRange;
  readonly visible: VirtualRange;
}

export interface OnScroll {
  (event: ScrollEvent): void;
}

export interface ReachEndEvent {
  readonly index: number;
  readonly offset: number;
  readonly items: VirtualRange;
  readonly visible: VirtualRange;
}

export interface onReachEnd {
  (event: ReachEndEvent): void;
}

export interface Easing {
  (time: number): number;
}

export interface Duration {
  (distance: number): number;
}

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

export interface State {
  readonly items: readonly Item[];
  readonly list: readonly [offset: number, size: number];
}

export interface Size {
  (index: number, viewport: Rect): number;
}

export interface Options {
  readonly count: number;
  readonly overscan?: number;
  readonly onResize?: OnResize;
  readonly onScroll?: OnScroll;
  readonly scrollbar?: boolean;
  readonly size: number | Size;
  readonly horizontal?: boolean;
  readonly scrolling?: Scrolling;
  readonly onReachEnd?: onReachEnd;
}

export interface Api {
  readonly scrollTo: ScrollTo;
  readonly scrollToItem: ScrollToItem;
}

export type Virtual<T extends HTMLElement, U extends HTMLElement> = readonly [
  viewportRef: RefObject<T | null>,
  listRef: RefObject<U | null>,
  items: readonly Item[],
  api: Api
];
