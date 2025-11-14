/**
 * @module getRandom
 */

/**
 * 线性同余随机数生成器
 * 使用 LCG 算法实现
 * @param seed 随机数种子
 * @returns 0 到 1 之间的随机数
 * @see https://www.zhihu.com/question/22818104
 */
export function getRandom(): number {
  const bucket = new Uint32Array(1);
  const [seed] = crypto.getRandomValues(bucket);

  return ((seed * 9301 + 49297) % 233280) / 233280;
}

export function getRandomInt(min: number, max: number): number {
  return min + Math.floor(getRandom() * (max - min + 1));
}
