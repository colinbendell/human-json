import { describe, expect, it, test } from "bun:test";
import HumanJSON from "../src/index.js";

describe.concurrent("HumanJSON.stringify", () => {
  describe.concurrent("basic types", () => {
    const tests = [
      { input: null, expected: "null\n" },
      { input: undefined, expected: "\n" },
      { input: "hello", expected: '"hello"\n' },
      { input: 42, expected: "42\n" },
      { input: true, expected: "true\n" },
      { input: false, expected: "false\n" },
      { input: new Date(1431561600000), expected: '"2015-05-14T00:00:00.000Z"\n' },
      { input: {}, expected: "{}\n" },
      { input: [], expected: "[]\n" },
      { input: [1, 2, 3], expected: "[ 1, 2, 3 ]\n" },
      {
        input: ["a", 1, 12.34, true, false, null, undefined],
        expected: '[ "a", 1, 12.34, true, false, null, null ]\n',
      },
      { input: { a: 1 }, expected: '{ "a": 1 }\n' },
      {
        input: { a: "z", b: 1, c: 12.24, d: true, e: false, f: null, g: undefined },
        expected: '{ "a": "z", "b": 1, "c": 12.24, "d": true, "e": false, "f": null }\n',
      },
    ];

    for (const item of tests) {
      test(`stringifies ${JSON.stringify(item.input)}`, () => {
        expect(HumanJSON.stringify(item.input)).toBe(item.expected);
      });
    }
  });

  describe.concurrent("arrays", () => {
    const tests = [
      { input: [], expected: "[]\n" },
      {
        input: ["a", 1, 12.34, true, false, null, undefined],
        expected: `[
  "a", 1,
  12.34,
  true,
  false,
  null,
  null
]
`,
      },
      {
        input: [1, 2, 3, 4, 5, 6, 7],
        expected: `[
  1, 2, 3,
  4, 5, 6,
  7
]
`,
      },
      {
        input: [1, 2, 3, 4, {}],
        expected: `[
  1,
  2,
  3,
  4,
  {}
]
`,
      },
    ];

    for (const item of tests) {
      test(`stringifies ${JSON.stringify(item.input)}`, () => {
        expect(HumanJSON.stringify(item.input, 2, 10)).toBe(item.expected);
      });
    }
  });

  describe.concurrent("objects", () => {
    const tests = [
      { input: {}, expected: "{}\n" },
      { input: { a: 1 }, expected: '{ "a": 1 }\n' },
      // dense wrapping
      {
        input: { a: "z", b: 1, c: 12.24, d: true, e: false, f: null, g: undefined },
        expected: `{
  "a": "z",
  "b": 1,
  "c": 12.24,
  "d": true,
  "e": false,
  "f": null
}
`,
      },
      {
        input: { a: "z", b: 1, c: 12.24, d: true, e: false, f: null, g: undefined, h: { i: 1, j: 2 } },
        expected: `{
  "a": "z",
  "b": 1,
  "c": 12.24,
  "d": true,
  "e": false,
  "f": null,
  "h": {
    "i": 1,
    "j": 2
  }
}
`,
      },
    ];

    for (const item of tests) {
      test(`stringifies ${JSON.stringify(item.input)}`, () => {
        expect(HumanJSON.stringify(item.input, 2, 10)).toBe(item.expected);
      });
    }

    it("prioritizes specified keys", () => {
      const obj = { z: 1, name: "test", version: "1.0", a: 2 };
      const result = HumanJSON.stringify(obj, 2, 30, {
        sortKeys: true,
        sortPriorityKeys: ["name", "version"],
        denseWrapping: false,
      }); // Force wrapping
      expect(result).toBe(
        `{
  "name": "test",
  "version": "1.0",
  "a": 2,
  "z": 1
}
`,
      );
    });

    it("excludes undefined values from objects", () => {
      const obj = { a: 1, b: undefined, c: 3 };
      const result = HumanJSON.stringify(obj);
      expect(result).not.toContain('"b"');
      expect(result).toContain('"a"');
      expect(result).toContain('"c"');
    });
  });

  describe("indentation", () => {
    it("indents with 2 spaces by default", () => {
      const obj = { a: { b: { c: 1 } } };
      const result = HumanJSON.stringify(obj, 2, 10);
      expect(result).toBe(`{
  "a": {
    "b": {
      "c": 1
    }
  }
}
`);
    });

    it("indents with custom spaces", () => {
      const obj = { a: { b: { c: 1 } } };
      const result = HumanJSON.stringify(obj, 4, 10);
      expect(result).toBe(`{
    "a": {
        "b": {
            "c": 1
        }
    }
}
`);
    });

    it("handles zero indentation", () => {
      const obj = { a: 1, b: 2, c: 3, d: 4, e: 5 };
      const result = HumanJSON.stringify(obj, 0, 10);
      expect(result).toBe('{ "a": 1, "b": 2, "c": 3, "d": 4, "e": 5 }\n');
    });
  });

  describe("line length", () => {
    it("respects max line length", () => {
      const obj = { a: 1, b: 2, c: 3, d: 4, e: 5 };
      const result = HumanJSON.stringify(obj, 2, 10);
      const lines = result.split("\n");
      for (const line of lines) {
        expect(line.length).toBeLessThanOrEqual(10); // Some buffer for wrapping
      }
    });
  });

  describe("options", () => {
    describe("sortKeys", () => {
      it("sorts keys when enabled", () => {
        const obj = { z: 1, a: 2 };
        const result = HumanJSON.stringify(obj, 2, 15, { sortKeys: true });
        expect(result).toContain('"a"');
        expect(result).toContain('"z"');
        expect(result.indexOf('"a"')).toBeLessThan(result.indexOf('"z"'));
      });

      it("does not sort keys when disabled", () => {
        const obj = { z: 1, a: 2 };
        const result = HumanJSON.stringify(obj, 2, 80, { sortKeys: false });
        expect(result).toContain("z");
        expect(result).toContain("a");
      });
    });

    describe("sortPriorityKeys", () => {
      it("uses no priority keys", () => {
        const obj = { z: 1, custom: "first", a: 2 };
        const result = HumanJSON.stringify(obj, 2, 80, {
          sortKeys: true,
          sortPriorityKeys: [],
        });
        expect(result).toBe('{ "a": 2, "custom": "first", "z": 1 }\n');
      });

      it("handles multiple priority keys in order", () => {
        const obj = { z: 1, second: 2, first: 1, a: 3 };
        const result = HumanJSON.stringify(obj, 2, 80, {
          sortKeys: true,
          sortPriorityKeys: ["first", "second"],
        });
        expect(result).toBe('{ "first": 1, "second": 2, "a": 3, "z": 1 }\n');
      });
    });

    describe("padBlocks", () => {
      it("adds padding when enabled", () => {
        const obj = { a: 1 };
        const result = HumanJSON.stringify(obj, 2, 80, { padBlocks: true });
        expect(result).toBe('{ "a": 1 }\n');
      });

      it("removes padding when disabled", () => {
        const obj = { a: 1 };
        const result = HumanJSON.stringify(obj, 2, 80, { padBlocks: false });
        expect(result).toBe('{"a": 1}\n');
      });
    });

    describe("appendNewLine", () => {
      it("appends newline when enabled", () => {
        const result = HumanJSON.stringify({ a: 1 }, 2, 80, {
          appendNewLine: true,
        });
        expect(result.endsWith("\n")).toBe(true);
      });

      it("does not append newline when disabled", () => {
        const result = HumanJSON.stringify({ a: 1 }, 2, 80, {
          appendNewLine: false,
        });
        expect(result.endsWith("\n")).toBe(false);
      });
    });
  });

  describe("special types", () => {
    it("converts Map to object", () => {
      const map = new Map([
        ["a", 1],
        ["b", 2],
      ]);
      const result = HumanJSON.stringify(map);
      expect(result).toBe('{ "a": 1, "b": 2 }\n');
    });

    it("converts Set to array", () => {
      const set = new Set([4, 2, 3]);
      const result = HumanJSON.stringify(set);
      expect(result).toBe("[ 4, 2, 3 ]\n");
    });

    it("handles objects with toJSON method", () => {
      const obj = {
        toJSON() {
          return { custom: "value" };
        },
      };
      const result = HumanJSON.stringify(obj);
      expect(result).toBe('{ "custom": "value" }\n');
    });
  });

  describe("nested structures", () => {
    it("handles deeply nested objects", () => {
      const nested = {
        level1: {
          level2: {
            level3: {
              value: "deep",
            },
          },
        },
      };
      const result = HumanJSON.stringify(nested);
      expect(result).toBe('{ "level1": { "level2": { "level3": { "value": "deep" } } } }\n');
    });

    it("handles mixed nested arrays and objects", () => {
      const mixed = {
        array: [{ a: 1 }, { b: 2 }],
        object: { nested: [1, 2, 3] },
      };
      const result = HumanJSON.stringify(mixed);
      expect(result).toBe('{ "array": [ { "a": 1 }, { "b": 2 } ], "object": { "nested": [ 1, 2, 3 ] } }\n');
    });
  });

  describe("real-world examples", () => {
    it("formats package.json-like structure", () => {
      const pkg = {
        dependencies: {
          typescript: "^5.0.0",
          prettier: "^3.0.0",
        },
        scripts: {
          build: "tsc",
          test: "bun test",
        },
        name: "my-package",
        version: "1.0.0",
      };
      const result = HumanJSON.stringify(pkg);
      expect(result).toBe(`{
  "name": "my-package",
  "version": "1.0.0",
  "dependencies": { "prettier": "^3.0.0", "typescript": "^5.0.0" },
  "scripts": { "build": "tsc", "test": "bun test" }
}
`);
    });

    it("formats API response-like structure", () => {
      const response = {
        data: [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
        ],
        meta: {
          total: 2,
          page: 1,
        },
      };
      const result = HumanJSON.stringify(response);
      expect(result).toBe(
        `{ "data": [ { "name": "Alice", "id": 1 }, { "name": "Bob", "id": 2 } ], "meta": { "page": 1, "total": 2 } }\n`,
      );
    });

    it("formats configuration object", () => {
      const config = {
        env: "production",
        port: 3000,
        database: {
          host: "localhost",
          port: 5432,
          name: "mydb",
        },
        features: {
          auth: true,
          logging: true,
          metrics: false,
        },
      };
      const result = HumanJSON.stringify(config, 2, 80, {
        sortPriorityKeys: ["env", "port"],
      });
      expect(result).toBe(`{
  "env": "production",
  "port": 3000,
  "database": { "port": 5432, "host": "localhost", "name": "mydb" },
  "features": { "auth": true, "logging": true, "metrics": false }
}
`);
    });
  });
});
