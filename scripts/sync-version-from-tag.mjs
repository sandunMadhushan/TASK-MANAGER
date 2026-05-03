/**
 * CI helper: set package.json + Tauri version fields from a release tag (e.g. v0.1.5)
 * so installer filenames match the tag even if the tag was created before a "release:" version commit.
 */
import fs from 'node:fs'
import path from 'node:path'

import { setCargoPackageVersion } from './set-cargo-package-version.mjs'

const root = process.cwd()
const packageJsonPath = path.join(root, 'package.json')
const tauriConfPath = path.join(root, 'src-tauri', 'tauri.conf.json')
const cargoTomlPath = path.join(root, 'src-tauri', 'Cargo.toml')

const raw = process.argv[2] || process.env.GITHUB_REF_NAME || ''
const tag = raw.trim()
const m = /^v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(tag)
if (!m) {
  console.error(`sync-version-from-tag: expected tag like v1.2.3, got "${tag}"`)
  process.exit(1)
}

const nextVersion = m[1]

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
const previousVersion = packageJson.version
packageJson.version = nextVersion
fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`)

const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'))
tauriConf.version = nextVersion
fs.writeFileSync(tauriConfPath, `${JSON.stringify(tauriConf, null, 2)}\n`)

const cargoToml = fs.readFileSync(cargoTomlPath, 'utf8')
const cargoUpdated = setCargoPackageVersion(cargoToml, nextVersion)
if (!cargoUpdated) {
  console.error(
    'sync-version-from-tag: could not update [package] version in src-tauri/Cargo.toml (expected version = "x.y.z")'
  )
  process.exit(1)
}
fs.writeFileSync(cargoTomlPath, cargoUpdated)

console.log(`sync-version-from-tag: ${previousVersion} -> ${nextVersion} (from tag ${tag})`)
