// SVG → PNG アイコン生成スクリプト
// 実行: node scripts/generate-icons.mjs

import sharp from 'sharp'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const svg = readFileSync(join(root, 'app/icon.svg'))

const sizes = [
  { size: 192, file: 'public/icon-192.png' },
  { size: 512, file: 'public/icon-512.png' },
  { size: 180, file: 'public/apple-touch-icon.png' },
]

for (const { size, file } of sizes) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(join(root, file))
  console.log(`✓ ${file}`)
}

console.log('Icons generated!')
