import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { globalLogger } from 'tsdown'
import { collectIdentifiers, resolveDependenciesByIdentifier } from './resolver'

export const PLATFORMS = {
  'win32-x64': ['win32'],
  'win32-arm64': ['win32'],
  'linux-x64': ['linux'],
  'alpine-x64': ['linux'],
  'linux-arm64': ['linux'],
  'alpine-arm64': ['linux'],
  'linux-armhf': ['linux'],
  'darwin-x64': ['darwin'],
  'darwin-arm64': ['darwin'],
  'web': ['wasm32'],
}

/**
 * This script is used to copy the `@arkts/project-detector` and
 * its dependencies to the `node_modules/@arkts/project-detector`
 * and `node_modules/@arkts/project-detector-*` directory.
 *
 * So the pnpm must disable the symlink feature.
 */
function getPlatformSpecificPackage(basePackage: string, os?: string, arch?: string, libc?: string): string | null {
  if (!os || !arch) return null

  const libcSuffix = libc === 'musl' ? 'musl' : 'gnu'

  // Map OS to package naming
  // const osName = os
  if (os === 'win32') {
    return `${basePackage}-win32-${arch}-msvc`
  }
  else if (os === 'darwin') {
    return `${basePackage}-darwin-${arch}`
  }
  else if (os === 'linux') {
    return `${basePackage}-linux-${arch}-${libcSuffix}`
  }

  return null
}

async function main() {
  globalLogger.info('Cleaning node_modules...')
  fs.rmSync(path.resolve('node_modules'), { recursive: true, force: true })
  globalLogger.info('Removing package-lock.json...')
  if (fs.existsSync(path.resolve('package-lock.json'))) fs.rmSync(path.resolve('package-lock.json'))
  else globalLogger.warn('package-lock.json not found, skipping deletion')
  globalLogger.info('Installing dev & prod dependencies using npm...')
  const projectDetectorIdentifiers = collectIdentifiers(resolveDependenciesByIdentifier('@arkts/project-detector')).map((identifier) => {
    if (identifier === '@arkts/project-detector') return `${identifier}@next`
    return identifier
  }).join(' ')
  const ohosRsOxkIdentifiers = collectIdentifiers(resolveDependenciesByIdentifier('@ohos-rs/oxk')).join(' ')

  // Add platform-specific packages (without @next tag)
  let platformSpecificPackages = ''
  const detectorPlatformPkg = getPlatformSpecificPackage('@arkts/project-detector', process.env.OS, process.env.ARCH, process.env.LIBC)
  const oxkPlatformPkg = getPlatformSpecificPackage('@ohos-rs/oxk', process.env.OS, process.env.ARCH, process.env.LIBC)

  if (detectorPlatformPkg) {
    platformSpecificPackages += ` ${detectorPlatformPkg}`
    globalLogger.info(`Adding platform-specific package: ${detectorPlatformPkg}`)
  }
  if (oxkPlatformPkg) {
    platformSpecificPackages += ` ${oxkPlatformPkg}`
    globalLogger.info(`Adding platform-specific package: ${oxkPlatformPkg}`)
  }

  // Add @napi-rs/wasm-runtime dependencies
  const wasmRuntimeDeps = '@emnapi/core@^1.7.1 @emnapi/runtime@^1.7.1 @tybys/wasm-util@^0.10.1'

  const installCommand = `npm install ${projectDetectorIdentifiers} ${ohosRsOxkIdentifiers}${platformSpecificPackages} ${wasmRuntimeDeps} --verbose --no-save --legacy-peer-deps`
  globalLogger.info(installCommand)
  execSync(installCommand, { stdio: 'inherit' })
  globalLogger.info('Install done, start copying dependencies...')
  globalLogger.success('✨ Dependencies preprocessing done!')
}

main()
