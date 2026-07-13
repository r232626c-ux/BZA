import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, 'dist')

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.js' || ext === '.mjs') return 'application/javascript; charset=utf-8'
  if (ext === '.css') return 'text/css; charset=utf-8'
  if (ext === '.map' || ext === '.json') return 'application/json; charset=utf-8'
  if (ext === '.svg') return 'image/svg+xml'
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.ico') return 'image/x-icon'
  return 'application/octet-stream'
}

function devAssetRecoveryMiddleware() {
  return {
    name: 'biozone-dev-asset-recovery',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url || ''
        const cleanUrl = rawUrl.split('?')[0]

        // Never cache HTML in dev so stale dist index files do not persist.
        if (cleanUrl === '/' || cleanUrl.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-store')
        }

        // If someone opens /dist/index.html while on the dev server, route to the real dev entry.
        if (cleanUrl === '/dist' || cleanUrl === '/dist/' || cleanUrl === '/dist/index.html') {
          res.statusCode = 302
          res.setHeader('Location', '/')
          res.end()
          return
        }

        if (cleanUrl.startsWith('/assets/')) {
          const distAssetPath = path.join(distDir, cleanUrl.replace(/^\//, ''))

          if (fs.existsSync(distAssetPath) && fs.statSync(distAssetPath).isFile()) {
            res.setHeader('Content-Type', contentTypeFor(distAssetPath))
            res.setHeader('Cache-Control', 'no-store')
            fs.createReadStream(distAssetPath).pipe(res)
            return
          }

          // Recover from stale hashed URLs by forcing a full app reload instead of MIME errors.
          if (cleanUrl.endsWith('.js')) {
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
            res.setHeader('Cache-Control', 'no-store')
            res.end('window.location.replace("/"); export {};')
            return
          }

          if (cleanUrl.endsWith('.css')) {
            res.statusCode = 200
            res.setHeader('Content-Type', 'text/css; charset=utf-8')
            res.setHeader('Cache-Control', 'no-store')
            res.end('')
            return
          }
        }

        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), devAssetRecoveryMiddleware()],
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
    proxy: {
      '^/(token|users|admin|patients|lab-requests|lab-results|lab-tests|sample-management|system-settings|auth|api)(/|$)': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
    hmr: {
      protocol: 'ws',
      host: '127.0.0.1',
      port: 5174,
    },
  },
})
