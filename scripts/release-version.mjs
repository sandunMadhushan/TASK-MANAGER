import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const packageJsonPath = path.join(root, 'package.json')
const tauriConfPath = path.join(root, 'src-tauri', 'tauri.conf.json')
const cargoTomlPath = path.join(root, 'src-tauri', 'Cargo.toml')

const args = process.argv.slice(2)
const tagFlagIndex = args.indexOf('--tag')
const shouldCreateTag = tagFlagIndex !== -1
if (shouldCreateTag) {
  args.splice(tagFlagIndex, 1)
}

const nextVersion = args[0]
if (!nextVersion) {
  console.error('Usage: npm run release:version -- <x.y.z> [--tag]')
  process.exit(1)
}

if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(nextVersion)) {
  console.error(`Invalid version "${nextVersion}". Use semver (e.g. 0.1.2 or 0.2.0-beta.1).`)
  process.exit(1)
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
const previousVersion = packageJson.version
packageJson.version = nextVersion
fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`)

const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'))
tauriConf.version = nextVersion
fs.writeFileSync(tauriConfPath, `${JSON.stringify(tauriConf, null, 2)}\n`)

const cargoToml = fs.readFileSync(cargoTomlPath, 'utf8')
const cargoUpdated = cargoToml.replace(
  /^version\s*=\s*"[^"]+"/m,
  `version = "${nextVersion}"`
)
if (cargoUpdated === cargoToml) {
  console.error('Could not update version in src-tauri/Cargo.toml')
  process.exit(1)
}
fs.writeFileSync(cargoTomlPath, cargoUpdated)

if (shouldCreateTag) {
  const tagName = `v${nextVersion}`
  execSync(`git tag -a ${tagName} -m "Nexus Tasks ${tagName}"`, {
    stdio: 'inherit',
  })
  console.log(`Created git tag ${tagName}`)
}

console.log(`Updated version ${previousVersion} -> ${nextVersion}`)
console.log('Updated files:')
console.log('- package.json')
console.log('- src-tauri/tauri.conf.json')
console.log('- src-tauri/Cargo.toml')

