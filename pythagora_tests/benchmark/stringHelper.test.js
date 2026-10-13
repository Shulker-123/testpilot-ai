describe("String Helper Benchmarks", () => {
    const { cutWithDots, insertVariablesInText } = require('../../src/utils/common.js');

    test("cutWithDots handles long strings correctly", () => {
        expect(cutWithDots("TestPilot automated testing engine for JavaScript", 15)).toBe("TestPilot autom...");
    });

    test("cutWithDots handles edge boundary limits", () => {
        expect(cutWithDots("exact", 5)).toBe("exact");
        expect(cutWithDots("", 10)).toBe("");
    });

    test("insertVariablesInText injects dynamic variables", () => {
        const text = "Hello {{name}}, welcome to {{project}}!";
        const vars = { name: "Developer", project: "TestPilot" };
        expect(insertVariablesInText(text, vars)).toBe("Hello Developer, welcome to TestPilot!");
    });

    test("insertVariablesInText returns string unchanged if no variables", () => {
        expect(insertVariablesInText("static string", {})).toBe("static string");
    });
});
