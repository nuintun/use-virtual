/**
 * @module interface
 */

import { Size } from './size';
import { Item } from './state';
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
  readonly viewport: () => Element | null;
}

export type Virtual = readonly [
  size: number,
  items: readonly Item[],
  controller: {
    readonly scrollTo: ScrollTo;
    readonly scrollToItem: ScrollToItem;
  }
];
