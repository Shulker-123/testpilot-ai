/**
 * TestPilot Backend REST API Server
 * Express-compatible server with Pino structured logging & health checks
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
    const startTime = Date.now();

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
        logger.info({ durationMs: Date.now() - startTime, status: 200 }, 'Health check passed');
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
