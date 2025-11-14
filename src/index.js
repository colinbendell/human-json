/**
 * @typedef {Object} HumanJSONOptions
 * @property {boolean} [sortKeys=true] - Whether to sort object keys alphabetically
 * @property {string[]} [sortPriorityKeys=['name', 'id', 'value', 'version', 'date', 'errors']] - Keys to prioritize at the top when sorting
 * @property {boolean} [denseWrapArrays=true] - Whether to densely wrap simple values on the same line
 * @property {boolean} [denseWrapObjects=false] - Whether to densely wrap simple values on the same line
 * @property {boolean} [padBlocks=true] - Whether to add padding around brackets and braces
 * @property {boolean} [appendNewLine=true] - Whether to append a newline at the end
 */

export default class HumanJSON {
  /** @type {string} */
  #indent;
  /** @type {boolean} */
  #padBlocks;
  /** @type {number} */
  #maxLength;
  /** @type {boolean} */
  #denseWrapArrays;
  /** @type {boolean} */
  #denseWrapObjects;
  /** @type {PriorityKeySorter} */
  #keySorter;
  /** @type {boolean} */
  #sortKeys;
  /** @type {boolean} */
  #appendNewLine;

  /**
   * Creates a new HumanJSON formatter instance
   * @param {number} [indentSpaces=2] - Number of spaces for indentation
   * @param {number} [maxLineLength=120] - Maximum line length before wrapping
   * @param {HumanJSONOptions} [options] - Formatting options
   */
  constructor(
    indentSpaces = 2,
    maxLineLength = 120,
    options = {
      sortKeys: true,
      sortPriorityKeys: ["name", "id", "value", "version", "date", "errors"],
      denseWrapArrays: true,
      denseWrapObjects: false,
      padBlocks: true,
      appendNewLine: true,
    },
  ) {
    this.#indent = " ".repeat(indentSpaces);
    this.#padBlocks = options.padBlocks ?? true;
    this.#maxLength = this.#indent === "" ? Infinity : maxLineLength || 120;
    this.#denseWrapArrays = options.denseWrapArrays ?? true;
    this.#denseWrapObjects = options.denseWrapObjects ?? false;
    this.#keySorter = new PriorityKeySorter(
      options.sortPriorityKeys ?? ["name", "id", "value", "version", "date", "errors"],
    );
    this.#sortKeys = Boolean(options.sortKeys ?? true);
    this.#appendNewLine = Boolean(options.appendNewLine ?? true);
  }

  /**
   * Converts a JavaScript value to a human-readable JSON string
   * @param {any} obj - The value to stringify
   * @param {number} [indentSpaces=2] - Number of spaces for indentation
   * @param {number} [maxLineLength=120] - Maximum line length before wrapping
   * @param {HumanJSONOptions} [options] - Formatting options
   * @returns {string} The formatted JSON string
   */
  static stringify(
    obj,
    indentSpaces = 2,
    maxLineLength = 120,
    options = {
      sortKeys: true,
      sortPriorityKeys: ["name", "id", "value", "version", "date", "errors"],
      denseWrapArrays: true,
      denseWrapObjects: false,
      padBlocks: true,
      appendNewLine: true,
    },
  ) {
    return new HumanJSON(indentSpaces, maxLineLength, options).stringify(obj);
  }

  /**
   * Converts a JavaScript value to a human-readable JSON string
   * @param {any} obj - The value to stringify
   * @returns {string} The formatted JSON string
   */
  stringify(obj) {
    const result = this.#stringify(obj, "", 0) ?? "";
    return result + (this.#appendNewLine ? "\n" : "");
  }

  // Note: This regex matches even invalid JSON strings, but since we're
  // working on the output of `JSON.stringify` we know that only valid strings
  // are present (unless the user supplied a weird `options.indent` but in
  // that case we don't care since the output would be invalid anyway).
  /** @type {RegExp} */
  static #STRING_OR_JSON_TOKENS = /("(?:[^\\"]|\\.)*")|[:,\][}{]/g;
  /** @type {RegExp} */
  static #STRING_OR_MINOR_JSON_TOKENS = /("(?:[^\\"]|\\.)*")|[:,]/g;
  /** @type {Map<string, string>} */
  static #PADDING_MAP = new Map([
    ["{", "{ "],
    ["[", "[ "],
    ["}", " }"],
    ["]", " ]"],
    [",", ", "],
    [":", ": "],
  ]);

  /**
   * Adds padding around JSON tokens for readability
   * @param {string} string - The string to pad
   * @param {boolean} padBlocks - Whether to pad block delimiters
   * @returns {string} The padded string
   */
  #pad(string, padBlocks) {
    const regex = padBlocks ? HumanJSON.#STRING_OR_JSON_TOKENS : HumanJSON.#STRING_OR_MINOR_JSON_TOKENS;
    return string.replace(regex, (match) => HumanJSON.#PADDING_MAP.get(match) ?? match);
  }

  /**
   * Checks if an array contains only simple primitive values
   * @param {any[]} values - Array of values to check
   * @returns {boolean} True if all values are null, undefined, string, number, or boolean
   */
  #containsOnlySimpleValues(values) {
    return (
      values.findIndex(
        (v) => !(v === null || v === undefined || ["string", "number", "boolean"].includes(typeof v)),
      ) === -1
    );
  }

  /**
   * Wraps array items densely, combining multiple items per line when possible
   * @param {string[]} items - Array of stringified items
   * @param {string} nextIndent - The indentation string for the next level
   * @returns {string[]} Array of items, potentially combined on lines
   */
  #denseWrap(items, nextIndent) {
    /** @type {string[]} */
    const newItems = [];
    for (const v of items) {
      const lastItem = newItems[newItems.length - 1];
      if (
        newItems.length > 0 &&
        lastItem !== undefined &&
        nextIndent.length + lastItem.length + v.length < this.#maxLength
      ) {
        newItems.push(newItems.pop() + ", " + v);
      } else {
        newItems.push(v);
      }
    }
    return newItems;
  }

  /**
   * Internal recursive stringification method
   * @param {any} obj - The value to stringify
   * @param {string} leftMargin - Current indentation level
   * @param {number} rightMarginSize - Size of right margin (for inline formatting)
   * @returns {string | undefined} The stringified value
   */
  #stringify(obj, leftMargin, rightMarginSize) {
    // 1. Defer to the .toJSON() function if it exists
    if (obj && typeof obj === "object" && "toJSON" in obj) {
      const toJSON = obj.toJSON;
      if (typeof toJSON === "function") {
        const jsonObj = toJSON.call(obj);
        obj = jsonObj;
      }
    }

    // 2. Upgrade Map, Set and ArrayBuffer
    if (obj instanceof Map) {
      obj = Object.fromEntries(obj.entries());
    }
    if (obj instanceof Set) {
      obj = [...obj];
    }
    if (obj instanceof Array) {
      obj = Array.from(obj);
    }

    // 3. Trial JSON & quick escape
    const trialString = JSON.stringify(obj);

    // Quick exit for undefined
    if (trialString === undefined) {
      return trialString;
    }

    if (obj === null) {
      return trialString;
    }

    // Another quick exit if we aren't sorting keys (or if it's a simple object)
    if (!this.#sortKeys || typeof obj !== "object") {
      const available = this.#maxLength - leftMargin.length - rightMarginSize;
      if (trialString.length <= available) {
        const prettified = this.#pad(trialString, this.#padBlocks).trim();

        if (prettified.length <= available) {
          return prettified;
        }
      }
      // fall through the normal path
    }

    if (typeof obj !== "object") {
      return trialString;
    }

    // 4. Objects & Arrays
    const nextIndent = leftMargin + this.#indent;
    let items = [];
    let delimiters;
    let values;

    if (Array.isArray(obj)) {
      values = obj;
      for (const v of values) {
        items.push(
          this.#stringify(v, nextIndent, 2) ?? "null", // Convert undefined to null
        );
      }
      if (this.#denseWrapArrays && this.#containsOnlySimpleValues(values)) {
        items = this.#denseWrap(items, nextIndent);
      }

      delimiters = ["[", "]"];
    } else {
      const objRecord = obj;
      values = Object.values(objRecord);

      let keys = Object.keys(objRecord);
      if (this.#sortKeys) {
        keys = keys.sort((a, b) => this.#keySorter.compare(a, b));
      }

      for (const key of keys) {
        const keyPart = JSON.stringify(key) + ": ";
        const value = this.#stringify(objRecord[key], nextIndent, keyPart.length + 1);
        if (value !== undefined) {
          // undefined values in an object are excluded
          items.push(keyPart + value);
        }
      }

      if (this.#denseWrapObjects && this.#containsOnlySimpleValues(values)) {
        items = this.#denseWrap(items, nextIndent);
      }

      delimiters = ["{", "}"];
    }

    // one line or wrap all the items?
    if (items.length === 0) {
      return delimiters.join("");
    } else if (items.join(", ").length + leftMargin.length + 2 < this.#maxLength) {
      return [
        this.#pad(delimiters[0], this.#padBlocks),
        items.join(", "),
        this.#pad(delimiters[1], this.#padBlocks),
      ].join("");
    } else {
      return [delimiters[0], this.#indent + items.join(",\n" + nextIndent), delimiters[1]].join("\n" + leftMargin);
    }
  }
}

/**
 * KeySorter is a class that sorts keys but ensures certain keys are always first.
 * For example, sorting keys with ['name', 'version'] as priority will result in a json output of:
 *  {
 *    "name": "value",
 *    "version": "value",
 *    "a": "value",
 *    "b": "value"
 *    ...
 *  }
 *
 *  All other keys are sorted alphabetically, but 'name' and 'version' are always at the top.
 */
class PriorityKeySorter {
  /** @type {Map<string, string>} */
  #keys;

  /**
   * Creates a new PriorityKeySorter
   * @param {string[]} [keys=['name', 'value', 'version', 'date', 'errors']] - Keys to prioritize when sorting
   */
  constructor(keys = ["name", "value", "version", "date", "errors"]) {
    // Prefix priority keys with 001, 002, 003, etc so that when sorting they bubble to the top
    this.#keys = new Map();
    for (const [index, key] of keys.entries()) {
      this.#keys.set(key, `   ${index}`.slice(-3) + key);
    }
  }

  /**
   * Compares two keys for sorting, prioritizing configured keys
   * @param {string} a - First key
   * @param {string} b - Second key
   * @returns {number} Comparison result for sorting
   */
  compare(a, b) {
    const aKey = this.#keys.get(a.toLowerCase()) ?? a;
    const bKey = this.#keys.get(b.toLowerCase()) ?? b;
    return aKey.localeCompare(bKey);
  }
}
