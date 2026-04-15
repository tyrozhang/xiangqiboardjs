# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 对话要求
全程使用中文进行对话。

## 编码规则
**权衡取舍：** 这些准则偏向于谨慎而非速度。对于简单任务，请自行判断。

## 1）. 编码前先思考

**不要假设。不要隐藏困惑。呈现权衡取舍。**

在实现之前：
- 明确陈述你的假设。如果不确定，请询问。
- 如果存在多种解释，请呈现出来——不要默默选择。
- 如果存在更简单的方案，请说出来。必要时提出反对意见。
- 如果某些地方不清楚，停下来。指出令人困惑的地方。然后询问。

## 2）. 简洁至上

**用最少代码解决问题。不要添加推测性代码。**

- 不要添加超出需求的功能。
- 不要为一次性代码做抽象。
- 不要添加未经请求的"灵活性"或"可配置性"。
- 不要处理不可能发生场景的错误。
- 如果你写了 200 行而本可以只用 50 行，那就重写。

问问自己："资深工程师会觉得这过于复杂吗？"如果是，就简化。

## 3）. 精准修改

**只改动必要之处。只清理自己造成的混乱。**

在编辑现有代码时：
- 不要"优化"相邻的代码、注释或格式。
- 不要重构没有问题的代码。
- 遵循现有风格，即使你会用不同方式实现。
- 如果发现无关的废弃代码，提一下——但不要删除。

当你的更改产生孤儿代码时：
- 删除因你的更改而变得未使用的导入/变量/函数。
- 除非要求，否则不要删除预先存在的废弃代码。

检验标准：每一行更改都应该直接追溯到用户的请求。

## 4）. 目标驱动执行

**定义成功标准。循环验证直到通过。**

将任务转化为可验证的目标：
- "添加验证" → "为无效输入编写测试，然后使其通过"
- "修复 bug" → "编写一个能重现 bug 的测试，然后使其通过"
- "重构 X" → "确保重构前后测试都能通过"

对于多步骤任务，简要说明计划：
```
1. [步骤] → 验证：[检查]
2. [步骤] → 验证：[检查]
3. [步骤] → 验证：[检查]
```

强有力的成功标准让你能独立循环。弱标准（"让它能跑起来"）需要不断澄清。

---

**这些准则生效的标志：** diff 中不必要更改更少，因过度复杂而重写的次数更少，澄清问题出现在实施前而非出错后。
## Commands

- `npm run build` — Lints `src/*.js` with StandardJS, then runs `scripts/build.js` to generate `dist/` and `releases/`.
- `npm run standard` — Runs StandardJS with `--fix` on `src/*.js`.
- `npm run website` — Runs `scripts/website.js` to regenerate the static site in `docs/`.

**Testing.** Automated tests run via Jest (`npm test`). Tests live in `tests/` and cover `weapp/utils/chess-utils.js` (`chess-utils.test.js`) and the WeChat Mini Program canvas renderer (`weapp-render.test.js`). Manual visual testing is still available by opening `src/tests.html` in a browser.

## Architecture

**Dual-target library.** The codebase now serves two platforms:
1. **Browser jQuery widget** (`src/xiangqiboard.js`, ~1,850 lines) — a browser-only, jQuery-dependent DOM widget that exposes `window.Xiangqiboard`. It contains its own FEN/object conversion, square math, DOM generation, jQuery-based animations, and mouse/touch event handling.
2. **WeChat Mini Program component** (`weapp/components/xiangqiboard/`) — a Canvas-based custom component for WeChat Mini Programs (小程序). It renders the board and pieces using the 2D Canvas API instead of DOM, with touch event handling adapted to the Mini Program framework.

**Shared chess utilities.** Core logic originally embedded in `src/xiangqiboard.js` has been extracted into `weapp/utils/chess-utils.js`. This module provides FEN parsing, position validation, animation calculation, and move logic. It is consumed by the WeChat Mini Program component and is covered by automated tests.

**"Just a board" scope.** This library intentionally does NOT understand xiangqi rules, legal moves, turn order, or game state. It only renders positions and provides UI interactions (drag-and-drop, animations, callbacks). Rule logic belongs in a separate library (e.g., `xiangqi.js`).

**Custom Node.js build system.** There is no webpack/rollup/vite. Build logic is implemented directly in `scripts/`:
- `scripts/build.js` reads `src/xiangqiboard.js` and `src/xiangqiboard.css`, substitutes `@VERSION` and `$version$` tokens, removes `RUN_ASSERTS` blocks, minifies with Terser/csso, and writes to `dist/` and `releases/xiangqiboardjs-<version>/`. It also copies images from `docs/img/` into the release folders.
- `scripts/website.js` generates the documentation site in `docs/` by rendering Mustache templates (`templates/`) and processing example files (`templates/examples/*.example`). It also vendors jQuery, prettify, and normalize.css into `docs/`.
- `scripts/convert-assets.js` converts SVG piece and board images to PNGs for the WeChat Mini Program, using `sharp`. Output goes to `weapp/static/pieces/` and `weapp/static/boards/`.

**CSS obfuscation.** `src/xiangqiboard.css` uses unique hashed class names (e.g., `board-1ef78`, `square-2b8ce`) to avoid clashing with other page styles. The JS file hardcodes these same names. The WeChat Mini Program component uses its own minimal WXSS (`xiangqiboard.wxss`) because rendering is Canvas-based.

**Assets.** Default piece and board themes are SVGs stored under `docs/img/xiangqipieces/` and `docs/img/xiangqiboards/`. The build script syncs selected image directories into `dist/` and `releases/`. WeChat Mini Program assets are pre-generated PNGs under `weapp/static/`. 

## Important files

- `src/xiangqiboard.js` — Library source. All DOM rendering and interaction logic.
- `src/xiangqiboard.css` — Widget styles with obfuscated class names.
- `src/tests.html` — Manual visual test page.
- `scripts/build.js` — Release and dist generation.
- `scripts/website.js` — Docs site generation.
- `templates/docs.json` — Structured docs data used by `website.js`.
