/**
 * FailureDiagnosis: AI-assisted stack trace and failure root-cause analyzer
 */
class FailureDiagnosis {
    constructor(apiInstance) {
        this.api = apiInstance;
    }

    /**
     * Diagnoses why a unit test failed and suggests remediation
     * @param {Object} params
     * @returns {Promise<Object>}
     */
    async diagnoseFailure({ testCode, implementationCode, errorDiff, stackTrace }) {
        const prompt = `You are an automated software test debugging expert.
A Jest unit test failed with the following details:

Failed Test Code:
\`\`\`javascript
${testCode}
\`\`\`

Target Function Implementation:
\`\`\`javascript
${implementationCode}
\`\`\`

Error / Difference:
${errorDiff}

Stack Trace:
${stackTrace}

Analyze the failure and answer:
1. Why did the test fail?
2. Is the issue a bug in the source code implementation OR a faulty test assertion?
3. What exact change resolves this issue?
4. Suggest the corrected test assertion or implementation fix.`;

        const explanation = await this.api.callGeminiWithFallback(prompt);
        return {
            diagnosis: explanation,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = FailureDiagnosis;
