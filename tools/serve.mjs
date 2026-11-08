/* Apró statikus kiszolgáló fejlesztéshez és a tesztekhez.
   Csak a Node beépített moduljait használja — nincs telepítendő csomag.
   Használható önállóan (`node tools/serve.mjs 4321 .`) és importálva is. */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

export function startServer(port = 4321, rootDir = '.') {
  const root = resolve(rootDir);

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      let rel = decodeURIComponent(url.pathname);
      if (rel.endsWith('/')) rel += 'index.html';
      const file = join(root, normalize(rel).replace(/^(\.\.[/\\])+/, ''));
      if (!file.startsWith(root)) { res.writeHead(403).end('Forbidden'); return; }

      const info = await stat(file);
      const target = info.isDirectory() ? join(file, 'index.html') : file;
      const body = await readFile(target);
      res.writeHead(200, {
        'content-type': TYPES[extname(target)] || 'application/octet-stream',
        'cache-control': 'no-store'
      });
      res.end(body);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
    }
  });

  return new Promise((done) => {
    server.listen(port, '127.0.0.1', () => done(server));
  });
}

/* önállóan indítva kiszolgál, importálva csak a startServer-t adja */
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const port = Number(process.argv[2] || 4321);
  await startServer(port, process.argv[3] || '.');
  console.log(`FORGE itt fut: http://127.0.0.1:${port}`);
}
