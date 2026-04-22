/**
 * serve.test.js
 * Unit tests for the static file server (serve.js) with focus on path traversal vulnerability mitigation
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';

// Mock DIST directory for testing
const TEST_DIST = join(tmpdir(), 'test-serve-dist-' + Date.now());
const TEST_PORT = 3456;

// Helper to get extname (since we're testing the logic)
function getExtname(filePath) {
  const match = filePath.match(/\.[^.]+$/);
  return match ? match[0] : '';
}

// Helper to create test server with custom DIST
function createTestServer(distPath) {
  const MIME = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.txt': 'text/plain',
  };

  return createServer(async (req, res) => {
    const url = req.url.split('?')[0];
    const base = resolve(distPath);
    let filePath = resolve(base, url);
    const rel = relative(base, filePath);
    
    // Path traversal protection - this is the security fix being tested
    if (rel.startsWith('..') || resolve(rel) === rel) {
      filePath = join(distPath, 'index.html');
    } else if (!existsSync(filePath) || !getExtname(filePath)) {
      filePath = join(distPath, 'index.html');
    }

    try {
      const data = await readFile(filePath);
      const ext = getExtname(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    } catch {
      try {
        const html = await readFile(join(distPath, 'index.html'));
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    }
  });
}

// Helper to make HTTP request
function makeRequest(port, path) {
  return new Promise((resolve, reject) => {
    const req = require('node:http').request(
      {
        hostname: 'localhost',
        port,
        path,
        method: 'GET',
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ statusCode: res.statusCode, data, headers: res.headers }));
      }
    );
    req.on('error', reject);
    req.end();
  });
}

describe('serve.js - Path Traversal Security', () => {
  let server;

  beforeAll(async () => {
    // Create test directory structure
    await mkdir(TEST_DIST, { recursive: true });
    await mkdir(join(TEST_DIST, 'assets'), { recursive: true });
    
    // Create test files
    await writeFile(join(TEST_DIST, 'index.html'), '<html><body>Index</body></html>');
    await writeFile(join(TEST_DIST, 'test.txt'), 'test content');
    await writeFile(join(TEST_DIST, 'assets', 'style.css'), 'body { color: red; }');
    
    // Create a sensitive file outside DIST (simulating /etc/passwd or similar)
    await writeFile(join(tmpdir(), 'sensitive.txt'), 'SENSITIVE DATA');

    // Start test server
    server = createTestServer(TEST_DIST);
    await new Promise((resolve) => {
      server.listen(TEST_PORT, 'localhost', resolve);
    });
  });

  afterAll(async () => {
    // Cleanup
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await rm(TEST_DIST, { recursive: true, force: true });
    await rm(join(tmpdir(), 'sensitive.txt'), { force: true });
  });

  describe('Normal file serving (baseline)', () => {
    it('should serve index.html for root path', async () => {
      const response = await makeRequest(TEST_PORT, '/');
      expect(response.statusCode).toBe(200);
      expect(response.data).toContain('Index');
      expect(response.headers['content-type']).toBe('text/html');
    });

    it('should fallback to index.html for non-existent paths', async () => {
      // The server falls back to index.html for paths that don't exist
      // or are outside the allowed directory
      const response = await makeRequest(TEST_PORT, '/nonexistent.txt');
      expect(response.statusCode).toBe(200);
      expect(response.data).toContain('Index');
    });
  });

  describe('Path Traversal Attack Prevention', () => {
    it('should block basic path traversal with ../', async () => {
      const response = await makeRequest(TEST_PORT, '/../sensitive.txt');
      expect(response.statusCode).toBe(200);
      expect(response.data).not.toContain('SENSITIVE DATA');
      expect(response.data).toContain('Index'); // Should serve index.html instead
    });

    it('should block multiple levels of path traversal', async () => {
      const response = await makeRequest(TEST_PORT, '/../../sensitive.txt');
      expect(response.statusCode).toBe(200);
      expect(response.data).not.toContain('SENSITIVE DATA');
      expect(response.data).toContain('Index');
    });

    it('should block path traversal with URL encoding (%2e%2e%2f)', async () => {
      const response = await makeRequest(TEST_PORT, '/%2e%2e%2fsensitive.txt');
      expect(response.statusCode).toBe(200);
      expect(response.data).not.toContain('SENSITIVE DATA');
      expect(response.data).toContain('Index');
    });

    it('should block path traversal mixed with valid paths', async () => {
      const response = await makeRequest(TEST_PORT, '/assets/../../sensitive.txt');
      expect(response.statusCode).toBe(200);
      expect(response.data).not.toContain('SENSITIVE DATA');
      expect(response.data).toContain('Index');
    });

    it('should block absolute path attempts', async () => {
      const response = await makeRequest(TEST_PORT, '/tmp/sensitive.txt');
      expect(response.statusCode).toBe(200);
      // Should not serve the absolute path file
      expect(response.data).not.toContain('SENSITIVE DATA');
    });
  });

  describe('Path validation logic', () => {
    it('validates that relative path starting with .. is blocked', () => {
      const base = resolve(TEST_DIST);
      const maliciousPath = resolve(base, '../sensitive.txt');
      const rel = relative(base, maliciousPath);
      
      // This is the security check from serve.js
      const isBlocked = rel.startsWith('..') || resolve(rel) === rel;
      expect(isBlocked).toBe(true);
    });

    it('validates that normal paths are allowed', () => {
      const base = resolve(TEST_DIST);
      const normalPath = resolve(base, 'test.txt');
      const rel = relative(base, normalPath);
      
      const isBlocked = rel.startsWith('..') || resolve(rel) === rel;
      expect(isBlocked).toBe(false);
    });

    it('validates that subdirectory paths are allowed', () => {
      const base = resolve(TEST_DIST);
      const subPath = resolve(base, 'assets/style.css');
      const rel = relative(base, subPath);
      
      const isBlocked = rel.startsWith('..') || resolve(rel) === rel;
      expect(isBlocked).toBe(false);
    });

    it('validates that absolute paths are blocked', () => {
      const base = resolve(TEST_DIST);
      const absolutePath = resolve('/etc/passwd');
      const rel = relative(base, absolutePath);
      
      const isBlocked = rel.startsWith('..') || resolve(rel) === rel;
      expect(isBlocked).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should serve index.html for paths without extension', async () => {
      const response = await makeRequest(TEST_PORT, '/some-route');
      expect(response.statusCode).toBe(200);
      expect(response.data).toContain('Index');
    });

    it('should serve index.html for non-existent files', async () => {
      const response = await makeRequest(TEST_PORT, '/nonexistent.html');
      expect(response.statusCode).toBe(200);
      expect(response.data).toContain('Index');
    });
  });
});
