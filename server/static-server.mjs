import { createReadStream, promises as fs } from 'fs';
import { createServer } from 'http';
import { extname, isAbsolute, join, normalize, relative, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(__dirname, '..');
const distDir = resolve(root, 'dist');
const host = process.env.HOST || '127.0.0.1';

function readPort(value) {
  const rawValue = value || '8081';
  if (!/^\d+$/.test(rawValue)) {
    console.error(`Invalid PORT "${rawValue}". Use a number from 1 to 65535.`);
    process.exit(1);
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (parsed < 1 || parsed > 65535) {
    console.error(`Invalid PORT "${rawValue}". Use a number from 1 to 65535.`);
    process.exit(1);
  }

  return parsed;
}

const port = readPort(process.env.PORT);

const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.wav', 'audio/wav'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

function resolveRequestPath(urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const safePath = normalize(decoded).replace(/^([/\\])+/, '');
  return resolve(distDir, safePath);
}

function isWithinDist(filePath) {
  const relativePath = relative(distDir, filePath);
  return relativePath === '' || (!relativePath.startsWith('..') && !isAbsolute(relativePath));
}

function getCacheControl(filePath) {
  const relativePath = relative(distDir, filePath).replace(/\\/g, '/');
  if (relativePath === 'index.html' || extname(filePath) === '.html') {
    return 'no-cache';
  }

  if (relativePath.startsWith('assets/')) {
    return 'public, max-age=31536000, immutable';
  }

  return 'public, max-age=3600';
}

function sendText(req, res, statusCode, message) {
  res.writeHead(statusCode, {
    'Content-Length': Buffer.byteLength(message),
    'Content-Type': 'text/plain; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  });

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  res.end(message);
}

async function sendFile(req, res, filePath) {
  const stat = await fs.stat(filePath);
  const contentType = mimeTypes.get(extname(filePath)) || 'application/octet-stream';

  res.writeHead(200, {
    'Cache-Control': getCacheControl(filePath),
    'Content-Length': stat.size,
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff',
  });

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  createReadStream(filePath).pipe(res);
}

const server = createServer(async (req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      sendText(req, res, 405, 'Method Not Allowed');
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host || `${host}:${port}`}`);
    let filePath = resolveRequestPath(url.pathname);

    if (!isWithinDist(filePath)) {
      sendText(req, res, 403, 'Forbidden');
      return;
    }

    try {
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        filePath = join(filePath, 'index.html');
      }
      await sendFile(req, res, filePath);
    } catch (error) {
      if (error?.code !== 'ENOENT' && error?.code !== 'ENOTDIR') {
        throw error;
      }

      if (extname(filePath)) {
        sendText(req, res, 404, 'Not Found');
        return;
      }

      await sendFile(req, res, join(distDir, 'index.html'));
    }
  } catch (error) {
    console.error(error);
    sendText(req, res, 500, 'Internal Server Error');
  }
});

server.on('error', (error) => {
  console.error(`Unable to start static server on ${host}:${port}.`);
  console.error(error);
  process.exit(1);
});

try {
  await fs.access(join(distDir, 'index.html'));
} catch {
  console.error(`Missing ${join(distDir, 'index.html')}. Run "npm run build" before "npm start".`);
  process.exit(1);
}

server.listen(port, host, () => {
  console.log(`Serving ${distDir} on http://${host}:${port}`);
});
