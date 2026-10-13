describe("Metadata & Numeric Calculation Benchmarks", () => {
    const { getOccurrenceInArray, noUndefined } = require('../../src/utils/common.js');

    test("getOccurrenceInArray counts exact frequencies", () => {
        expect(getOccurrenceInArray([1, 2, 2, 3, 2, 4], 2)).toBe(3);
        expect(getOccurrenceInArray([], 5)).toBe(0);
    });

    test("noUndefined sanitizes undefined values in objects", () => {
        const obj = { a: 1, b: undefined, c: "test" };
        const cleaned = noUndefined(obj);
        expect(cleaned.b).toBeUndefined();
        expect(cleaned.a).toBe(1);
    });
});
