/**
 * @module typeof
 */

/**
 * @function isFunction
 * @description 是否为函数
 * @param value 需要验证的值
 */
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

/**
 * @function isNumber
 * @description 是否为数字
 * @param value 需要验证的值
 */
export function isNumber(value: unknown): value is number {
  return Object.prototype.toString.call(value) === '[object Number]';
}

/**
 * @function isStylableElement
 * @description 是否为可样式的元素
 * @param value 需要验证的值
 */
export function isStylableElement(value: unknown): value is HTMLElement | SVGElement {
  return value instanceof HTMLElement || value instanceof SVGElement;
}
