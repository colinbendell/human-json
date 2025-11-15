/**
 * @typedef {Object} HumanJSONOptions
 * @property {boolean} [sortKeys=true] - Whether to sort object keys alphabetically
 * @property {string[]} [firstKeys=['name', 'id', 'value', 'version', 'date', 'errors']] - Keys to prioritize at the top when sorting
 * @property {'none' | 'array' | 'object' | 'all'} [fill='array'] - Whether to fill wrap simple values on the same line
 * @property {'none' | 'array' | 'object' | 'all'} [spacing='object'] - Whether to add padding around brackets and braces (arrays, and objects)
 * @property {boolean} [appendNewLine=true] - Whether to append a newline at the end
 */

/**
 * HumanJSON.stringify is 1:1 replacement for JSON.stringify. This class provides human-readable JSON stringification by fill wrapping blocks and sorting keys.
 */
export class HumanJSON {
  /** @type {string} */
  #indent;
  /** @type {'none' | 'array' | 'object' | 'all'} */
  #spacing;
  /** @type {number} */
  #maxLength;
  /** @type {'none' | 'array' | 'object' | 'all'} */
  #fill;
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
    {
      sortKeys = true,
      firstKeys = ["name", "id", "value", "version", "date", "errors"],
      fill = "array",
      spacing = "object",
      appendNewLine = true,
    } = {},
  ) {
    this.#indent = " ".repeat(indentSpaces);
    this.#spacing = spacing ?? "object";
    this.#maxLength = this.#indent === "" ? Infinity : maxLineLength || 120;
    this.#fill = fill ?? "array";
    this.#keySorter = new PriorityKeySorter(firstKeys ?? ["name", "id", "value", "version", "date", "errors"]);
    this.#sortKeys = Boolean(sortKeys ?? true);
    this.#appendNewLine = Boolean(appendNewLine ?? true);
  }

  /**
   * Converts a JavaScript value to a human-readable JSON string
   *
   * simply change `JSON.stringify(obj)` --> `HumanJSON.stringify(obj)`
   *
   * Special consideration is made so that you can also support the standard Javascript stringify signature
   * `JSON.stringify(obj, null, 2)` --> `HumanJSON.stringify(obj, null, 2)`
   *
   * @param {any} obj - The value to stringify
   * @param {number | null} [indentSpaces=2] - Number of spaces for indentation. Support null for backward compat with JSON.stringify(obj, null, 2). Does not suport legacy function | number[] | string[]
   * @param {number} [maxLineLength=120] - Maximum line length before wrapping
   * @param {HumanJSONOptions} [options] - Formatting options
   * @returns {string} The formatted JSON string
   */
  static stringify(obj, indentSpaces = 2, maxLineLength = 120, options = {}) {
    // special case to have backward compatibility with the standard Javascript stringify signature
    // check that the maxLineLength is < 10 and indentSpaces is null
    // eg: JSON.stringify(obj, null, 2). If so, then indent = maxLineLength
    if (indentSpaces === null || typeof indentSpaces === "function" || Array.isArray(indentSpaces)) {
      if (maxLineLength < 10) {
        indentSpaces = maxLineLength;
        maxLineLength = 120;
      } else {
        indentSpaces = 2;
      }
    }
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
  static #STRING_OR_JSON_TOKENS = /("(?:[^\\"]|\\.)*")|[:,]|[}{]|[\][]/g;
  /** @type {RegExp} */
  static #STRING_OR_MINOR_JSON_TOKENS = /("(?:[^\\"]|\\.)*")|[:,]/g;
  static #STRING_OR_MINOR_JSON_TOKENS_ARRAY = /("(?:[^\\"]|\\.)*")|[:,]|[\][]/g;
  static #STRING_OR_MINOR_JSON_TOKENS_OBJECT = /("(?:[^\\"]|\\.)*")|[:,]|[}{]/g;
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
   * @param {'none' | 'array' | 'object' | 'all'} padBlocks - Whether to pad block delimiters
   * @returns {string} The padded string
   */
  #pad(string, padBlocks) {
    let regex = HumanJSON.#STRING_OR_MINOR_JSON_TOKENS;
    if (padBlocks === "all") regex = HumanJSON.#STRING_OR_JSON_TOKENS;
    if (padBlocks === "array") regex = HumanJSON.#STRING_OR_MINOR_JSON_TOKENS_ARRAY;
    if (padBlocks === "object") regex = HumanJSON.#STRING_OR_MINOR_JSON_TOKENS_OBJECT;

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
   * Fill and wrap a line when all the values are simple / primitive types (string, number, boolean, null)
   * @param {string[]} items - Array of stringified items
   * @param {string} nextIndent - The indentation string for the next level
   * @returns {string[]} Array of items, potentially combined on lines
   */
  #fillWrap(items, nextIndent) {
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
        const prettified = this.#pad(trialString, this.#spacing).trim();

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
      if (["array", "all"].includes(this.#fill) && this.#containsOnlySimpleValues(values)) {
        items = this.#fillWrap(items, nextIndent);
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

      if (["object", "all"].includes(this.#fill) && this.#containsOnlySimpleValues(values)) {
        items = this.#fillWrap(items, nextIndent);
      }

      delimiters = ["{", "}"];
    }

    // one line or wrap all the items?
    if (items.length === 0) {
      return delimiters.join("");
    } else if (items.join(", ").length + leftMargin.length + 2 < this.#maxLength) {
      return [this.#pad(delimiters[0], this.#spacing), items.join(", "), this.#pad(delimiters[1], this.#spacing)].join(
        "",
      );
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
  #sortedKeys = new Map();

  /**
   * Creates a new PriorityKeySorter
   * @param {string[]} [firstKeys=['name', 'value', 'version', 'date', 'errors']] - Keys to prioritize when sorting
   */
  constructor(firstKeys = ["name", "value", "version", "date", "errors"]) {
    // Prefix priority keys with 001, 002, 003, etc so that when sorting they bubble to the top
    for (const [index, key] of firstKeys.entries()) {
      this.#sortedKeys.set(key, `   ${index}`.slice(-3) + key);
    }
  }

  /**
   * Compares two keys for sorting, prioritizing configured keys
   * @param {string} a - First key
   * @param {string} b - Second key
   * @returns {number} Comparison result for sorting
   */
  compare(a, b) {
    const aKey = this.#sortedKeys.get(a.toLowerCase()) ?? a;
    const bKey = this.#sortedKeys.get(b.toLowerCase()) ?? b;
    return aKey.localeCompare(bKey);
  }
}
