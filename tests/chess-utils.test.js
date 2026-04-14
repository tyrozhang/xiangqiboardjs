const chessUtils = require('../weapp/utils/chess-utils')

const {
  fenToObj,
  objToFen,
  validFen,
  validSquare,
  validMove,
  validPieceCode,
  validPositionObject,
  calculatePositionFromMoves,
  calculateAnimations,
  findClosestPiece,
  squareDistance,
  deepCopy,
  expandFenEmptySquares,
  squeezeFenEmptySquares,
  interpolateTemplate,
  expandConfig,
  START_FEN,
  START_POSITION,
  COLUMNS,
  ROW_LENGTH,
  ROW_TOP,
  ROW_LOW
} = chessUtils

describe('Constants', () => {
  test('ROW_TOP is 9, ROW_LOW is 0', () => {
    expect(ROW_TOP).toBe(9)
    expect(ROW_LOW).toBe(0)
    expect(ROW_LENGTH).toBe(10)
    expect(COLUMNS).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'])
  })

  test('START_FEN is valid', () => {
    expect(validFen(START_FEN)).toBe(true)
  })

  test('START_POSITION is valid', () => {
    expect(validPositionObject(START_POSITION)).toBe(true)
  })
})

describe('interpolateTemplate', () => {
  test('replaces placeholders', () => {
    expect(interpolateTemplate('hello {name}', { name: 'world' })).toBe('hello world')
    expect(interpolateTemplate('{a}bc{a}bc', { a: 'x' })).toBe('xbcxbc')
    expect(interpolateTemplate('abc', { a: 'x' })).toBe('abc')
  })
})

describe('validSquare', () => {
  test('accepts a1 to i9', () => {
    expect(validSquare('a1')).toBe(true)
    expect(validSquare('e5')).toBe(true)
    expect(validSquare('i9')).toBe(true)
  })

  test('rejects invalid squares', () => {
    expect(validSquare('D2')).toBe(false)
    expect(validSquare('a')).toBe(false)
    expect(validSquare('j1')).toBe(false)
    expect(validSquare('a10')).toBe(false)
    expect(validSquare(true)).toBe(false)
    expect(validSquare(null)).toBe(false)
    expect(validSquare({})).toBe(false)
  })
})

describe('validMove', () => {
  test('accepts e2-e4 style moves', () => {
    expect(validMove('e2-e4')).toBe(true)
    expect(validMove('f6-d5')).toBe(true)
    expect(validMove('a1-a2')).toBe(true)
  })

  test('rejects invalid moves', () => {
    expect(validMove('e2e4')).toBe(false)
    expect(validMove('e2-e4-e5')).toBe(false)
    expect(validMove('e2-x4')).toBe(false)
    expect(validMove({})).toBe(false)
    expect(validMove(null)).toBe(false)
  })
})

describe('validPieceCode', () => {
  test('accepts valid piece codes', () => {
    expect(validPieceCode('bP')).toBe(true)
    expect(validPieceCode('bK')).toBe(true)
    expect(validPieceCode('rK')).toBe(true)
    expect(validPieceCode('rR')).toBe(true)
    expect(validPieceCode('bC')).toBe(true)
    expect(validPieceCode('rN')).toBe(true)
  })

  test('rejects invalid piece codes', () => {
    expect(validPieceCode('RR')).toBe(false)
    expect(validPieceCode('Rr')).toBe(false)
    expect(validPieceCode('a')).toBe(false)
    expect(validPieceCode(true)).toBe(false)
    expect(validPieceCode(null)).toBe(false)
    expect(validPieceCode({})).toBe(false)
  })
})

describe('validFen', () => {
  test('accepts valid FEN strings', () => {
    expect(validFen(START_FEN)).toBe(true)
    expect(validFen('9/9/9/9/9/9/9/9/9/9')).toBe(true)
    expect(validFen('r1bakab1r/9/1cn2cn2/p1p1p1p1p/9/9/P1P1P1P1P/1C2C1N2/9/RNBAKABR1')).toBe(true)
    expect(validFen('rnbakabnr/9/1c2c4/p1p1C1p1p/9/9/P1P1P1P1P/1C7/9/RNBAKABNR b - - 0 2')).toBe(true)
  })

  test('rejects invalid FEN strings', () => {
    expect(validFen('rnbakabnz/9/1c2c4/p1p1C1p1p/9/9/P1P1P1P1P/1C7/9/RNBAKABNR b - - 0 2')).toBe(false)
    expect(validFen('anbrkqbnr/9/9/9/9/9/P1P1P1P1P/9/9/9')).toBe(false)
    expect(validFen('rnbakabnr/p1p1p1p1p/9/9/9/9/P1P1P1P1P/')).toBe(false)
    expect(validFen('rnbakabnr/p1p1p1p1p/74/9/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR')).toBe(false)
    expect(validFen({})).toBe(false)
    expect(validFen(null)).toBe(false)
  })
})

describe('validPositionObject', () => {
  test('accepts valid position objects', () => {
    expect(validPositionObject(START_POSITION)).toBe(true)
    expect(validPositionObject({})).toBe(true)
    expect(validPositionObject({ e2: 'rP' })).toBe(true)
    expect(validPositionObject({ e2: 'rP', d2: 'rP' })).toBe(true)
  })

  test('rejects invalid position objects', () => {
    expect(validPositionObject({ e2: 'BP' })).toBe(false)
    expect(validPositionObject({ y2: 'rP' })).toBe(false)
    expect(validPositionObject(null)).toBe(false)
    expect(validPositionObject('start')).toBe(false)
    expect(validPositionObject(START_FEN)).toBe(false)
  })
})

describe('fenToObj and objToFen', () => {
  test('round-trip: fenToObj(objToFen(pos)) === pos', () => {
    const pos = { a1: 'rR', b2: 'bP', e5: 'rK' }
    const fen = objToFen(pos)
    const recovered = fenToObj(fen)
    expect(recovered).toEqual(pos)
  })

  test('round-trip: objToFen(fenToObj(fen)) === fen', () => {
    const fen = 'r1bakab1r/9/1cn2cn2/p1p1p1p1p/9/9/P1P1P1P1P/1C2C1N2/9/RNBAKABR1'
    const pos = fenToObj(fen)
    const recovered = objToFen(pos)
    expect(recovered).toBe(fen)
  })

  test('START_FEN round-trip', () => {
    expect(objToFen(fenToObj(START_FEN))).toBe(START_FEN)
  })

  test('empty board round-trip', () => {
    expect(objToFen(fenToObj('9/9/9/9/9/9/9/9/9/9'))).toBe('9/9/9/9/9/9/9/9/9/9')
  })

  test('invalid input returns false', () => {
    expect(fenToObj('invalid')).toBe(false)
    expect(objToFen({ e2: 'bad' })).toBe(false)
  })
})

describe('squeezeFenEmptySquares / expandFenEmptySquares', () => {
  test('squeeze reduces consecutive 1s', () => {
    expect(squeezeFenEmptySquares('111111111')).toBe('9')
    expect(squeezeFenEmptySquares('11111111')).toBe('8')
    expect(squeezeFenEmptySquares('111')).toBe('3')
    expect(squeezeFenEmptySquares('11')).toBe('2')
  })

  test('expand increases numbers to 1s', () => {
    expect(expandFenEmptySquares('9')).toBe('111111111')
    expect(expandFenEmptySquares('8')).toBe('11111111')
    expect(expandFenEmptySquares('3')).toBe('111')
    expect(expandFenEmptySquares('2')).toBe('11')
  })
})

describe('deepCopy', () => {
  test('creates independent copy', () => {
    const original = { a: { b: 1 } }
    const copy = deepCopy(original)
    expect(copy).toEqual(original)
    copy.a.b = 2
    expect(original.a.b).toBe(1)
  })
})

describe('squareDistance', () => {
  test('calculates Chebyshev distance', () => {
    expect(squareDistance('a1', 'a2')).toBe(1)
    expect(squareDistance('a1', 'b2')).toBe(1)
    expect(squareDistance('a1', 'c3')).toBe(2)
    expect(squareDistance('e5', 'e5')).toBe(0)
    expect(squareDistance('a1', 'i9')).toBe(8)
  })
})

describe('findClosestPiece', () => {
  test('finds closest matching piece', () => {
    const pos = { a1: 'rR', a2: 'rR', i9: 'rR' }
    expect(findClosestPiece(pos, 'rR', 'a1')).toBe('a2')
    // a1 and a2 are equidistant from e5, either is acceptable
    const closest = findClosestPiece(pos, 'rR', 'e5')
    expect(['a1', 'a2']).toContain(closest)
    expect(findClosestPiece(pos, 'rR', 'i9')).toBe('a1')
  })

  test('returns false if piece not found', () => {
    expect(findClosestPiece({ a1: 'rR' }, 'bP', 'a1')).toBe(false)
  })
})

describe('calculatePositionFromMoves', () => {
  test('executes simple moves', () => {
    const pos = fenToObj(START_FEN)
    const newPos = calculatePositionFromMoves(pos, { 'e3': 'e4' })
    expect(newPos['e4']).toBe('rP')
    expect(newPos['e3']).toBeUndefined()
  })

  test('ignores moves from empty squares', () => {
    const pos = fenToObj(START_FEN)
    const newPos = calculatePositionFromMoves(pos, { 'e5': 'e4' })
    expect(newPos['e4']).toBeUndefined()
  })

  test('does not mutate original', () => {
    const pos = fenToObj(START_FEN)
    const originalKeys = Object.keys(pos).sort()
    calculatePositionFromMoves(pos, { 'e3': 'e4' })
    expect(Object.keys(pos).sort()).toEqual(originalKeys)
  })
})

describe('calculateAnimations', () => {
  test('move animation', () => {
    const p1 = { a1: 'rR' }
    const p2 = { a2: 'rR' }
    expect(calculateAnimations(p1, p2)).toEqual([
      { type: 'move', source: 'a1', destination: 'a2', piece: 'rR' }
    ])
  })

  test('add animation', () => {
    const p1 = {}
    const p2 = { a1: 'rR' }
    expect(calculateAnimations(p1, p2)).toEqual([
      { type: 'add', square: 'a1', piece: 'rR' }
    ])
  })

  test('clear animation', () => {
    const p1 = { a1: 'rR' }
    const p2 = {}
    expect(calculateAnimations(p1, p2)).toEqual([
      { type: 'clear', square: 'a1', piece: 'rR' }
    ])
  })

  test('capture: move + clear, not two clears', () => {
    const p1 = { a1: 'rR', a2: 'bP' }
    const p2 = { a2: 'rR' }
    const animations = calculateAnimations(p1, p2)
    const moveAnim = animations.find(a => a.type === 'move')
    const clearAnim = animations.find(a => a.type === 'clear')
    expect(moveAnim).toEqual({ type: 'move', source: 'a1', destination: 'a2', piece: 'rR' })
    expect(clearAnim).toBeUndefined()
    expect(animations.length).toBe(1)
  })

  test('complex scenario', () => {
    const p1 = { a1: 'rR', b1: 'bP' }
    const p2 = { a2: 'rR', c1: 'bP', d1: 'rN' }
    const animations = calculateAnimations(p1, p2)
    const types = animations.map(a => a.type).sort()
    expect(types).toContain('move')
    expect(types).toContain('move')
    expect(types).toContain('add')
    expect(types.length).toBe(3)
  })
})

describe('expandConfig', () => {
  test('sets defaults', () => {
    const config = expandConfig({})
    expect(config.orientation).toBe('red')
    expect(config.showNotation).toBe(false)
    expect(config.draggable).toBe(false)
    expect(config.dropOffBoard).toBe('snapback')
    expect(config.sparePieces).toBe(false)
    expect(config.pieceTheme).toBe('img/xiangqipieces/wikimedia/{piece}.svg')
    expect(config.boardTheme).toBe('img/xiangqiboards/wikimedia/xiangqiboard.svg')
  })

  test('draggable forced true when sparePieces is true', () => {
    const config = expandConfig({ sparePieces: true })
    expect(config.draggable).toBe(true)
  })
})
