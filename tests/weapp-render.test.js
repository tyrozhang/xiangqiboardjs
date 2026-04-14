const path = require('path')

// Mock global Component API before requiring the component
let componentOptions = null
global.Component = function (options) {
  componentOptions = options
}

global.wx = {
  createSelectorQuery: function () {
    return {
      in: function () { return this },
      select: function () { return this },
      boundingClientRect: function (cb) {
        cb({ width: 360, height: 400 })
        return this
      },
      fields: function () { return this },
      exec: function (cb) {
        if (cb) cb([{ node: createMockCanvas(), size: { width: 360, height: 400 } }])
      }
    }
  },
  getWindowInfo: function () {
    return { pixelRatio: 2 }
  }
}

function createMockCanvas () {
  return {
    width: 0,
    height: 0,
    createImage: function () {
      return {
        onload: null,
        onerror: null,
        src: '',
        _triggerLoad () {
          if (this.onload) this.onload()
        },
        _triggerError () {
          if (this.onerror) this.onerror()
        }
      }
    }
  }
}

function createMockCtx () {
  const calls = []
  const ctx = {
    _calls: calls,
    _callLog: function (name, args) { calls.push({ name, args: Array.from(args) }) },
    scale: function (x, y) { calls.push({ name: 'scale', args: [x, y] }) },
    clearRect: function (x, y, w, h) { calls.push({ name: 'clearRect', args: [x, y, w, h] }) },
    drawImage: function (img, x, y, w, h) { calls.push({ name: 'drawImage', args: [img, x, y, w, h] }) },
    fillRect: function (x, y, w, h) { calls.push({ name: 'fillRect', args: [x, y, w, h] }) },
    strokeRect: function (x, y, w, h) { calls.push({ name: 'strokeRect', args: [x, y, w, h] }) },
    save: function () { calls.push({ name: 'save', args: [] }) },
    restore: function () { calls.push({ name: 'restore', args: [] }) }
  }
  return ctx
}

// Load component source
require(path.join(__dirname, '..', 'weapp', 'components', 'xiangqiboard', 'xiangqiboard.js'))

describe('Xiangqiboard Component Rendering', () => {
  let inst, canvas, ctx

  beforeEach(() => {
    inst = Object.create(null)
    Object.assign(inst, componentOptions.methods)
    inst.properties = Object.assign({}, componentOptions.properties)
    inst.data = Object.assign({}, componentOptions.data)
    inst.canvas = canvas = createMockCanvas()
    ctx = createMockCtx()
    canvas.getContext = function () { return ctx }
    inst.ctx = ctx
    inst.initialized = true
    inst.boardImage = { _isImage: true, src: 'board.png' }
    inst.pieceImages = {
      rR: { _isImage: true, src: 'rR.png' },
      rP: { _isImage: true, src: 'rP.png' }
    }
    inst.activeAnimations = []
  })

  test('draw clears canvas and draws board background', () => {
    inst.data.currentPosition = {}
    inst.draw()

    const clearCalls = ctx._calls.filter(c => c.name === 'clearRect')
    expect(clearCalls.length).toBeGreaterThan(0)

    const drawBoardCalls = ctx._calls.filter(c => c.name === 'drawImage' && c.args[0] === inst.boardImage)
    expect(drawBoardCalls.length).toBe(1)
  })

  test('draw falls back to fillRect when boardImage is missing', () => {
    inst.boardImage = null
    inst.data.currentPosition = {}
    inst.draw()

    const fillCalls = ctx._calls.filter(c => c.name === 'fillRect')
    expect(fillCalls.length).toBe(1)
  })

  test('draw renders pieces at correct coordinates', () => {
    inst.data.currentPosition = { a1: 'rR', e5: 'rP' }
    inst.data.canvasWidth = 360
    inst.data.canvasHeight = 400
    inst.data.squareSize = 40
    inst.draw()

    const pieceDraws = ctx._calls.filter(c => c.name === 'drawImage' && c.args[0] !== inst.boardImage)
    expect(pieceDraws.length).toBe(2)

    // a1 (col 0, row 1 from bottom) = x=20, y=380
    const a1Call = pieceDraws.find(c => c.args[0] === inst.pieceImages.rR)
    expect(a1Call.args[1]).toBe(20)
    expect(a1Call.args[2]).toBe(380)

    // e5 (col 4, row 5 from bottom) = x=180, y=180
    const e5Call = pieceDraws.find(c => c.args[0] === inst.pieceImages.rP)
    expect(e5Call.args[1]).toBe(180)
    expect(e5Call.args[2]).toBe(180)
  })

  test('squareToXY red orientation', () => {
    const xy = inst.squareToXY('a1', 'red', 40)
    expect(xy).toEqual({ x: 20, y: 380 })
  })

  test('squareToXY black orientation', () => {
    const xy = inst.squareToXY('a1', 'black', 40)
    expect(xy).toEqual({ x: 380, y: 20 })
  })

  test('xyToSquare red orientation', () => {
    expect(inst.xyToSquare(20, 380, 'red', 40)).toBe('a1')
    expect(inst.xyToSquare(180, 180, 'red', 40)).toBe('e5')
    expect(inst.xyToSquare(-10, 0, 'red', 40)).toBe('offboard')
  })

  test('xyToSquare black orientation', () => {
    expect(inst.xyToSquare(20, 20, 'black', 40)).toBe('i9')
    expect(inst.xyToSquare(380, 380, 'black', 40)).toBe('a1')
  })
})

describe('Xiangqiboard Component Lifecycle', () => {
  let inst

  beforeEach(() => {
    inst = Object.create(null)
    Object.assign(inst, componentOptions.methods)
    inst.properties = Object.assign({}, componentOptions.properties)
    inst.data = Object.assign({}, componentOptions.data)
    inst.setData = function (obj, cb) {
      Object.assign(this.data, obj)
      if (cb) cb()
    }
    inst.canvas = createMockCanvas()
    inst.canvas.getContext = function () { return createMockCtx() }
    inst.boardImage = null
    inst.pieceImages = {}
    inst.activeAnimations = []
    inst.initialized = false
  })

  test('_initPosition sets start position', () => {
    inst._initPosition('start')
    expect(inst.data.currentPosition.a1).toBe('rR')
    expect(inst.data.currentPosition.i10).toBe('bR')
  })

  test('position method updates state instantly when useAnimation is false', () => {
    inst.data.currentPosition = { a1: 'rR' }
    inst.draw = jest.fn()
    inst.position({ a2: 'rR' }, false)
    expect(inst.data.currentPosition.a2).toBe('rR')
    expect(inst.draw).toHaveBeenCalled()
  })

  test('move method updates position', () => {
    inst.data.currentPosition = { a1: 'rR' }
    inst.draw = jest.fn()
    inst.move('a1-a2', false)
    expect(inst.data.currentPosition.a2).toBe('rR')
    expect(inst.data.currentPosition.a1).toBeUndefined()
  })

  test('flip toggles orientation', () => {
    inst.data.currentOrientation = 'red'
    inst.draw = jest.fn()
    const result = inst.flip()
    expect(result).toBe('black')
    expect(inst.draw).toHaveBeenCalled()
  })
})
