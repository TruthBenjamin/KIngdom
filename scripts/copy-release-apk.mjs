import { copyFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const source = join(root, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk')
const target = join(root, 'MyAppName-release.apk')

if (!existsSync(source)) {
  throw new Error(`Release APK was not found at ${source}`)
}

copyFileSync(source, target)
console.log(`Copied release APK to ${target}`)
