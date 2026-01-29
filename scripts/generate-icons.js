const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const SOURCE_IMAGE = path.join(__dirname, '../public/logo.jpg')
const PUBLIC_ICONS_DIR = path.join(__dirname, '../public/icons')
const BUILD_RESOURCES_DIR = path.join(__dirname, '../build-resources')
const BUILD_ICONS_DIR = path.join(BUILD_RESOURCES_DIR, 'icons')
const ANDROID_RES_DIR = path.join(__dirname, '../android/app/src/main/res')

// PWA icon sizes
const PWA_SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

// Electron Linux icon sizes
const LINUX_SIZES = [16, 24, 32, 48, 64, 128, 256, 512]

// Android icon sizes (mipmap folders)
const ANDROID_SIZES = [
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
]

// iOS icon sizes
const IOS_SIZES = [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024]

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// Create a rounded rectangle mask for border radius
function createRoundedMask(size, radius) {
  const svg = `
    <svg width="${size}" height="${size}">
      <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/>
    </svg>
  `
  return Buffer.from(svg)
}

// Apply rounded corners to an image
async function createRoundedIcon(inputPath, size, borderRadiusPercent = 18) {
  const radius = Math.round(size * borderRadiusPercent / 100)
  const mask = createRoundedMask(size, radius)

  const resized = await sharp(inputPath)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toBuffer()

  return sharp(resized)
    .composite([{
      input: mask,
      blend: 'dest-in'
    }])
    .png()
    .toBuffer()
}

async function generatePWAIcons() {
  console.log('Generating PWA icons with rounded corners...')
  await ensureDir(PUBLIC_ICONS_DIR)

  for (const size of PWA_SIZES) {
    const rounded = await createRoundedIcon(SOURCE_IMAGE, size)
    await sharp(rounded)
      .toFile(path.join(PUBLIC_ICONS_DIR, `icon-${size}x${size}.png`))
    console.log(`  Created icon-${size}x${size}.png`)
  }
}

async function generateElectronIcons() {
  console.log('Generating Electron icons with rounded corners...')
  await ensureDir(BUILD_RESOURCES_DIR)
  await ensureDir(BUILD_ICONS_DIR)

  // Generate PNG for macOS (1024x1024 for icns generation)
  const rounded1024 = await createRoundedIcon(SOURCE_IMAGE, 1024)
  await sharp(rounded1024)
    .toFile(path.join(BUILD_RESOURCES_DIR, 'icon.png'))
  console.log('  Created icon.png (1024x1024)')

  // Generate Linux icons in various sizes
  for (const size of LINUX_SIZES) {
    const rounded = await createRoundedIcon(SOURCE_IMAGE, size)
    await sharp(rounded)
      .toFile(path.join(BUILD_ICONS_DIR, `${size}x${size}.png`))
    console.log(`  Created Linux icon ${size}x${size}.png`)
  }

  // Generate Windows ICO (256x256 for best quality)
  const rounded256 = await createRoundedIcon(SOURCE_IMAGE, 256)
  await sharp(rounded256)
    .toFile(path.join(BUILD_RESOURCES_DIR, 'icon.ico.png'))
  console.log('  Created icon for Windows conversion')

  console.log('  Note: For macOS .icns, electron-builder will convert icon.png')
}

// Android adaptive icon foreground sizes (108dp with 18dp safe zone padding)
const ANDROID_FOREGROUND_SIZES = [
  { folder: 'mipmap-mdpi', size: 108 },
  { folder: 'mipmap-hdpi', size: 162 },
  { folder: 'mipmap-xhdpi', size: 216 },
  { folder: 'mipmap-xxhdpi', size: 324 },
  { folder: 'mipmap-xxxhdpi', size: 432 },
]

async function generateAndroidIcons() {
  console.log('Generating Android icons with rounded corners...')

  if (!fs.existsSync(ANDROID_RES_DIR)) {
    console.log('  Android project not found, skipping...')
    return
  }

  for (const { folder, size } of ANDROID_SIZES) {
    const folderPath = path.join(ANDROID_RES_DIR, folder)
    await ensureDir(folderPath)

    // Regular icon with rounded corners
    const rounded = await createRoundedIcon(SOURCE_IMAGE, size)
    await sharp(rounded)
      .toFile(path.join(folderPath, 'ic_launcher.png'))

    // Round icon (circular)
    const circleRadius = size / 2
    const circleMask = createRoundedMask(size, circleRadius)
    const resized = await sharp(SOURCE_IMAGE)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toBuffer()

    await sharp(resized)
      .composite([{ input: circleMask, blend: 'dest-in' }])
      .png()
      .toFile(path.join(folderPath, 'ic_launcher_round.png'))

    console.log(`  Created Android icons in ${folder}`)
  }

  // Generate adaptive icon foregrounds (larger with padding)
  for (const { folder, size } of ANDROID_FOREGROUND_SIZES) {
    const folderPath = path.join(ANDROID_RES_DIR, folder)
    await ensureDir(folderPath)

    // Foreground icon - logo centered with padding (72dp logo in 108dp canvas)
    const logoSize = Math.round(size * 0.67) // 72/108 ratio
    const padding = Math.round((size - logoSize) / 2)

    // Create a transparent canvas with logo centered
    const logoBuffer = await sharp(SOURCE_IMAGE)
      .resize(logoSize, logoSize, { fit: 'cover' })
      .png()
      .toBuffer()

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{
        input: logoBuffer,
        top: padding,
        left: padding
      }])
      .png()
      .toFile(path.join(folderPath, 'ic_launcher_foreground.png'))

    console.log(`  Created Android foreground icon in ${folder}`)
  }
}

async function generateiOSIcons() {
  console.log('Generating iOS icons...')

  const iosIconsDir = path.join(__dirname, '../ios/App/App/Assets.xcassets/AppIcon.appiconset')

  if (!fs.existsSync(iosIconsDir)) {
    console.log('  iOS project not found, skipping...')
    return
  }

  // iOS icons should NOT have rounded corners - iOS applies them automatically
  for (const size of IOS_SIZES) {
    await sharp(SOURCE_IMAGE)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(path.join(iosIconsDir, `icon-${size}.png`))
    console.log(`  Created iOS icon ${size}x${size}`)
  }

  // Create Contents.json for iOS
  const contents = {
    images: [
      { size: "20x20", idiom: "iphone", scale: "2x", filename: "icon-40.png" },
      { size: "20x20", idiom: "iphone", scale: "3x", filename: "icon-60.png" },
      { size: "29x29", idiom: "iphone", scale: "2x", filename: "icon-58.png" },
      { size: "29x29", idiom: "iphone", scale: "3x", filename: "icon-87.png" },
      { size: "40x40", idiom: "iphone", scale: "2x", filename: "icon-80.png" },
      { size: "40x40", idiom: "iphone", scale: "3x", filename: "icon-120.png" },
      { size: "60x60", idiom: "iphone", scale: "2x", filename: "icon-120.png" },
      { size: "60x60", idiom: "iphone", scale: "3x", filename: "icon-180.png" },
      { size: "20x20", idiom: "ipad", scale: "1x", filename: "icon-20.png" },
      { size: "20x20", idiom: "ipad", scale: "2x", filename: "icon-40.png" },
      { size: "29x29", idiom: "ipad", scale: "1x", filename: "icon-29.png" },
      { size: "29x29", idiom: "ipad", scale: "2x", filename: "icon-58.png" },
      { size: "40x40", idiom: "ipad", scale: "1x", filename: "icon-40.png" },
      { size: "40x40", idiom: "ipad", scale: "2x", filename: "icon-80.png" },
      { size: "76x76", idiom: "ipad", scale: "1x", filename: "icon-76.png" },
      { size: "76x76", idiom: "ipad", scale: "2x", filename: "icon-152.png" },
      { size: "83.5x83.5", idiom: "ipad", scale: "2x", filename: "icon-167.png" },
      { size: "1024x1024", idiom: "ios-marketing", scale: "1x", filename: "icon-1024.png" }
    ],
    info: { version: 1, author: "xcode" }
  }

  fs.writeFileSync(
    path.join(iosIconsDir, 'Contents.json'),
    JSON.stringify(contents, null, 2)
  )
  console.log('  Created Contents.json for iOS')
}

async function generateFavicon() {
  console.log('Generating favicon with rounded corners...')

  const rounded = await createRoundedIcon(SOURCE_IMAGE, 32)
  await sharp(rounded)
    .toFile(path.join(__dirname, '../public/favicon.png'))
  console.log('  Created favicon.png')
}

async function main() {
  console.log('=== AcademyDSJ Chat Icon Generator ===\n')
  console.log(`Source image: ${SOURCE_IMAGE}\n`)

  if (!fs.existsSync(SOURCE_IMAGE)) {
    console.error('Error: Source image not found!')
    console.error('Please ensure logo.jpg exists in public folder')
    process.exit(1)
  }

  try {
    await generatePWAIcons()
    console.log('')
    await generateElectronIcons()
    console.log('')
    await generateAndroidIcons()
    console.log('')
    await generateiOSIcons()
    console.log('')
    await generateFavicon()
    console.log('\n=== Icon generation complete! ===')
    console.log('\nGenerated icons:')
    console.log('  - PWA icons in public/icons/ (with rounded corners)')
    console.log('  - Electron icons in build-resources/ (with rounded corners)')
    console.log('  - Android icons in android/app/src/main/res/')
    console.log('  - iOS icons in ios/App/App/Assets.xcassets/')
    console.log('  - Favicon in public/')
  } catch (error) {
    console.error('Error generating icons:', error)
    process.exit(1)
  }
}

main()
