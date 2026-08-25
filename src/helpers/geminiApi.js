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

Requirements:
1. Import the function properly from "${data.pathRelativeToTest}".
2. Use Jest syntax (describe, test/it, expect).
3. Cover:
   - Happy paths and typical valid inputs
   - Boundary values and limits
   - Edge cases: null, undefined, empty strings/arrays/objects, unexpected types, NaN
   - Exception handling and error branches
4. Mock any required external modules (like MongoDB or network calls) if they are invoked.
5. Return ONLY executable JavaScript code for the test file. DO NOT include any markdown backticks, conversational preamble, explanations, or commentary.`;

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
