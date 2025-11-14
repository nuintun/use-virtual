/**
 * @module frame
 */

/**
 * @function deferAnimationFrame
 * @description 延迟指定帧数后执行回调函数
 * @param frames 延迟帧数
 * @param callback 回调函数
 * @param onHandleChange 帧句柄
 */
export function requestScheduleFrame(
  frames: number,
  callback: FrameRequestCallback,
  onHandleChange: (handle: number) => void = () => {}
): void {
  const tick = (time: DOMHighResTimeStamp): void => {
    if (--frames > 0) {
      onHandleChange(requestAnimationFrame(tick));
    } else {
      callback(time);
    }
  };

  onHandleChange(requestAnimationFrame(tick));
}

/**
 * @function cancelScheduleFrame
 * @description 取消延迟的动画帧回调
 * @param handle 帧句柄
 */
export function cancelScheduleFrame(handle: number | null | undefined): void {
  if (handle != null) {
    cancelAnimationFrame(handle);
  }
}
