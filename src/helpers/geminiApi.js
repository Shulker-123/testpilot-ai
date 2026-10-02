const https = require('https');

const FALLBACK_MODELS = [
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-2.5-flash-lite',
    'gemini-3.1-flash-lite'
];

class GeminiAPI {
    constructor(apiKey, model = 'gemini-2.5-flash') {
        this.apiKey = apiKey;
        this.model = model;
    }

    async callModel(modelName, prompt, customLogFunction) {
        return new Promise((resolve, reject) => {
            const payload = JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2
                }
            });

            const req = https.request({
                hostname: 'generativelanguage.googleapis.com',
                path: `/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload)
                }
            }, (res) => {
                let body = '';
                res.on('data', chunk => {
                    body += chunk;
                    if (customLogFunction) customLogFunction(chunk.toString());
                });
                res.on('end', () => {
                    if (res.statusCode >= 400) {
                        return reject(new Error(`Gemini API Error ${res.statusCode}: ${body}`));
                    }
                    try {
                        const json = JSON.parse(body);
                        if (!json.candidates || !json.candidates[0] || !json.candidates[0].content) {
                            return reject(new Error('Invalid Gemini API response format: ' + body));
                        }
                        const text = json.candidates[0].content.parts[0].text;
                        resolve(text);
                    } catch (err) {
                        reject(err);
                    }
                });
            });

            req.on('error', reject);
            req.write(payload);
            req.end();
        });
    }

    async callGeminiWithFallback(prompt, customLogFunction) {
        const models = [this.model, ...FALLBACK_MODELS.filter(m => m !== this.model)];
        let lastError = null;

        for (const model of models) {
            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    return await this.callModel(model, prompt, customLogFunction);
                } catch (err) {
                    lastError = err;
                    if (err.message.includes('503') || err.message.includes('429')) {
                        await new Promise(r => setTimeout(r, 1000 * attempt));
                        continue;
                    }
                    break;
                }
            }
        }
        throw lastError;
    }

    cleanCode(raw) {
        let code = raw.trim();
        if (code.startsWith('```javascript')) {
            code = code.slice('```javascript'.length);
        } else if (code.startsWith('```js')) {
            code = code.slice('```js'.length);
        } else if (code.startsWith('```')) {
            code = code.slice('```'.length);
        }
        if (code.endsWith('```')) {
            code = code.slice(0, -3);
        }
        return code.trim();
    }

    async getUnitTests(data, customLogFunction) {
        try {
            const prompt = `You are an expert automated unit test generator for JavaScript projects using Jest.
Write comprehensive, production-quality Jest unit tests for the following target function.

Target Function Name: ${data.functionName}
Target Relative Import Path for Test: ${data.pathRelativeToTest}
Exported as Object: ${data.exportedAsObject}
Is ES6 Syntax: ${data.isES6Syntax}

Target Function Code:
\`\`\`javascript
${data.functionCode}
\`\`\`

${data.relatedCode && data.relatedCode.length > 0 ? `Related Helper Functions:
\`\`\`javascript
${data.relatedCode.map(r => r.code).join('\n')}
\`\`\`
` : ''}

Write comprehensive, production-quality Jest unit tests for the following target function.

Target Function Name: ${data.functionName}
Target Relative Import Path for Test: ${data.pathRelativeToTest}
Exported as Object: ${data.exportedAsObject}
Is ES6 Syntax: ${data.isES6Syntax}

Target Function Code:
```javascript
${data.functionCode}
```

${data.relatedCode && data.relatedCode.length > 0 ? `Related Helper Functions:
```javascript
${data.relatedCode.map(r => r.code).join('\n')}
```
` : ''}
${data.testPlan ? `Target Test Scenarios (from AI Test Planner):
${data.testPlan.map(s => `- [${s.category.toUpperCase()}] ${s.description} -> Expected: ${s.expectedResult}`).join('\n')}
` : ''}

Prompt Engineering Rules & Testing Directives:
1. Module Import: Correctly import or require the target module from "${data.pathRelativeToTest}".
2. Test Framework Compatibility: Target Jest syntax (describe, test/it, expect) with Vitest compatibility.
3. Boundary & Edge Case Synthesis:
   - Numerical limits: Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 0, -1, NaN, Infinity.
   - String & Collection limits: empty strings, multiline strings, empty arrays [], nested arrays, empty objects {}.
   - Invalid & Nullish types: null, undefined, boolean in place of string/number.
4. Asynchronous & Exception Handling:
   - For async functions returning Promises: test resolution with 'await expect(...).resolves...' and rejection with 'await expect(...).rejects.toThrow()'.
   - For synchronous functions throwing errors: assert 'expect(() => func(...)).toThrow()'.
5. Automated Mocking & Isolation:
   - Synthesize mocks using jest.mock(...) or jest.fn() for any external modules (filesystem fs/promises, HTTP axios/fetch, database clients).
   - Ensure tests are completely isolated, deterministic, and execute without live network/database side effects.
6. Return Format: Return ONLY valid, executable JavaScript test code. No Markdown markdown backticks, no conversational text.`;

            const rawResponse = await this.callGeminiWithFallback(prompt, customLogFunction);
            const cleaned = this.cleanCode(rawResponse);
            return { tests: cleaned, error: null };
        } catch (error) {
            console.error('Gemini test generation error:', error.message);
            return { tests: null, error };
        }
    }

    async expandUnitTests(data, customLogFunction) {
        try {
            const prompt = `You are an expert automated unit test generator for Jest.
Expand the following existing test suite to add more tests, covering missing edge cases, boundary conditions, and untested branches.

Existing Test File / Code:
\`\`\`javascript
${data.testCode || JSON.stringify(data)}
\`\`\`

Return ONLY the complete updated/expanded executable JavaScript test file. Do not include markdown backticks or explanations.`;

            const rawResponse = await this.callGeminiWithFallback(prompt, customLogFunction);
            const cleaned = this.cleanCode(rawResponse);
            return { tests: cleaned, error: null };
        } catch (error) {
            return { tests: null, error };
        }
    }
}

module.exports = GeminiAPI;
