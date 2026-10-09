const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const logger = require('./utils/logger');
const { getApiInstance } = require('./helpers/api');

const PORT = process.env.PORT || 3000;

/**
 * Standalone Express-compatible REST API Server for TestPilot
 */
function createServer() {
    const server = http.createServer(async (req, res) => {
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = parsedUrl.pathname;

        // Parse JSON Body for POST requests
        let body = {};
        if (req.method === 'POST') {
            try {
                const rawBody = await new Promise((resolve, reject) => {
                    let data = '';
                    req.on('data', chunk => data += chunk);
                    req.on('end', () => resolve(data));
                    req.on('error', reject);
                });
                if (rawBody) body = JSON.parse(rawBody);
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
                return;
            }
        }

        const json = (data, statusCode = 200) => {
            res.writeHead(statusCode, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
        };

        logger.info(`Incoming ${req.method} request to ${pathname}`);

        // Route: Health Check
        if (pathname === '/health' || pathname === '/api/health') {
            return json({
                status: 'healthy',
                service: 'TestPilot Backend Core',
                version: '1.0.0',
                uptime: process.uptime(),
                timestamp: new Date().toISOString()
            });
        }

        // Route: AST Source Code Analysis
        if (pathname === '/api/code/analyze' && req.method === 'POST') {
            const { filePath, functionName } = body;
            if (!filePath) {
                return json({ error: 'filePath parameter is required' }, 400);
            }

            try {
                const fullPath = path.resolve(filePath);
                if (!fs.existsSync(fullPath)) {
                    return json({ error: `File not found: ${filePath}` }, 404);
                }

                const content = fs.readFileSync(fullPath, 'utf8');
                return json({
                    success: true,
                    filePath: fullPath,
                    targetFunction: functionName || 'all',
                    length: content.length,
                    analysis: {
                        exportsFound: (content.match(/module\.exports|export\s+/g) || []).length,
                        hasAsync: content.includes('async '),
                        hasExceptions: content.includes('throw ')
                    }
                });
            } catch (e) {
                logger.error('AST Analysis error', { error: e.message });
                return json({ error: e.message }, 500);
            }
        }

        // Route: Generate Unit Tests
        if (pathname === '/api/test/generate' && req.method === 'POST') {
            const { filePath, functionName } = body;
            if (!filePath) {
                return json({ error: 'filePath parameter is required' }, 400);
            }

            try {
                const fullPath = path.resolve(filePath);
                const code = fs.readFileSync(fullPath, 'utf8');
                const api = getApiInstance();

                const { tests, error } = await api.getUnitTests({
                    functionName: functionName || 'exportedModule',
                    functionCode: code,
                    pathRelativeToTest: path.relative(path.dirname(fullPath), fullPath),
                    exportedAsObject: true,
                    isES6Syntax: false,
                    relatedCode: []
                });

                if (error) {
                    return json({ error: error.message }, 500);
                }

                return json({
                    success: true,
                    functionName,
                    testCode: tests
                });
            } catch (e) {
                logger.error('Generate Test error', { error: e.message });
                return json({ error: e.message }, 500);
            }
        }

        // Route: Execute Jest Unit Tests
        if (pathname === '/api/test/run' && req.method === 'POST') {
            const { testPath } = body;
            const target = testPath || './pythagora_tests/';

            const jestProcess = spawn('npx', ['jest', target, '--coverage', '--json'], { shell: true });
            let stdout = '';
            let stderr = '';

            jestProcess.stdout.on('data', d => stdout += d.toString());
            jestProcess.stderr.on('data', d => stderr += d.toString());

            jestProcess.on('close', code => {
                logger.info(`Jest execution completed with exit code ${code}`);
                return json({
                    success: code === 0,
                    exitCode: code,
                    output: stdout,
                    errors: stderr
                });
            });
            return;
        }

        // 404 Route
        json({ error: 'Endpoint not found' }, 404);
    });

    return server;
}

if (require.main === module) {
    const server = createServer();
    server.listen(PORT, () => {
        logger.info(`TestPilot Backend Server listening on port ${PORT}`);
    });
}

module.exports = { createServer };
