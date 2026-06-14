/**
 * Deep merge function similar to lodash _.merge.
 * Recursively merges own and inherited enumerable string keyed properties
 * of source objects into the destination object.
 * Source properties that resolve to undefined are skipped if a destination value exists.
 * Arrays are merged by index (not concatenated).
 * Modifies the target object and returns it.
 *
 * @param {Object} target - The destination object.
 * @param {...Object} sources - The source objects.
 * @returns {Object} The merged target object.
 */
/* eslint-disable  @typescript-eslint/no-explicit-any */
export function merge(target: any, ...sources: any): any {
  if (!target || typeof target !== "object") {
    target = {};
  }

  function isObject(item: object) {
    return item && typeof item === "object" && !Array.isArray(item);
  }

  function isPlainObject(item: object) {
    return isObject(item) && Object.getPrototypeOf(item) === Object.prototype;
  }

  for (const source of sources) {
    if (!source || typeof source !== "object") continue;

    for (const key of Object.keys(source)) {
      const srcVal = source[key];
      const tgtVal = target[key];

      // Skip undefined sources if target has a value
      if (srcVal === undefined && tgtVal !== undefined) {
        continue;
      }

      if (isPlainObject(srcVal)) {
        if (!isPlainObject(tgtVal)) {
          target[key] = {};
        }
        merge(target[key], srcVal);
      } else if (Array.isArray(srcVal)) {
        if (!Array.isArray(tgtVal)) {
          target[key] = [];
        }
        // Merge arrays by index (lodash behavior)
        for (let i = 0; i < srcVal.length; i++) {
          if (i < target[key].length) {
            if (isPlainObject(srcVal[i])) {
              if (!isPlainObject(target[key][i])) {
                target[key][i] = {};
              }
              merge(target[key][i], srcVal[i]);
            } else {
              target[key][i] = srcVal[i];
            }
          } else {
            target[key].push(srcVal[i]);
          }
        }
      } else {
        target[key] = srcVal;
      }
    }
  }

  return target;
}
