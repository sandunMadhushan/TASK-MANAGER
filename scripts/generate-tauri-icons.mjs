/**
 * Converts `public/logo.png` (any raster format sharp accepts) to a square PNG
 * and runs `tauri icon` so installer / taskbar / title bar use your logo.
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const logoPath = path.join(root, 'public', 'logo.png')
const sourceOut = path.join(root, 'src-tauri', 'app-icon-source.png')
const iconsDir = path.join(root, 'src-tauri', 'icons')

if (!fs.existsSync(logoPath)) {
  console.error('Missing', logoPath)
  process.exit(1)
}

// Fix web favicon if the file was JPEG renamed as .png
await sharp(logoPath).png().toFile(logoPath + '.tmp')
fs.renameSync(logoPath + '.tmp', logoPath)

// Square 1024 source for Tauri (covers high-DPI Windows / macOS)
await sharp(logoPath)
  .resize(1024, 1024, { fit: 'cover', position: 'attention' })
  .png()
  .toFile(sourceOut)

const q = (s) => `"${s.replace(/"/g, '\\"')}"`
execSync(`npx --no tauri icon ${q(sourceOut)} --output ${q(iconsDir)}`, {
  cwd: root,
  stdio: 'inherit',
  shell: true,
})

console.log('Icons written to', iconsDir)
