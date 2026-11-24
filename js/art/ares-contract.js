// ARES GAME CONTRACT v1 (review branch; ARES P0 S5). What the game reports about what it drew, so ARES checks the real
// geometry instead of guessing from pixels (typed object inspection, GameDriver-style; state + image together, as in
// state-aware glitch detection research). Active only at /?test: the player's game records nothing.
// Each scene object: { schema, id, kind, role, item, parent, state, transform, anchors, polygon, regions, layerOrder,
//   visible, source } in CANVAS pixels after every transform (facing, scale, lean).
export const ARES_CONTRACT = { version: 1, schema: 'ares.scene-object/1', hooks: ['sceneReport', 'resetScene', 'testSheet'], features: ['specLock'] };
const TEST = typeof location !== 'undefined' && /[?&]test\b/.test(location.search);
const SCENE = [];
export function reportObject(o) { if (TEST) SCENE.push({ schema: ARES_CONTRACT.schema, ...o }); }
export function sceneReport() { return SCENE.slice(); }
export function resetScene() { SCENE.length = 0; }
export const isTest = () => TEST;
// map a local point through the canvas transform
export function toCanvas(ctx, x, y) { const p = ctx.getTransform().transformPoint(new DOMPoint(x, y)); return [Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10]; }
export function boxToCanvas(ctx, x0, y0, x1, y1) { const P = [toCanvas(ctx, x0, y0), toCanvas(ctx, x1, y0), toCanvas(ctx, x1, y1), toCanvas(ctx, x0, y1)]; const xs = P.map(p => p[0]), ys = P.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; }
