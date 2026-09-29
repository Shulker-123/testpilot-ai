/**
 * TestPilot Backend REST API Server
 * Added /api/code/analyze endpoint for AST dependency and function extraction
 */

const http = require('http');
const url = require('url');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 4000;

function parseBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                resolve({});
            }
        });
    });
}

function analyzeCode(sourceCode) {
    const functions = [];
    const imports = [];
    const lines = sourceCode.split('\n');

    const funcRegex = /(?:function\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>)/g;
    let match;
    while ((match = funcRegex.exec(sourceCode)) !== null) {
        functions.push({
            name: match[1] || match[2],
            index: match.index
        });
    }

    const importRegex = /(?:import\s+.*?from\s+['"](.*?)['"]|require\(['"](.*?)['"]\))/g;
    while ((match = importRegex.exec(sourceCode)) !== null) {
        imports.push(match[1] || match[2]);
    }

    return {
        totalLines: lines.length,
        functionsFound: functions.map(f => f.name),
        dependencies: Array.from(new Set(imports))
    };
}

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    logger.info({ method: req.method, path: pathname }, 'Incoming request');

    if (pathname === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            service: 'testpilot-backend',
            version: '1.0.0',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        }));
        return;
    }

    if (pathname === '/api/code/analyze' && req.method === 'POST') {
        const body = await parseBody(req);
        if (!body.code) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Field "code" is required' }));
            return;
        }

        const analysis = analyzeCode(body.code);
        logger.info({ functions: analysis.functionsFound.length, deps: analysis.dependencies.length }, 'Code analyzed');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: analysis }));
        return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found', path: pathname }));
});

if (require.main === module) {
    server.listen(PORT, () => {
        logger.info({ port: PORT }, `TestPilot REST API listening on port ${PORT}`);
    });
}

module.exports = server;
