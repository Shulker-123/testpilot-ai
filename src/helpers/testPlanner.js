/**
 * TestPlanner: Two-Stage AI Test Planning Engine
 * Deduces execution branches, boundary conditions, and invalid inputs
 * before generating code.
 */
class TestPlanner {
    constructor(apiInstance) {
        this.api = apiInstance;
    }

    /**
     * Synthesizes an abstract test plan from AST function context
     * @param {Object} functionContext 
     * @returns {Promise<Object>}
     */
    async planScenarios(functionContext) {
        const { functionName, functionCode, dependencies } = functionContext;

        const planPrompt = `Analyze the following JavaScript function and create a comprehensive unit test plan.
Function Name: ${functionName}
Source Code:
\`\`\`javascript
${functionCode}
\`\`\`
${dependencies ? `Dependencies: ${JSON.stringify(dependencies)}` : ''}

Provide a structured test plan covering:
1. Normal Happy Path Cases (standard valid inputs)
2. Boundary Cases (min/max limits, array bounds, 0, 1)
3. Invalid Inputs (type mismatches, null, undefined, NaN)
4. Exception & Error Handling Cases (unexpected state, thrown errors)
5. Mocking Requirements (databases, HTTP network calls)

Format the response as bulleted test scenarios with expected outcomes.`;

        const rawPlan = await this.api.callGeminiWithFallback(planPrompt);
        return {
            functionName,
            plan: rawPlan,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = TestPlanner;
