/**
 * @module interface
 */

import { Size } from './size';
import { Item } from './state';
import { RefObject } from 'react';
import { onReachEnd, OnResize, OnScroll } from './events';
import { Scrolling, ScrollTo, ScrollToItem } from './scroll';

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

interface Controller {
  readonly scrollTo: ScrollTo;
  readonly scrollToItem: ScrollToItem;
}

export type Virtual<T extends HTMLElement, U extends HTMLElement> = readonly [
  viewportRef: RefObject<T | null>,
  listRef: RefObject<U | null>,
  items: readonly Item[],
  controller: Controller
];
