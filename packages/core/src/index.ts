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
import { getKeys } from './utils/keys';
import { getSize } from './utils/size';
import { getRange } from './utils/range';
import { clampOffset } from './utils/offset';
import { getDuration } from './utils/easing';
import { getBoundingRect } from './utils/rect';
import { Events, hasEvent } from './utils/events';
import { useInternal } from './hooks/useInternal';
import { usePrevious } from './hooks/usePrevious';
import { useLatestRef } from './hooks/useLatestRef';
import { Options, Virtual } from './utils/interface';
import { setMeasurementAt } from './utils/measurement';
import { getInitialState, Item, State } from './utils/state';
import { useResizeObserver } from './hooks/useResizeObserver';
import { isEqualItem, isEqualRect, isEqualState } from './utils/equal';
import { cancelScheduleFrame, requestScheduleFrame } from './utils/raf';
import { startTransition, useCallback, useEffect, useLayoutEffect, useState } from 'react';

// 导出配置类型定义
export type { Item, Options };

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

  const prevSize = usePrevious(size);
  const observe = useResizeObserver();
  const internal = useInternal(horizontal);
  const optionsRef = useLatestRef(options);
  const [state, setState] = useState(getInitialState);

  const remeasure = useCallback((): void => {
    const { size, count } = optionsRef.current;
    const { viewport, measurements, remeasureIndex } = internal;

    if (remeasureIndex >= 0) {
      for (let index = remeasureIndex; index < count; index++) {
        setMeasurementAt(measurements, index, getSize(measurements, viewport, size, index));
      }

      internal.remeasureIndex = -1;
    }
  }, []);

  const scrollToOffset = useCallback((offset: number): void => {
    optionsRef.current.viewport()?.scrollTo({
      behavior: 'instant',
      [internal.keys.scrollTo]: offset
    });
  }, []);

  const scrollTo = useCallback<ScrollTo>((value, callback) => {
    cancelScheduleFrame(internal.scrollToRaf);

    if (internal.mounted) {
      remeasure();

      const config = normalizeScrollToOptions(value);
      const viewportSize = internal.viewport[internal.keys.size];
      const offset = clampOffset(internal.measurements, viewportSize, config.offset);

      const onComplete = () => {
        if (callback != null) {
          // 延迟 6 帧等待绘制完成
          requestScheduleFrame(
            6,
            () => {
              if (internal.mounted) {
                callback();
              }
            },
            handle => {
              internal.scrollToRaf = handle;
            }
          );
        }
      };

      if (config.smooth === true) {
        const start = now();
        const { scrollOffset } = internal;
        const distance = offset - scrollOffset;
        const config = normalizeScrollingOptions(optionsRef.current.scrolling);
        const duration = getDuration(config.duration, Math.abs(distance));

        const scroll = (): void => {
          if (internal.mounted) {
            const time = Math.min(1, (now() - start) / duration);

            scrollToOffset(config.easing(time) * distance + scrollOffset);

            if (time < 1) {
              internal.scrollToRaf = requestAnimationFrame(scroll);
            } else {
              onComplete();
            }
          }
        };

        internal.scrollToRaf = requestAnimationFrame(scroll);
      } else {
        scrollToOffset(offset);

        onComplete();
      }
    }
  }, []);

  const scrollToItem = useCallback<ScrollToItem>((value, callback) => {
    if (internal.mounted) {
      const { index, align, smooth } = normalizeScrollToItemOptions(value);

      const getOffset = (index: number): number => {
        if (internal.mounted) {
          remeasure();

          const { measurements } = internal;
          const maxIndex = measurements.length - 1;

          if (maxIndex >= 0) {
            let { scrollOffset: offset } = internal;

            index = Math.max(0, Math.min(index, maxIndex));

            const { start, size, end } = measurements[index];
            const viewportSize = internal.viewport[internal.keys.size];

            switch (align) {
              case Align.Start:
                offset = start;
                break;
              case Align.Center:
                offset = start + size / 2 - viewportSize / 2;
                break;
              case Align.End:
                offset = end - viewportSize;
                break;
              default:
                if (end <= offset) {
                  offset = start;
                } else if (start >= offset + viewportSize) {
                  offset = end - viewportSize;
                }
                break;
            }

            return Math.max(0, clampOffset(measurements, viewportSize, offset));
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
          } else if (callback != null) {
            callback();
          }
        });
      }
    }
  }, []);

  const dispatch = useCallback((action: (prevState: State) => State): void => {
    startTransition(() => {
      setState(prevState => {
        const nextState = action(prevState);

        return isEqualState(nextState, prevState) ? prevState : nextState;
      });
    });
  }, []);

  const update = useCallback((scrollOffset: number, events: Events): void => {
    if (internal.mounted) {
      remeasure();

      const { current: options } = optionsRef;
      const { viewport, measurements } = internal;
      const viewportSize = viewport[internal.keys.size];

      if (viewportSize > 0 && measurements.length > 0) {
        const offset = clampOffset(measurements, viewportSize, scrollOffset);
        const range = getRange(measurements, viewportSize, offset, internal.anchorIndex);

        const items: Item[] = [];
        const [start, end] = range;
        const { overscan = 10 } = options;
        const maxIndex = measurements.length - 1;
        const startIndex = Math.max(0, start - overscan);
        const endIndex = Math.min(end + overscan, maxIndex);

        internal.anchorIndex = start;

        for (let index = startIndex; index <= endIndex; index++) {
          const prevItem = internal.items.get(index);
          const { size, start, end } = measurements[index];

          if (prevItem != null && isEqualItem({ index, size, start, end }, prevItem)) {
            items.push(prevItem);
          } else {
            const item: Item = {
              end,
              size,
              index,
              start,
              ref: element => {
                const unobserve = observe(
                  element,
                  entry => {
                    if (index < measurements.length) {
                      const { start, size } = measurements[index];
                      const nextSize = getBoundingRect(entry)[internal.keys.size];

                      if (nextSize !== size) {
                        if (__DEV__) {
                          const { size } = optionsRef.current;
                          const initialValue = getSize(measurements, internal.viewport, size, index);

                          if (nextSize < initialValue) {
                            const message = 'size %o of virtual item %o cannot be less than initial size %o';

                            console.error(message, nextSize, index, initialValue);
                          }
                        }

                        setMeasurementAt(measurements, index, nextSize);

                        const { remeasureIndex, scrollOffset } = internal;

                        if (remeasureIndex < 0) {
                          internal.remeasureIndex = index;
                        } else {
                          internal.remeasureIndex = Math.min(index, remeasureIndex);
                        }

                        // 可视区域以上元素高度变化时重新定向滚动位置，防止视野跳动
                        if (start < scrollOffset) {
                          scrollToOffset(scrollOffset + nextSize - size);
                        } else if (!internal.scrolling) {
                          update(scrollOffset, Events.ReachEnd);
                        }
                      }
                    }
                  },
                  { box: 'border-box' }
                );

                return () => {
                  unobserve();

                  internal.items.delete(index);
                };
              }
            };

            if (__DEV__) {
              const nextItem = Object.freeze(item);

              items.push(nextItem);

              internal.items.set(index, nextItem);
            } else {
              items.push(item);

              internal.items.set(index, item);
            }
          }
        }

        const size = measurements[maxIndex].end;

        dispatch(({ size: prevSize }) => {
          if (optionsRef.current.scrollbar === false) {
            return { size, items: __DEV__ ? Object.freeze(items) : items };
          }

          const scrollSize = Math.ceil(scrollOffset + viewportSize);
          const usePrevSize = scrollSize < prevSize && scrollSize < size;

          return {
            size: usePrevSize ? prevSize : size,
            items: __DEV__ ? Object.freeze(items) : items
          };
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
            delta: offset - internal.scrollOffset
          });
        }

        if (hasEvent(events, Events.ReachEnd)) {
          if (Math.ceil(offset + viewportSize) >= size) {
            options.onReachEnd?.({
              visible: [start, end],
              items: [startIndex, endIndex]
            });
          }
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

  useEffect(() => {
    internal.keys = getKeys(horizontal);
  }, [horizontal]);

  useEffect(() => {
    if (size !== prevSize) {
      internal.remeasureIndex = 0;
      internal.measurements.length = 0;
    } else {
      const { measurements } = internal;

      if (measurements.length > count) {
        measurements.length = count;
      }
    }

    internal.anchorIndex = Math.min(internal.anchorIndex, Math.max(0, count - 1));
  }, [count, size]);

  useEffect(() => {
    update(internal.scrollOffset, Events.ReachEnd);
  }, [count, size, horizontal]);

  useLayoutEffect(() => {
    internal.mounted = true;

    const viewport = optionsRef.current.viewport();

    if (viewport != null) {
      const unobserve = observe(viewport, entry => {
        const viewport = getBoundingRect(entry, true);

        if (!isEqualRect(viewport, internal.viewport)) {
          internal.viewport = viewport;

          update(internal.scrollOffset, Events.Resize | Events.ReachEnd);
        }
      });

      const onScroll = () => {
        // 取消前次滚动状态更新回调
        cancelScheduleFrame(internal.scrollingRaf);

        const scrollOffset = viewport[internal.keys.scrollOffset];

        // 防止非正确方向滚动时触发更新
        if (scrollOffset !== internal.scrollOffset) {
          // 缓存滚动状态
          internal.scrolling = true;

          // 更新可视区域
          update(scrollOffset, Events.Scroll | Events.ReachEnd);

          // 缓存滚动位置
          internal.scrollOffset = scrollOffset;

          // 延迟 2 帧更新滚动状态并重新触发一次更新同步状态
          requestScheduleFrame(
            2,
            () => {
              internal.scrolling = false;

              // 特定情况下重新触发一次更新
              if (internal.remeasureIndex >= 0) {
                update(internal.scrollOffset, Events.None);
              }
            },
            handle => {
              internal.scrollingRaf = handle;
            }
          );
        }
      };

      viewport.addEventListener('scroll', onScroll, { passive: true });

      return () => {
        unobserve();

        internal.items.clear();

        internal.mounted = false;

        viewport.removeEventListener('scroll', onScroll);
      };
    }
  }, []);

  return [state.size, state.items, { scrollTo, scrollToItem }];
}
