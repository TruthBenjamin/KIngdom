import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const appDir = join(root, '.next', 'server', 'app')
const nextStatic = join(root, '.next', 'static')
const publicDir = join(root, 'public')
const wwwDir = join(root, 'android', 'app', 'src', 'main', 'assets', 'www')
const androidBaseHref = 'https://kingdom.local/'

if (!existsSync(appDir) || !existsSync(nextStatic)) {
  throw new Error('Run `npm run build` before syncing Android assets.')
}

rmSync(wwwDir, { recursive: true, force: true })
mkdirSync(wwwDir, { recursive: true })

cpSync(publicDir, wwwDir, { recursive: true })
cpSync(nextStatic, join(wwwDir, '_next', 'static'), { recursive: true })

function prepareHtmlForWebView(html) {
  const withBase = html.includes('<base ')
    ? html
    : html.replace('<head>', `<head><base href="${androidBaseHref}">`)

  return withBase
    .replace(/(href|src|poster|action)=("|\')\/(?!\/)/g, '$1=$2')
    .replace(/(imageSrcSet|srcSet)=("|\')\/(?!\/)/g, '$1=$2')
    .replace(/([,(]\s*)\/(_next|images|favicon\.ico|icon\.png|apple-icon\.png)/g, '$1$2')
    .replace(/\s\/(_next|images|favicon\.ico|icon\.png|apple-icon\.png)/g, ' $1')
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stats = statSync(full)
    if (stats.isDirectory()) {
      walk(full)
    } else if (entry.endsWith('.html')) {
      const rel = relative(appDir, full)
      const target = join(wwwDir, rel)
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, prepareHtmlForWebView(readFileSync(full, 'utf8')))
    }
  }
}

walk(appDir)
console.log(`Synced Android WebView assets to ${wwwDir}`)
