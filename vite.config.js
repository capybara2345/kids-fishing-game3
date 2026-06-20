import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: './',
  server: {
    port: 5173,
    open: true,
  },
  plugins: [
    {
      name: 'public-assets-404',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url?.split('?')[0] ?? '';
          if (!url.startsWith('/assets/')) {
            next();
            return;
          }

          const assetPath = path.join(projectRoot, 'public', url);
          if (!fs.existsSync(assetPath) || fs.statSync(assetPath).isDirectory()) {
            res.statusCode = 404;
            res.end('Asset not found');
            return;
          }

          next();
        });
      },
    },
  ],
});
