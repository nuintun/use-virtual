/**
 * @module index
 */

import {
  normalizeScrollingOptions,
  normalizeScrollToItemOptions,
  normalizeScrollToOptions,
  ScrollTo,
  ScrollToItem
} from './utils/scroll';
import { now } from './utils/now';
import { Align } from './utils/align';
import { getSize } from './utils/size';
import { getDuration } from './utils/easing';
import { getVirtualRange } from './utils/range';
import { getScrollOffset } from './utils/offset';
import { Events, hasEvent } from './utils/events';
import { usePrevious } from './hooks/usePrevious';
import { useLatestRef } from './hooks/useLatestRef';
import { Options, Virtual } from './utils/interface';
import { getBoundingRect, Rect } from './utils/rect';
import { isEqual, isEqualState } from './utils/equal';
import { getInitialState, Item, State } from './utils/state';
import { HORIZONTAL_KEYS, VERTICAL_KEYS } from './utils/keys';
import { useResizeObserver } from './hooks/useResizeObserver';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSafeLayoutEffect } from './hooks/useSafeLayoutEffect';
import { Measurement, setMeasurementAt } from './utils/measurement';
import { cancelScheduleFrame, requestScheduleFrame } from './utils/frame';

// 导出配置类型定义
export type { Options };

/**
 * @function useVirtual
 * @description [hook] 虚列表
 * @param options 配置参数
 */
export function useVirtual(options: Options): Virtual {
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

  const anchorIndexRef = useRef(0);
  const scrollOffsetRef = useRef(0);
  const isMountedRef = useRef(false);
  const prevSize = usePrevious(size);
  const scrollingRef = useRef(false);
  const observe = useResizeObserver();
  const remeasureIndexRef = useRef(-1);
  const optionsRef = useLatestRef(options);
  const scrollToRafRef = useRef<number>(null);
  const scrollingRafRef = useRef<number>(null);
  const measurementsRef = useRef<Measurement[]>([]);
  const [state, setState] = useState(getInitialState);
  const viewportRectRef = useRef<Rect>({ width: 0, height: 0 });
  const keysRef = useLatestRef(horizontal ? HORIZONTAL_KEYS : VERTICAL_KEYS);

  const scrollToOffset = useCallback((offset: number): void => {
    optionsRef.current.viewport()?.scrollTo({
      behavior: 'auto',
      [keysRef.current.scrollTo]: offset
    });
  }, []);

  const remeasure = useCallback((): void => {
    const { size, count } = optionsRef.current;
    const { current: viewport } = viewportRectRef;
    const { current: measurements } = measurementsRef;
    const { current: remeasureIndex } = remeasureIndexRef;

    if (remeasureIndex >= 0) {
      for (let index = remeasureIndex; index < count; index++) {
        setMeasurementAt(measurements, index, getSize(index, size, measurements, viewport));
      }

      remeasureIndexRef.current = -1;
    }
  }, []);

  const dispatch = useCallback((action: (prevState: State) => State): void => {
    setState(prevState => {
      if (__DEV__) {
        const { size, items } = action(prevState);
        const nextState = { size, items: Object.freeze(items) };

        return isEqualState(nextState, prevState) ? prevState : nextState;
      }

      const nextState = action(prevState);

      return isEqualState(nextState, prevState) ? prevState : nextState;
    });
  }, []);

  const update = useCallback((scrollOffset: number, events: number): void => {
    if (isMountedRef.current) {
      remeasure();

      const { current: options } = optionsRef;
      const { current: viewport } = viewportRectRef;
      const { current: measurements } = measurementsRef;

      const viewportSize = viewport[keysRef.current.size];
      const offset = getScrollOffset(measurements, viewportSize, scrollOffset);
      const range = getVirtualRange(measurements, viewportSize, offset, anchorIndexRef.current);

      if (range) {
        const items: Item[] = [];
        const [start, end] = range;
        const { overscan = 10 } = options;
        const maxIndex = measurements.length - 1;
        const startIndex = Math.max(0, start - overscan);
        const endIndex = Math.min(end + overscan, maxIndex);

        anchorIndexRef.current = start;

        for (let index = startIndex; index <= endIndex; index++) {
          const measurement = measurements[index];
          const item: Item = {
            index,
            end: measurement.end,
            size: measurement.size,
            start: measurement.start,
            ref: element => {
              return observe(
                element,
                entry => {
                  if (index < measurements.length) {
                    const { start, size } = measurements[index];
                    const nextSize = getBoundingRect(entry)[keysRef.current.size];

                    if (nextSize !== size) {
                      if (__DEV__) {
                        const { size } = optionsRef.current;
                        const { current: viewport } = viewportRectRef;
                        const initialValue = getSize(index, size, measurements, viewport);

                        if (nextSize < initialValue) {
                          const message = 'size %o of virtual item %o cannot be less than initial size %o';

                          console.error(message, nextSize, index, initialValue);
                        }
                      }

                      setMeasurementAt(measurements, index, nextSize);

                      const { current: scrollOffset } = scrollOffsetRef;
                      const { current: remeasureIndex } = remeasureIndexRef;

                      if (remeasureIndex < 0) {
                        remeasureIndexRef.current = index;
                      } else {
                        remeasureIndexRef.current = Math.min(index, remeasureIndex);
                      }

                      // 可视区域以上元素高度变化时重新定向滚动位置，防止视野跳动
                      if (start < scrollOffset) {
                        scrollToOffset(scrollOffset + nextSize - size);
                      } else if (!scrollingRef.current) {
                        update(scrollOffset, Events.ReachEnd);
                      }
                    }
                  }
                },
                { box: 'border-box' }
              );
            }
          };

          items.push(__DEV__ ? Object.freeze(item) : item);
        }

        const size = measurements[maxIndex].end;

        dispatch(({ size: prevSize }) => {
          if (options.scrollbar === false) {
            return { items, size: prevSize };
          }

          // 四舍五入，防止出现小数无法触底更新高度
          const scrollSize = (scrollOffset + viewportSize + 0.5) | 0;
          const usePrevSize = scrollSize < prevSize && scrollSize < size;

          return { items, size: usePrevSize ? prevSize : size };
        });

        if (hasEvent(events, Events.Resize)) {
          options.onResize?.({
            visible: [start, end],
            width: viewport.width,
            height: viewport.height,
            items: [startIndex, endIndex]
          });
        }

        if (hasEvent(events, Events.Scroll)) {
          options.onScroll?.({
            offset,
            visible: [start, end],
            items: [startIndex, endIndex],
            delta: offset - scrollOffsetRef.current
          });
        }

        if (end >= maxIndex && hasEvent(events, Events.ReachEnd)) {
          options.onReachEnd?.({
            visible: [start, end],
            items: [startIndex, endIndex]
          });
        }
      } else {
        dispatch(() => ({ size: 0, items: [] }));

        if (hasEvent(events, Events.Resize)) {
          options.onResize?.({
            items: [0, 0],
            visible: [0, 0],
            width: viewport.width,
            height: viewport.height
          });
        }

        if (viewportSize > 0 && hasEvent(events, Events.ReachEnd)) {
          options.onReachEnd?.({
            items: [0, 0],
            visible: [0, 0]
          });
        }
      }
    }
  }, []);

  const scrollTo = useCallback<ScrollTo>((value, callback) => {
    cancelScheduleFrame(scrollToRafRef.current);

    if (isMountedRef.current) {
      remeasure();

      const config = normalizeScrollToOptions(value);
      const viewportSize = viewportRectRef.current[keysRef.current.size];
      const offset = getScrollOffset(measurementsRef.current, viewportSize, config.offset);

      const onComplete = () => {
        if (callback) {
          // 延迟 6 帧等待绘制完成
          requestScheduleFrame(
            6,
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

      if (config.smooth) {
        const start = now();
        const { current: options } = optionsRef;
        const { current: scrollOffset } = scrollOffsetRef;
        const config = normalizeScrollingOptions(options.scrolling);

        const distance = offset - scrollOffset;
        const duration = getDuration(config.duration, Math.abs(distance));

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
    }
  }, []);

  const scrollToItem = useCallback<ScrollToItem>((value, callback) => {
    if (isMountedRef.current) {
      const { index, align, smooth } = normalizeScrollToItemOptions(value);

      const getOffset = (index: number): number => {
        if (isMountedRef.current) {
          remeasure();

          const { current: measurements } = measurementsRef;
          const maxIndex = measurements.length - 1;

          if (maxIndex >= 0) {
            index = Math.max(0, Math.min(index, maxIndex));

            const { start, size, end } = measurements[index];
            const viewport = viewportRectRef.current[keysRef.current.size];

            let { current: offset } = scrollOffsetRef;

            switch (align) {
              case Align.Start:
                offset = start;
                break;
              case Align.Center:
                offset = start + size / 2 - viewport / 2;
                break;
              case Align.End:
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

            return Math.max(0, getScrollOffset(measurements, viewport, offset));
          }
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

  useSafeLayoutEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useSafeLayoutEffect(() => {
    const viewport = optionsRef.current.viewport();

    if (viewport != null) {
      const unobserve = observe(viewport, entry => {
        const viewport = getBoundingRect(entry, true);

        if (!isEqual(viewport, viewportRectRef.current, ['width', 'height'])) {
          viewportRectRef.current = viewport;

          update(scrollOffsetRef.current, Events.Resize | Events.ReachEnd);
        }
      });

      const onScroll = () => {
        const scrollOffset = viewport[keysRef.current.scrollOffset];

        // 防止非正确方向滚动时触发更新
        if (scrollOffset !== scrollOffsetRef.current) {
          scrollingRef.current = true;

          // 取消前次滚动状态更新回调
          cancelScheduleFrame(scrollingRafRef.current);

          // 更新可视区域
          update(scrollOffset, Events.Scroll | Events.ReachEnd);

          // 缓存滚动位置
          scrollOffsetRef.current = scrollOffset;

          // 延迟 2 帧更新滚动状态并重新触发一次更新同步状态
          requestScheduleFrame(
            2,
            () => {
              scrollingRef.current = false;

              update(scrollOffsetRef.current, Events.None);
            },
            handle => {
              scrollingRafRef.current = handle;
            }
          );
        }
      };

      viewport.addEventListener('scroll', onScroll, { passive: true });

      return () => {
        unobserve();

        viewport.removeEventListener('scroll', onScroll);
      };
    }
  }, []);

  useEffect(() => {
    if (size !== prevSize) {
      remeasureIndexRef.current = 0;
      measurementsRef.current.length = 0;
    } else {
      const { current: measures } = measurementsRef;
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
    update(scrollOffsetRef.current, Events.ReachEnd);
  }, [count, size, horizontal]);

  return [state.size, state.items, { scrollTo, scrollToItem }];
}
