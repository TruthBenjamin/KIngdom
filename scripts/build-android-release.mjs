import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const localTools = join(root, '.android-build-tools')
const localJdk = join(localTools, 'jdk17', 'jdk-17.0.19+10')
const localSdk = join(localTools, 'android-sdk')
const localGradle = join(localTools, 'gradle', 'gradle-8.13', 'bin', process.platform === 'win32' ? 'gradle.bat' : 'gradle')
const localGradleCommand = process.platform === 'win32'
  ? '.android-build-tools\\gradle\\gradle-8.13\\bin\\gradle.bat'
  : './.android-build-tools/gradle/gradle-8.13/bin/gradle'
const gradleCommand = existsSync(localGradle) ? localGradleCommand : 'gradle'

const env = { ...process.env }

if (existsSync(localJdk)) {
  env.JAVA_HOME = localJdk
}

if (existsSync(localSdk)) {
  env.ANDROID_HOME = localSdk
}

env.PATH = [
  env.JAVA_HOME ? join(env.JAVA_HOME, 'bin') : '',
  env.ANDROID_HOME ? join(env.ANDROID_HOME, 'platform-tools') : '',
  process.env.PATH || '',
]
  .filter(Boolean)
  .join(process.platform === 'win32' ? ';' : ':')

const command = process.platform === 'win32' && gradleCommand.endsWith('.bat') ? 'cmd.exe' : gradleCommand
const args =
  command === 'cmd.exe'
    ? ['/d', '/c', `${gradleCommand} -p android assembleRelease`]
    : ['-p', 'android', 'assembleRelease']

const result = spawnSync(command, args, {
  cwd: root,
  env,
  stdio: 'inherit',
  shell: false,
})

process.exit(result.status ?? 1)
