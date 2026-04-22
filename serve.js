import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, resolve, relative } from 'node:path';
import { existsSync } from 'node:fs';

const PORT = parseInt(process.env.PORT || '3000', 10);
const DIST = join(process.cwd(), 'dist');

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
  '.txt': 'text/plain',
};

const server = createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  const base = resolve(DIST);
  let filePath = resolve(base, url);
  const rel = relative(base, filePath);
  if (rel.startsWith('..') || resolve(rel) === rel) {
    filePath = join(DIST, 'index.html');
  } else if (!existsSync(filePath) || !extname(filePath)) {
    filePath = join(DIST, 'index.html');
  }

  try {
    const data = await readFile(filePath);
    const ext = extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  } catch {
    const html = await readFile(join(DIST, 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Serving dist on port ${PORT}`);
});
