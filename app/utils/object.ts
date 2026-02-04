/**
 * 深度合併對象
 * @param target - 基礎對象
 * @param sources - 要合併的對象（可多個）
 * @returns 合併後的新對象
 */
export function mergeDeep<T extends Record<string, any>>(
  target: T,
  ...sources: Array<Partial<T> | undefined>
): T {
  if (!sources.length) return target;

  const result = { ...target };

  for (const source of sources) {
    if (!source) continue;

    for (const key in source) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (sourceValue === undefined) continue;

      // 如果兩者都是對象，遞歸合併
      if (
        isObject(targetValue) &&
        isObject(sourceValue) &&
        !Array.isArray(targetValue) &&
        !Array.isArray(sourceValue)
      ) {
        result[key] = mergeDeep(targetValue, sourceValue);
      } else {
        // 否則直接覆蓋
        result[key] = sourceValue;
      }
    }
  }

  return result;
}

/**
 * 判斷是否為對象
 */
function isObject(item: any): item is Record<string, any> {
  return item && typeof item === "object" && !Array.isArray(item);
}
