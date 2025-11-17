/**
 * @module interface
 */

import { Rect } from './rect';
import { Size } from './size';
import { Item } from './state';
import { Measurement } from './measurement';
import { HorizontalKeys, VerticalKeys } from './keys';
import { onReachEnd, OnResize, OnScroll } from './events';
import { Scrolling, ScrollTo, ScrollToItem } from './scroll';

type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

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

export interface Internal {
  mounted: boolean;
  scrolling: boolean;
  anchorIndex: number;
  scrollOffset: number;
  remeasureIndex: number;
  viewport: Mutable<Rect>;
  items: Map<number, Item>;
  measurements: Measurement[];
  keys: HorizontalKeys | VerticalKeys;
  scrollToRaf: number | null | undefined;
  scrollingRaf: number | null | undefined;
}

export type Virtual = readonly [
  size: number,
  items: readonly Item[],
  controller: {
    readonly scrollTo: ScrollTo;
    readonly scrollToItem: ScrollToItem;
  }
];
