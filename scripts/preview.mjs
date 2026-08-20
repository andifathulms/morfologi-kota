/**
 * Serve ./out under the production basePath.
 *
 * `pnpm preview` before pushing (PRD §11): a site that works from the
 * filesystem and breaks under a basePath is the classic GitHub Pages failure,
 * and it is only visible if you look at it the way Pages will serve it.
 *
 * No dependency — the node http module is enough for a static directory.
 */

import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const ROOT = join(process.cwd(), 'out')
const BASE_PATH = '/morfologi-kota'
const PORT = Number(process.env.PORT ?? 4321)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
}

async function resolve(pathname) {
  const candidates = [pathname, `${pathname}.html`, join(pathname, 'index.html')]
  for (const candidate of candidates) {
    const full = join(ROOT, normalize(candidate).replace(/^(\.\.[/\\])+/, ''))
    try {
      const info = await stat(full)
      if (info.isFile()) return full
    } catch {
      // try the next candidate
    }
  }
  return undefined
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://localhost:${PORT}`)
  let pathname = decodeURIComponent(url.pathname)

  if (pathname === BASE_PATH) pathname = `${BASE_PATH}/`
  if (!pathname.startsWith(`${BASE_PATH}/`)) {
    response.writeHead(302, { location: `${BASE_PATH}/` })
    response.end()
    return
  }
  pathname = pathname.slice(BASE_PATH.length) || '/'

  const file = await resolve(pathname)
  if (file === undefined) {
    const notFound = await resolve('/404.html')
    response.writeHead(404, { 'content-type': 'text/html; charset=utf-8' })
    if (notFound !== undefined) createReadStream(notFound).pipe(response)
    else response.end('404')
    return
  }

  response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
  createReadStream(file).pipe(response)
})

server.listen(PORT, () => {
  console.log(`Serving ./out at http://localhost:${PORT}${BASE_PATH}/`)
  console.log('This is the path GitHub Pages will use. Check it before pushing.')
})
