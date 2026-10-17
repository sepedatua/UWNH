import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';

function gameLoggerPlugin() {
  const dir = (import.meta as any).dirname || process.cwd();
  const logFilePath = path.resolve(dir, 'game_debug.log');

  if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, `[${new Date().toISOString()}] INFO  [System] Logging initialized. Uncharted Waters II Engine Debug Log.\n`, 'utf8');
  }

  return {
    name: 'game-logger-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/game-log', (req: any, res: any) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const entry = JSON.parse(body);
              const time = entry.timestamp || new Date().toISOString();
              const level = (entry.level || 'INFO').padEnd(5);
              const category = entry.category ? `[${entry.category}]` : '';
              const details = entry.details
                ? ` | Details: ${typeof entry.details === 'object' ? JSON.stringify(entry.details) : entry.details}`
                : '';
              const stateInfo = entry.stateSnapshot
                ? ` | State: ${JSON.stringify(entry.stateSnapshot)}`
                : '';
              const logLine = `[${time}] ${level} ${category} ${entry.message}${details}${stateInfo}\n`;

              fs.appendFileSync(logFilePath, logLine, 'utf8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ status: 'ok' }));
            } catch (e: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: e.message }));
            }
          });
        } else if (req.method === 'GET') {
          if (fs.existsSync(logFilePath)) {
            const content = fs.readFileSync(logFilePath, 'utf8');
            res.setHeader('Content-Type', 'text/plain');
            res.end(content);
          } else {
            res.end('');
          }
        } else {
          res.statusCode = 405;
          res.end('Method Not Allowed');
        }
      });
    },
  };
}

export default defineConfig({
  // used for hosting on johan.li/uncharted-waters-2
  base: process.env.PUBLIC_PATH || '/',
  plugins: [react(), tailwindcss(), gameLoggerPlugin()],
  server: {
    proxy: {
      '/server': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'build',
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
