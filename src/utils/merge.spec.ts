import { merge } from "./merge";

describe("merge", () => {
  describe("GIVEN a target object and source objects", () => {
    const testCases = [
      {
        name: "WHEN merging flat objects THEN should merge all properties",
        given: {
          target: { a: 1, b: 2 },
          sources: [{ c: 3, d: 4 }],
        },
        expected: { a: 1, b: 2, c: 3, d: 4 },
      },
      {
        name: "WHEN source has properties that override target THEN should override with source values",
        given: {
          target: { a: 1, b: 2 },
          sources: [{ b: 20, c: 3 }],
        },
        expected: { a: 1, b: 20, c: 3 },
      },
      {
        name: "WHEN merging nested objects THEN should recursively merge nested properties",
        given: {
          target: { user: { name: "John", age: 30 } },
          sources: [{ user: { city: "NYC" } }],
        },
        expected: { user: { name: "John", age: 30, city: "NYC" } },
      },
      {
        name: "WHEN source has undefined values and target has values THEN should skip undefined values",
        given: {
          target: { a: 1, b: 2 },
          sources: [{ b: undefined, c: 3 }],
        },
        expected: { a: 1, b: 2, c: 3 },
      },
      {
        name: "WHEN merging arrays by index THEN should merge array elements at same index",
        given: {
          target: { items: [{ id: 1 }, { id: 2 }] },
          sources: [{ items: [{ name: "A" }, { name: "B" }] }],
        },
        expected: {
          items: [
            { id: 1, name: "A" },
            { id: 2, name: "B" },
          ],
        },
      },
      {
        name: "WHEN source array is longer than target THEN should append additional elements",
        given: {
          target: { items: [{ id: 1 }] },
          sources: [{ items: [{ name: "A" }, { name: "B" }, { name: "C" }] }],
        },
        expected: {
          items: [{ id: 1, name: "A" }, { name: "B" }, { name: "C" }],
        },
      },
      {
        name: "WHEN source array contains non-object values THEN should replace corresponding target values",
        given: {
          target: { nums: [1, 2, 3] },
          sources: [{ nums: [10, 20] }],
        },
        expected: { nums: [10, 20, 3] },
      },
      {
        name: "WHEN target has no array and source has array THEN should create array in target",
        given: {
          target: { items: "string" },
          sources: [{ items: [1, 2, 3] }],
        },
        expected: { items: [1, 2, 3] },
      },
      {
        name: "WHEN multiple source objects are provided THEN should merge all sources sequentially",
        given: {
          target: { a: 1 },
          sources: [{ b: 2 }, { c: 3 }, { d: 4 }],
        },
        expected: { a: 1, b: 2, c: 3, d: 4 },
      },
      {
        name: "WHEN later sources override earlier sources THEN should use last source value",
        given: {
          target: { a: 1 },
          sources: [{ a: 2 }, { a: 3 }, { a: 4 }],
        },
        expected: { a: 4 },
      },
      {
        name: "WHEN target is null THEN should create new object",
        given: {
          target: null,
          sources: [{ a: 1 }],
        },
        expected: { a: 1 },
      },
      {
        name: "WHEN target is undefined THEN should create new object",
        given: {
          target: undefined,
          sources: [{ a: 1 }],
        },
        expected: { a: 1 },
      },
      {
        name: "WHEN source is null THEN should skip null source",
        given: {
          target: { a: 1 },
          sources: [null, { b: 2 }],
        },
        expected: { a: 1, b: 2 },
      },
      {
        name: "WHEN source is undefined THEN should skip undefined source",
        given: {
          target: { a: 1 },
          sources: [undefined, { b: 2 }],
        },
        expected: { a: 1, b: 2 },
      },
      {
        name: "WHEN merging empty objects THEN should return target unchanged",
        given: {
          target: { a: 1 },
          sources: [{}],
        },
        expected: { a: 1 },
      },
      {
        name: "WHEN target is empty object THEN should copy source properties",
        given: {
          target: {},
          sources: [{ a: 1, b: 2 }],
        },
        expected: { a: 1, b: 2 },
      },
      {
        name: "WHEN deeply nesting objects THEN should merge at all levels",
        given: {
          target: { level1: { level2: { level3: { a: 1 } } } },
          sources: [{ level1: { level2: { level3: { b: 2 } } } }],
        },
        expected: { level1: { level2: { level3: { a: 1, b: 2 } } } },
      },
      {
        name: "WHEN source has different type for same key THEN should replace with source type",
        given: {
          target: { config: { timeout: 5000 } },
          sources: [{ config: "custom" }],
        },
        expected: { config: "custom" },
      },
      {
        name: "WHEN merging with primitive values THEN should replace target with source primitives",
        given: {
          target: { flag: true, count: 5, name: "old" },
          sources: [{ flag: false, count: 10, name: "new" }],
        },
        expected: { flag: false, count: 10, name: "new" },
      },
      {
        name: "WHEN source has zero values THEN should include zero in merge",
        given: {
          target: { count: 5 },
          sources: [{ count: 0 }],
        },
        expected: { count: 0 },
      },
      {
        name: "WHEN source has false values THEN should include false in merge",
        given: {
          target: { active: true },
          sources: [{ active: false }],
        },
        expected: { active: false },
      },
      {
        name: "WHEN source has empty string THEN should include empty string in merge",
        given: {
          target: { message: "hello" },
          sources: [{ message: "" }],
        },
        expected: { message: "" },
      },
    ];

    testCases.forEach(({ name, given, expected }) => {
      it(name, () => {
        // GIVEN: target and source objects
        const { target, sources } = given;

        // WHEN: calling merge with target and sources
        const result = merge(target, ...sources);

        // THEN: result should match expected output
        expect(result).toEqual(expected);
      });
    });
  });

  describe("GIVEN the merge function behavior", () => {
    it("WHEN merging THEN should modify and return the target object", () => {
      // GIVEN: a target object
      const target = { a: 1 };
      const source = { b: 2 };

      // WHEN: calling merge
      const result = merge(target, source);

      // THEN: result should be the same object reference as target
      expect(result).toBe(target);
      expect(target).toEqual({ a: 1, b: 2 });
    });

    it("WHEN merging objects with numeric keys THEN should handle numeric properties", () => {
      // GIVEN: objects with numeric keys
      const target = { "0": "first", "1": "second" };
      const source = { "1": "updated", "2": "third" };

      // WHEN: merging objects with numeric keys
      const result = merge(target, source);

      // THEN: should merge numeric string keys correctly
      expect(result).toEqual({ "0": "first", "1": "updated", "2": "third" });
    });

    it("WHEN merging arrays with null elements THEN should replace null elements", () => {
      // GIVEN: arrays containing null
      const target = { items: [null, { id: 2 }] };
      const source = { items: [{ id: 1 }, null] };

      // WHEN: merging arrays with null elements
      const result = merge(target, source);

      // THEN: should replace null with merged objects
      expect(result).toEqual({ items: [{ id: 1 }, null] });
    });

    it("WHEN no sources provided THEN should return target unchanged", () => {
      // GIVEN: target object with no sources
      const target = { a: 1, b: 2 };

      // WHEN: calling merge with only target
      const result = merge(target);

      // THEN: should return target unchanged
      expect(result).toEqual({ a: 1, b: 2 });
      expect(result).toBe(target);
    });
  });

  describe("GIVEN special object types", () => {
    it("WHEN source has Date object THEN should replace with Date object", () => {
      // GIVEN: target and source with Date objects
      const target = { timestamp: new Date("2020-01-01") };
      const source = { timestamp: new Date("2025-01-01") };

      // WHEN: merging objects with Date values
      const result = merge(target, source);

      // THEN: should use Date from source
      expect(result.timestamp).toEqual(new Date("2025-01-01"));
    });

    it("WHEN source has array inside nested object THEN should handle array conversion", () => {
      // GIVEN: target with non-array and source with array at same path
      const target = { config: { values: "single" } };
      const source = { config: { values: [1, 2, 3] } };

      // WHEN: merging with array in source
      const result = merge(target, source);

      // THEN: should replace with array from source
      expect(result).toEqual({ config: { values: [1, 2, 3] } });
    });
  });
});
