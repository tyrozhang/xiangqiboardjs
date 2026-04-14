const fs = require('fs')
const path = require('path')
const vm = require('vm')

const srcPath = path.join(__dirname, '..', 'src', 'xiangqiboard.js')
const src = fs.readFileSync(srcPath, 'utf8')

// Inject exports at the end of the IIFE so tests can access internal functions
const injection = `
  window.__internals = {
    fenToObj,
    objToFen,
    validFen,
    validSquare,
    validMove,
    validPieceCode,
    validPositionObject,
    calculatePositionFromMoves,
    findClosestPiece,
    squareDistance,
    deepCopy,
    expandFenEmptySquares,
    squeezeFenEmptySquares,
    START_FEN,
    START_POSITION,
    COLUMNS,
    ROW_LENGTH,
    ROW_TOP,
    ROW_LOW
  }
`

// Replace the final `})() // end anonymous wrapper` with injection + it
const modifiedSrc = src.replace(
  /\}\)\(\)\s*\/\/\s*end anonymous wrapper/,
  injection + '})() // end anonymous wrapper'
)

const sandbox = {
  window: {
    jQuery: {
      isPlainObject: function (obj) {
        return Object.prototype.toString.call(obj) === '[object Object]'
      },
      fn: { jquery: '3.5.0' }
    },
    alert: function () {},
    document: { documentElement: { style: {} } }
  },
  document: { documentElement: { style: {} } },
  console,
  exports: {},
  setTimeout,
  clearTimeout,
  Math,
  JSON,
  Date,
  parseInt,
  isNaN,
  isFinite,
  encodeURIComponent,
  decodeURIComponent,
  Array,
  Object,
  String,
  Number,
  Boolean,
  RegExp,
  Error,
  TypeError,
  RangeError,
  undefined
}

sandbox.window.window = sandbox.window

vm.createContext(sandbox)
vm.runInContext(modifiedSrc, sandbox)

module.exports = sandbox
