/**
 * @module index
 */

import { now } from './utils/now';
import { Keys } from './utils/keys';
import { Align } from './utils/align';
import { getSize } from './utils/size';
import { setMeasure } from './utils/measure';
import { getBoundingRect } from './utils/rect';
import { getInitialState } from './utils/state';
import { getVirtualRange } from './utils/range';
import { getScrollOffset } from './utils/offset';
import { Events, useEvent } from './utils/events';
import { usePrevious } from './hooks/usePrevious';
import { useLatestRef } from './hooks/useLatestRef';
import { isEqual, isEqualState } from './utils/equal';
import { removeStyles, setStyles } from './utils/styles';
import { useResizeObserver } from './hooks/useResizeObserver';
import { useIsoLayoutEffect } from './hooks/useIsoLayoutEffect';
import { useCallback, useEffect, useRef, useState } from 'react';
import { abortAnimationFrame, requestDeferFrame } from './utils/raf';
import { Item, Measure, Options, Rect, ScrollTo, ScrollToItem, State, Virtual } from './utils/interface';
import { getDuration, getScrollingOptions, getScrollToItemOptions, getScrollToOptions } from './utils/scroll';

// Export typescript types
export type { Item, Options, ScrollToItemOptions, ScrollToOptions, Virtual } from './utils/interface';

/**
 * @function useVirtual
 * @description [hook] 虚列表
 * @param options 配置参数
 */
export default function useVirtual<T extends HTMLElement, U extends HTMLElement>(options: Options): Virtual<T, U> {
  const { size, count, horizontal } = options;

  if (__DEV__) {
    if (count !== count >>> 0) {
      throw new RangeError('virtual count must be an integer not less than 0');
    }

    const { overscan } = options;

    if (overscan !== void 0 && overscan !== overscan! >>> 0) {
      throw new RangeError('options.overscan must be an integer not less than 0');
    }
  }

  const frameRef = useRef<U>(null);
  const scrollOffsetRef = useRef(0);
  const scrollToRef = useRef(false);
  const isMountedRef = useRef(false);
  const scrollingRef = useRef(false);
  const observe = useResizeObserver();
  const viewportRef = useRef<T>(null);
  const remeasureIndexRef = useRef(-1);
  const scrollToRafRef = useRef<number>();
  const anchorIndexRef = useRef<number>(0);
  const frameSizeRafRef = useRef<number>();
  const optionsRef = useLatestRef(options);
  const scrollingRafRef = useRef<number>();
  const measuresRef = useRef<Measure[]>([]);
  const prevSize = usePrevious(options.size);
  const keysRef = useLatestRef(Keys[horizontal ? 1 : 0]);
  const [state, setState] = useState<State>(getInitialState);
  const viewportRectRef = useRef<Rect>({ width: 0, height: 0 });

  const scrollToOffset = useCallback((offset: number): void => {
    viewportRef.current?.scrollTo({
      behavior: 'auto',
      [keysRef.current.scrollTo]: offset
    });
  }, []);

  const stateUpdate = useCallback((state: State): void => {
    setState(prevState => {
      return isEqualState(state, prevState) ? prevState : state;
    });
  }, []);

  const remeasure = useCallback((): void => {
    const { current: measures } = measuresRef;
    const { size, count } = optionsRef.current;
    const { current: viewport } = viewportRectRef;
    const { current: remeasureIndex } = remeasureIndexRef;

    if (remeasureIndex >= 0) {
      for (let index = remeasureIndex; index < count; index++) {
        setMeasure(measures, index, getSize(index, size, measures, viewport));
      }

      remeasureIndexRef.current = -1;
    }
  }, []);

  const update = useCallback((scrollOffset: number, events: number): void => {
    if (isMountedRef.current) {
      remeasure();

      const { current: options } = optionsRef;
      const { current: measures } = measuresRef;
      const { current: viewport } = viewportRectRef;

      const viewportSize = viewport[keysRef.current.size];
      const offset = getScrollOffset(viewportSize, scrollOffset, measures);
      const range = getVirtualRange(viewportSize, offset, measures, anchorIndexRef.current);

      if (range) {
        const items: Item[] = [];
        const [start, end] = range;
        const { overscan = 10 } = options;
        const maxIndex = measures.length - 1;
        const startIndex = Math.max(0, start - overscan);
        const endIndex = Math.min(end + overscan, maxIndex);

        anchorIndexRef.current = start;

        for (let index = startIndex; index <= endIndex; index++) {
          const measure = measures[index];

          items.push({
            index,
            viewport,
            end: measure.end,
            size: measure.size,
            start: measure.start,
            observe: element => {
              setStyles(element, [['margin', '0']]);

              return observe(
                element,
                entry => {
                  const { current: frame } = frameRef;
                  const { current: measures } = measuresRef;

                  if (frame && index < measures.length) {
                    const { start, size } = measures[index];
                    const nextSize = getBoundingRect(entry)[keysRef.current.size];

                    if (nextSize !== size && frame.contains(entry.target)) {
                      setMeasure(measures, index, nextSize);

                      const { current: scrollOffset } = scrollOffsetRef;
                      const { current: remeasureIndex } = remeasureIndexRef;

                      if (remeasureIndex < 0) {
                        remeasureIndexRef.current = index;
                      } else {
                        remeasureIndexRef.current = Math.min(index, remeasureIndex);
                      }

                      // 非调用接口滚动中可视区域以上高度变化时重新定向滚动位置，防止视野跳动
                      if (start < scrollOffset && !scrollToRef.current) {
                        scrollToOffset(scrollOffset + nextSize - size);
                      } else if (!scrollingRef.current) {
                        update(scrollOffset, Events.onReachEnd);
                      }
                    }
                  }
                },
                { box: 'border-box' }
              );
            }
          });
        }

        stateUpdate({
          items,
          frame: [measures[startIndex].start, measures[maxIndex].end]
        });

        if (useEvent(events, Events.onResize)) {
          options.onResize?.(viewport);
        }

        if (useEvent(events, Events.onScroll)) {
          options.onScroll?.({
            offset,
            visible: [start, end],
            overscan: [startIndex, endIndex],
            delta: offset - scrollOffsetRef.current
          });
        }

        if (end >= maxIndex && useEvent(events, Events.onReachEnd)) {
          options.onReachEnd?.({
            offset,
            index: end,
            visible: [start, end],
            overscan: [startIndex, endIndex]
          });
        }
      } else {
        stateUpdate({
          items: [],
          frame: [0, -1]
        });

        if (useEvent(events, Events.onResize)) {
          options.onResize?.(viewport);
        }

        if (viewportSize > 0 && useEvent(events, Events.onReachEnd)) {
          options.onReachEnd?.({
            offset,
            index: -1,
            visible: [-1, -1],
            overscan: [-1, -1]
          });
        }
      }
    }
  }, []);

  const scrollTo = useCallback<ScrollTo>((value, callback) => {
    if (isMountedRef.current) {
      remeasure();

      scrollToRef.current = true;

      const config = getScrollToOptions(value);
      const { current: scrollOffset } = scrollOffsetRef;
      const viewportSize = viewportRectRef.current[keysRef.current.size];
      const offset = getScrollOffset(viewportSize, config.offset, measuresRef.current);

      const onComplete = () => {
        scrollToRef.current = false;

        if (callback) {
          // 延迟 4 帧等待绘制完成
          requestDeferFrame(
            4,
            () => {
              if (isMountedRef.current) {
                callback();
              }
            },
            handle => {
              scrollToRafRef.current = handle;
            }
          );
        }
      };

      if (offset !== scrollOffset) {
        if (config.smooth) {
          const start = now();
          const distance = offset - scrollOffset;
          const { current: options } = optionsRef;
          const config = getScrollingOptions(options.scrolling);
          const duration = getDuration(config.duration, Math.abs(distance));

          abortAnimationFrame(scrollToRafRef.current);

          const scroll = (): void => {
            if (isMountedRef.current) {
              const time = Math.min(1, (now() - start) / duration);

              scrollToOffset(config.easing(time) * distance + scrollOffset);

              if (time < 1) {
                scrollToRafRef.current = requestAnimationFrame(scroll);
              } else {
                onComplete();
              }
            }
          };

          scrollToRafRef.current = requestAnimationFrame(scroll);
        } else {
          scrollToOffset(offset);

          onComplete();
        }
      } else {
        onComplete();
      }
    }
  }, []);

  const scrollToItem = useCallback<ScrollToItem>((value, callback) => {
    if (isMountedRef.current) {
      const { index, align, smooth } = getScrollToItemOptions(value);

      const getOffset = (index: number): number => {
        remeasure();

        const { current: measures } = measuresRef;
        const maxIndex = measures.length - 1;

        if (maxIndex >= 0) {
          index = Math.max(0, Math.min(index, maxIndex));

          const { start, size, end } = measures[index];
          const viewport = viewportRectRef.current[keysRef.current.size];

          let { current: offset } = scrollOffsetRef;

          switch (align) {
            case Align.start:
              offset = start;
              break;
            case Align.center:
              offset = start + size / 2 - viewport / 2;
              break;
            case Align.end:
              offset = end - viewport;
              break;
            default:
              if (end <= offset) {
                offset = start;
              } else if (start >= offset + viewport) {
                offset = end - viewport;
              }
              break;
          }

          return Math.max(0, getScrollOffset(viewport, offset, measures));
        }

        return -1;
      };

      const offset = getOffset(index);

      if (offset >= 0) {
        scrollTo({ offset, smooth }, () => {
          const nextOffset = getOffset(index);

          if (nextOffset >= 0 && nextOffset !== offset) {
            scrollToItem({ index, align, smooth }, callback);
          } else if (callback) {
            callback();
          }
        });
      }
    }
  }, []);

  useIsoLayoutEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useIsoLayoutEffect(() => {
    setStyles(frameRef.current, [
      ['margin', '0'],
      ['box-sizing', 'border-box']
    ]);

    setStyles(viewportRef.current, [['padding', '0']]);
  }, []);

  useIsoLayoutEffect(() => {
    const paddingTop = 'padding-top';
    const paddingLeft = 'padding-left';
    const paddingRight = 'padding-right';
    const paddingBottom = 'padding-bottom';

    const { current: frame } = frameRef;

    if (horizontal) {
      setStyles(frame, [[paddingRight, '0']]);
      removeStyles(frame, ['height', paddingTop, paddingBottom]);
    } else {
      setStyles(frame, [[paddingBottom, '0']]);
      removeStyles(frame, ['width', paddingLeft, paddingRight]);
    }
  }, [horizontal]);

  const [frameOffset, frameSize] = state.frame;

  useIsoLayoutEffect(() => {
    const { current: frame } = frameRef;
    const { size: sizeKey } = keysRef.current;

    abortAnimationFrame(frameSizeRafRef.current);

    if (frameSize < 0) {
      removeStyles(frame, [sizeKey]);
    } else {
      // 滚动中延迟 6 帧，防止滚动条跳变，其它情况延迟 1 帧
      requestDeferFrame(
        scrollOffsetRef.current ? 6 : 1,
        () => {
          setStyles(frameRef.current, [[sizeKey, `${frameSize}px`]]);
        },
        handle => {
          frameSizeRafRef.current = handle;
        }
      );
    }
  }, [horizontal, frameSize]);

  useIsoLayoutEffect(() => {
    const { offset: offsetKey } = keysRef.current;

    setStyles(frameRef.current, [[offsetKey, `${frameOffset}px`]]);
  }, [horizontal, frameOffset]);

  useIsoLayoutEffect(() => {
    const { current: viewport } = viewportRef;

    if (viewport) {
      const onScrollChange = () => {
        if (isMountedRef.current && viewport) {
          abortAnimationFrame(scrollingRafRef.current);

          scrollingRef.current = true;

          const scrollOffset = viewport[keysRef.current.scrollOffset];

          update(scrollOffset, Events.onScroll | Events.onReachEnd);

          scrollOffsetRef.current = scrollOffset;

          // 延迟 2 帧等待绘制完成
          requestDeferFrame(
            2,
            () => {
              scrollingRef.current = false;

              update(scrollOffsetRef.current, 0);
            },
            handle => {
              scrollingRafRef.current = handle;
            }
          );
        }
      };

      const unobserve = observe(viewport, entry => {
        const viewport = getBoundingRect(entry, true);

        if (!isEqual(viewport, viewportRectRef.current, ['width', 'height'])) {
          viewportRectRef.current = viewport;

          update(scrollOffsetRef.current, Events.onResize | Events.onReachEnd);
        }
      });

      viewport.addEventListener('scroll', onScrollChange, { passive: true });

      return () => {
        unobserve();

        viewport.removeEventListener('scroll', onScrollChange);
      };
    }
  }, []);

  useEffect(() => {
    if (size !== prevSize) {
      remeasureIndexRef.current = 0;
      measuresRef.current.length = 0;
    } else {
      const { current: measures } = measuresRef;
      const { length } = measures;

      if (length > count) {
        measures.length = count;
      } else if (length < count) {
        remeasureIndexRef.current = length;
      }
    }

    const maxIndex = Math.max(0, count - 1);
    const { current: anchor } = anchorIndexRef;

    anchorIndexRef.current = Math.min(anchor, maxIndex);
  }, [count, size]);

  useEffect(() => {
    update(scrollOffsetRef.current, Events.onReachEnd);
  }, [count, size, horizontal]);

  return [state.items, viewportRef, frameRef, { scrollTo, scrollToItem }];
}
