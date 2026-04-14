const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

async function convertSvgToPng (inputPath, outputPath, size) {
  await sharp(inputPath)
    .resize(size, size)
    .png()
    .toFile(outputPath)
  console.log('Converted', inputPath, '->', outputPath)
}

async function main () {
  const piecesDir = path.join('weapp', 'static', 'pieces', 'wikimedia')
  const boardsDir = path.join('weapp', 'static', 'boards', 'wikimedia')

  const pieces = [
    'bA', 'bB', 'bC', 'bK', 'bN', 'bP', 'bR',
    'rA', 'rB', 'rC', 'rK', 'rN', 'rP', 'rR'
  ]

  // Convert pieces to 128x128 PNG
  for (const piece of pieces) {
    const svgPath = path.join(piecesDir, `${piece}.svg`)
    const pngPath = path.join(piecesDir, `${piece}.png`)
    if (fs.existsSync(svgPath)) {
      await convertSvgToPng(svgPath, pngPath, 128)
    } else {
      console.warn('Missing', svgPath)
    }
  }

  // Convert board to 900x1000 PNG (9:10 ratio, higher res)
  const boardSvg = path.join(boardsDir, 'xiangqiboard.svg')
  const boardPng = path.join(boardsDir, 'xiangqiboard.png')
  if (fs.existsSync(boardSvg)) {
    await sharp(boardSvg)
      .resize(900, 1000)
      .png()
      .toFile(boardPng)
    console.log('Converted', boardSvg, '->', boardPng)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
