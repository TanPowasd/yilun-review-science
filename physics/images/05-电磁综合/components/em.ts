import {defineComponent, rect, text, ellipse, path, formula} from '@vmotion/sdk';

// 物理 05「电磁学大综合」演示图：帧 0~2 → 图 1~3。模板见 ../STYLE.md（讲义风）。
const FONT = 'Vmotion Sans';
const C = {
  bg: '#f6f3ec', panel: '#ffffff', line: '#ddd7ca', text: '#26282c', muted: '#857f73', sub: '#4a4d52',
  A: '#2f6db5', B: '#b8642c', Q: '#c0392b', Ep: '#2e8b57', Eg: '#7b5aa6', hl: '#1f3a5f', wall: '#6b6b6b',
};
// 讲义风：物体用浅色底 + 同色描边
const TINT: Record<string, string> = {'#2f6db5': '#e4eef9', '#b8642c': '#f7e9dc', '#7b5aa6': '#efe8f6'};

let N: any[] = [];
const T = (id: string, s: string, x: number, y: number, size: number, color = C.text, weight = 400, w = 1600, align: 'left' | 'center' | 'right' = 'left') =>
  N.push(text(id, s, {x, y, width: w, height: size * 1.5, fontSize: size, fill: color, fontWeight: weight, fontFamily: FONT, align, lineHeight: 1.3}));
const R = (id: string, x: number, y: number, w: number, h: number, fill: string, radius = 6, stroke = '', sw = 0) => {
  if (TINT[fill] && !stroke) { stroke = fill; sw = 2.5; fill = TINT[fill]; }
  N.push(rect(id, {x, y, width: w, height: h, fill, radius: Math.min(radius, 4), stroke, strokeWidth: sw}));
};
const P = (id: string, d: string, stroke: string, sw = 3, fill = 'transparent') =>
  N.push(path(id, d, {stroke, strokeWidth: sw, fill}));
const E = (id: string, cx: number, cy: number, r: number, fill: string) =>
  N.push(ellipse(id, {x: cx - r, y: cy - r, width: 2 * r, height: 2 * r, fill}));
const F = (id: string, tex: string, x: number, y: number, size: number, color = C.text, w = 600) =>
  N.push(formula(id, tex, {x, y, width: w, height: size * 1.8, fontSize: size, fill: color}));

function block(id: string, x: number, gy: number, w: number, h: number, color: string, label: string, size = 20) {
  R(id, x, gy - h, w, h, color, 6);
  if (label) T(id + '-l', label, x - 20, gy - h / 2 - size * 0.7, size, color, 700, w + 40, 'center');
}
function arrow(id: string, x: number, y: number, len: number, color: string, label = '', vertical = false) {
  if (vertical) {
    const y2 = y + len, d = Math.sign(len);
    P(id, `M ${x} ${y} L ${x} ${y2}`, color, 4);
    P(id + '-h', `M ${x - 9} ${y2 - d * 14} L ${x} ${y2} L ${x + 9} ${y2 - d * 14}`, color, 4);
    if (label) T(id + '-t', label, x + 12, (y + y2) / 2 - 14, 20, color, 600, 200);
    return;
  }
  if (Math.abs(len) < 6) { if (label) T(id + '-t', label, x - 100, y - 34, 20, color, 600, 200, 'center'); return; }
  const dir = Math.sign(len), x2 = x + len;
  P(id, `M ${x} ${y} L ${x2} ${y}`, color, 4);
  P(id + '-h', `M ${x2 - dir * 14} ${y - 9} L ${x2} ${y} L ${x2 - dir * 14} ${y + 9}`, color, 4);
  if (label) { const lw = Math.max(Math.abs(len) + 100, 200); T(id + '-t', label, (x + x2) / 2 - lw / 2, y - 34, 20, color, 600, lw, 'center'); }
}
function ground(id: string, y: number, x1: number, x2: number, label = '光滑') {
  P(id, `M ${x1} ${y} L ${x2} ${y}`, C.wall, 2.5);
  for (let gx = x1 + 6; gx < x2; gx += 16) P(`${id}-h${gx}`, `M ${gx} ${y + 1} L ${gx - 9} ${y + 10}`, C.wall, 1.5);
  if (label) T(id + '-t', label, x1, y + 13, 17, C.muted);
}
function wall(id: string, x: number, y1: number, y2: number, side: 1 | -1) {
  P(id, `M ${x} ${y1} L ${x} ${y2}`, C.wall, 5);
  for (let y = y1 + 8; y < y2; y += 18) P(`${id}-${y}`, `M ${x} ${y} L ${x + side * 14} ${y - 12}`, C.wall, 2);
}
function spring(id: string, x1: number, x2: number, y: number) {
  const n = 8, amp = 11, L = x2 - x1;
  let d = `M ${x1} ${y}`;
  for (let i = 1; i < 2 * n; i++) d += ` L ${x1 + (L * i) / (2 * n)} ${y + (i % 2 ? -amp : amp)}`;
  d += ` L ${x2} ${y}`;
  P(id, d, '#c8d0e0', 3);
}
function dash(id: string, x1: number, y1: number, x2: number, y2: number, color = C.muted) {
  const L = Math.hypot(x2 - x1, y2 - y1), n = Math.floor(L / 14);
  for (let i = 0; i < n; i += 2) {
    const a = i / n, b = Math.min((i + 1) / n, 1);
    P(`${id}-${i}`, `M ${x1 + (x2 - x1) * a} ${y1 + (y2 - y1) * a} L ${x1 + (x2 - x1) * b} ${y1 + (y2 - y1) * b}`, color, 2);
  }
}
function dim(id: string, x1: number, x2: number, y: number, label: string, color = C.hl, above = false) {
  P(id, `M ${x1} ${y} L ${x2} ${y} M ${x1} ${y - 8} L ${x1} ${y + 8} M ${x2} ${y - 8} L ${x2} ${y + 8}`, color, 2);
  T(id + '-t', label, Math.min(x1, x2) - 60, above ? y - 32 : y + 6, 18, color, 600, Math.abs(x2 - x1) + 120, 'center');
}
function rowTag(id: string, x: number, y: number, s: string) { T(id, s, x, y, 18, C.muted, 600, 420); }

// 半圆弧槽：圆弧凹面朝左上，最低点在 (gx, gy)，槽口在 (gx+r, gy-r)
function groove(id: string, gx: number, gy: number, r: number, color = C.B) {
  let d = `M ${gx - 10} ${gy} L ${gx + r + 24} ${gy} L ${gx + r + 24} ${gy - r} L ${gx + r} ${gy - r}`;
  for (let i = 1; i <= 24; i++) { const a = (i / 24) * Math.PI / 2; d += ` L ${gx + r * Math.cos(a)} ${gy - r + r * Math.sin(a)}`; }
  d += ` L ${gx - 10} ${gy} Z`;
  P(id, d, color, 2.5, TINT[color] || color);
}

function card(id: string, x: number, y: number, w: number, h: number, title: string) {
  R(id + '-bg', x, y, w, h, C.panel, 4, C.line, 1.5);
  T(id + '-t', title, x + 24, y + 16, 27, C.hl, 700, w - 40);
  P(id + '-u', `M ${x + 24} ${y + 60} L ${x + w - 24} ${y + 60}`, C.line, 1.5);
}
// 方程区：tag 为"代入"时缩进变灰；tex 以 ! 开头时当普通文字
function eqs(id: string, x: number, y: number, w: number, rows: [string, string, string?][], size = 24, gap = 50) {
  rows.forEach(([tag, tex, col], i) => {
    const sub = tag === '代入';
    const yy = y + i * gap;
    T(`${id}-k${i}`, tag, x, yy + 6, sub ? 16 : 19, sub ? C.muted : (col || C.hl), sub ? 500 : 700, 90);
    const fc = sub ? C.sub : (col && tag === '注意' ? col : C.text);
    if (tex.startsWith('!')) T(`${id}-f${i}`, tex.slice(1), x + 74, yy + 2, size - 2, tag === '注意' ? C.Q : fc, 600, w - 80);
    else F(`${id}-f${i}`, tex, x + 74, yy - 2, size, fc, w - 80);
  });
}
function header(k: number, title: string, sub: string) {
  T('hk', `物理 · 电磁学 · 大综合　${k} / 3`, 60, 28, 20, C.muted, 500);
  T('ht', title, 60, 56, 42, C.hl, 700);
  T('hs', sub, 60, 114, 21, C.muted, 500, 1800);
  P('hr', 'M 60 150 L 1860 150', C.hl, 2);
}

type Ser = {pts: number[][]; color: string; label: string; lt: number; lv: number};
function vt(id: string, x: number, y: number, w: number, h: number, tmax: number, vmax: number, tT: number[], vT: number[], ser: Ser[], shade?: {pts: number[][]; label: string; lt: number; lv: number}) {
  const ox = x + 60, oy = y + h - 34, pw = w - 100, ph = h - 60;
  const sx = (t: number) => ox + (t / tmax) * pw, sy = (v: number) => oy - (v / vmax) * ph;
  if (shade) {
    P(id + '-sh', 'M ' + shade.pts.map(([t, v]) => `${sx(t)} ${sy(v)}`).join(' L ') + ' Z', 'transparent', 0, '#e9eef7');
    T(id + '-sht', shade.label, sx(shade.lt) - 150, sy(shade.lv), 18, C.hl, 600, 300, 'center');
  }
  P(id + '-ax', `M ${ox} ${oy} L ${ox + pw + 20} ${oy} M ${ox} ${oy} L ${ox} ${oy - ph - 20}`, C.wall, 2);
  P(id + '-ah', `M ${ox + pw + 10} ${oy - 6} L ${ox + pw + 20} ${oy} L ${ox + pw + 10} ${oy + 6} M ${ox - 6} ${oy - ph - 10} L ${ox} ${oy - ph - 20} L ${ox + 6} ${oy - ph - 10}`, C.wall, 2);
  T(id + '-tl', 't / s', ox + pw - 10, oy + 8, 17, C.muted, 500, 80);
  T(id + '-vl', 'v / (m/s)', ox + 10, oy - ph - 30, 17, C.muted, 500, 120);
  T(id + '-o', '0', ox - 24, oy + 2, 16, C.muted, 500, 20);
  tT.forEach((t, i) => { P(`${id}-tt${i}`, `M ${sx(t)} ${oy} L ${sx(t)} ${oy + 6}`, C.wall, 2); T(`${id}-ttl${i}`, String(t), sx(t) - 30, oy + 8, 16, C.muted, 500, 60, 'center'); });
  vT.forEach((v, i) => { P(`${id}-vt${i}`, `M ${ox - 6} ${sy(v)} L ${ox} ${sy(v)}`, C.wall, 2); T(`${id}-vtl${i}`, String(v), ox - 46, sy(v) - 11, 16, C.muted, 500, 36, 'right'); });
  ser.forEach((s, i) => {
    P(`${id}-s${i}`, 'M ' + s.pts.map(([t, v]) => `${sx(t)} ${sy(v)}`).join(' L '), s.color, 3.5);
    T(`${id}-sl${i}`, s.label, sx(s.lt), sy(s.lv), 18, s.color, 700, 260);
  });
  return {sx, sy};
}
function nline(id: string, x1: number, x2: number, y: number, max: number, pts: [number, string][], regs: [number, number, string, string][]) {
  const sx = (v: number) => x1 + ((x2 - x1) * v) / max;
  P(id, `M ${x1} ${y} L ${x2} ${y}`, C.wall, 2);
  P(id + '-h', `M ${x2 - 10} ${y - 6} L ${x2} ${y} L ${x2 - 10} ${y + 6}`, C.wall, 2);
  T(id + '-u', 'F / N', x2 - 20, y + 10, 16, C.muted, 500, 60);
  regs.forEach(([a, b, col, lab], i) => {
    R(`${id}-r${i}`, sx(a) + 2, y - 14, sx(b) - sx(a) - 4, 8, col, 2, '', 0);
    T(`${id}-rl${i}`, lab, sx(a), y - 46, 18, col, 700, sx(b) - sx(a), 'center');
  });
  T(id + '-z', '0', sx(0) - 10, y + 10, 16, C.muted, 500, 20, 'center');
  pts.forEach(([v, lab], i) => { P(`${id}-p${i}`, `M ${sx(v)} ${y - 6} L ${sx(v)} ${y + 6}`, C.wall, 2); T(`${id}-pl${i}`, lab, sx(v) - 80, y + 10, 16, C.text, 600, 160, 'center'); });
}

function crosses(id: string, x1: number, y1: number, x2: number, y2: number, step = 50) {
  let i = 0;
  for (let yy = y1 + step / 2; yy < y2; yy += step)
    for (let xx = x1 + step / 2; xx < x2; xx += step) T(`${id}${i++}`, '×', xx - 10, yy - 13, 22, '#9aa7b8', 500, 20, 'center');
}
function poly(id: string, pts: number[][], color: string, w = 3) {
  P(id, 'M ' + pts.map(([a, b]) => `${a} ${b}`).join(' L '), color, w);
}
function vline(id: string, x: number, y1: number, y2: number, color: string, w = 3) { P(id, `M ${x} ${y1} L ${x} ${y2}`, color, w); }

// ---------------- 图 1：带电粒子 ----------------
function img1() {
  header(1, '带电粒子：电场里偏转，磁场里转圈', '例 1、例 2：比荷 q/m = 1×10^8 C/kg，经 U1 = 200 V 加速后 v0 = 2×10^5 m/s');
  const cy = 160, ch = 890;
  let x = 30, w = 930;
  card('a', x, cy, w, ch, '① 电场偏转：类平抛');
  const pl = x + 280, pr = x + 680, top = cy + 150, bot = cy + 350, mid = cy + 250;
  R('a-pt', pl, top - 8, pr - pl, 8, '#e3e7ee', 2, C.hl, 2); R('a-pb', pl, bot, pr - pl, 8, '#e3e7ee', 2, C.hl, 2);
  T('a-pp', '+', pl - 30, top - 18, 24, C.Q, 700, 20); T('a-pm', '−', pl - 30, bot - 12, 24, C.A, 700, 20);
  T('a-u2', 'U2 = 80 V', pr + 20, mid - 12, 18, C.hl, 600, 140);
  arrow('a-v0', x + 80, mid - 30, 120, C.A, 'v0');
  const tr: number[][] = [[x + 60, mid]];
  for (let i = 0; i <= 20; i++) { const s = i / 20; tr.push([pl + s * 400, mid + 80 * s * s]); }
  tr.push([pr + 200, mid + 80 + 80]);
  poly('a-tr', tr, C.A, 3.5);
  dash('a-ext', pr, mid + 80, pl + 200, mid);
  T('a-mid', '反向延长线过板长中点', pl + 120, mid - 40, 17, C.muted, 600, 220, 'center');
  dim('a-dl', pl, pr, top - 40, 'L = 0.1 m', C.hl, true);
  T('a-dd', 'd = 0.05 m', pl + 10, bot + 20, 17, C.hl, 600, 160);
  T('a-y', 'y', pr + 8, mid + 30, 18, C.Q, 700, 30);
  dash('a-yd', pr, mid, pr, mid + 80, C.Q);
  eqs('a-e', x + 24, cy + 450, w - 40, [
    ['加速', 'qU_1=\\frac{1}{2}mv_0^2\\Rightarrow v_0=\\sqrt{2qU_1/m}=2\\times10^5\\ \\mathrm{m/s}'],
    ['侧移', 'y=\\frac{U_2L^2}{4U_1d}=\\frac{80\\times0.01}{4\\times200\\times0.05}=0.02\\ \\mathrm{m}'],
    ['判断', '!y = 0.02 m < d/2 = 0.025 m，能射出'],
    ['偏角', '\\tan\\theta=\\frac{U_2L}{2U_1d}=\\frac{80\\times0.1}{2\\times200\\times0.05}=0.4'],
    ['注意', '!先加速后偏转：y、θ 与 q、m 无关', C.Q],
  ], 22, 72);

  x = 975; w = 915;
  card('b', x, cy, w, ch, '② 磁场：找圆心、定半径、算时间');
  const bx1 = x + 330, bx2 = x + 480, y0 = cy + 420, r = 300, cx0 = bx1, cyc = y0 - r;
  R('b-f', bx1, cy + 80, bx2 - bx1, 400, '#eef2f8', 0, '', 0);
  vline('b-l1', bx1, cy + 80, cy + 480, C.hl, 2); vline('b-l2', bx2, cy + 80, cy + 480, C.hl, 2);
  crosses('b-x', bx1, cy + 80, bx2, cy + 480, 50);
  T('b-B', 'B = 0.1 T（垂直纸面向里）', bx2 + 20, cy + 90, 17, C.hl, 600, 300);
  dim('b-dd', bx1, bx2, cy + 500, 'd = 0.01 m', C.hl);
  poly('b-in', [[x + 120, y0], [bx1, y0]], C.A, 3.5);
  arrow('b-v', x + 150, y0 - 40, 100, C.A, 'v');
  const arc: number[][] = [];
  for (let i = 0; i <= 20; i++) { const ph = (Math.PI / 6) * i / 20; arc.push([cx0 + r * Math.sin(ph), cyc + r * Math.cos(ph)]); }
  const ex = arc[20];
  arc.push([ex[0] + 300 * Math.cos(Math.PI / 6), ex[1] - 300 * Math.sin(Math.PI / 6)]);
  poly('b-arc', arc, C.A, 3.5);
  dash('b-r1', cx0, cyc, cx0, y0, C.Q); dash('b-r2', cx0, cyc, ex[0], ex[1], C.Q);
  R('b-o', cx0 - 5, cyc - 5, 10, 10, C.Q, 5, '', 0);
  T('b-ot', '圆心 O', cx0 - 90, cyc - 12, 17, C.Q, 700, 80);
  T('b-rt', 'r', cx0 - 24, cyc + 140, 18, C.Q, 700, 20);
  T('b-th', '30°', cx0 + 12, cyc + 60, 18, C.Q, 700, 50);
  eqs('b-e', x + 24, cy + 560, w - 40, [
    ['半径', 'r=\\frac{mv}{qB}=\\frac{2\\times10^5}{10^8\\times0.1}=0.02\\ \\mathrm{m}'],
    ['偏角', '\\sin\\theta=\\frac{d}{r}=0.5\\Rightarrow\\theta=30^\\circ'],
    ['时间', 't=\\frac{\\theta}{360^\\circ}T=\\frac{1}{12}\\times\\frac{2\\pi m}{qB}\\approx5.2\\times10^{-8}\\ \\mathrm{s}'],
    ['注意', '!圆心角 = 速度偏转角；洛伦兹力不做功', C.Q],
  ], 22, 72);
}

// ---------------- 图 2：单棒 ----------------
function img2() {
  header(2, '单棒模型：越快阻力越大，最后匀速', '例 3：光滑导轨 L = 0.5 m，B = 1 T，回路总电阻 R总 = R + r = 1 Ω（右侧式中 R 即 R总），棒 m = 0.1 kg');
  const cy = 160, ch = 890;
  let x = 30, w = 930;
  card('a', x, cy, w, ch, '① 电路与受力');
  const r1 = cy + 130, r2 = cy + 330, lx = x + 90, rx = x + 860, rod = x + 520;
  R('a-f', lx, r1, rx - lx, r2 - r1, '#eef2f8', 0, '', 0);
  crosses('a-x', lx + 40, r1, rx, r2, 50);
  P('a-rails', `M ${lx} ${r1} L ${rx} ${r1} M ${lx} ${r2} L ${rx} ${r2}`, C.wall, 3);
  vline('a-rl', lx, r1, r2, C.wall, 3);
  R('a-res', lx - 14, r1 + 60, 28, 80, '#ffffff', 3, C.hl, 2.5);
  T('a-rest', 'R', lx + 22, r1 + 88, 20, C.hl, 700, 30);
  R('a-rod', rod - 7, r1 - 20, 14, r2 - r1 + 40, '#f7e9dc', 3, C.B, 2.5);
  T('a-rodt', '棒 m', rod - 30, r1 - 52, 18, C.B, 700, 60, 'center');
  arrow('a-F', rod + 14, r1 + 70, 130, C.A, '');
  T('a-Ft', '拉力 F', rod + 30, r1 + 30, 18, C.A, 700, 120);
  arrow('a-Fa', rod - 14, r1 + 140, -130, C.Q, '');
  T('a-Fat', '安培力', rod - 200, r1 + 152, 18, C.Q, 700, 160);
  T('a-L', 'L', rod + 20, r2 - 40, 18, C.hl, 700, 20);
  eqs('a-e', x + 24, cy + 410, w - 40, [
    ['电动势', 'E=BLv'],
    ['电流', 'I=\\frac{E}{R+r}=\\frac{BLv}{R+r}'],
    ['安培力', 'F_A=BIL=\\frac{B^2L^2v}{R+r}'],
    ['收尾', 'F=\\frac{B^2L^2v_m}{R+r}\\Rightarrow v_m=\\frac{FR}{B^2L^2}'],
    ['代入', 'v_m=\\frac{0.5\\times1}{1\\times0.25}=2\\ \\mathrm{m/s}'],
    ['注意', '!安培力总是阻碍运动；电流要算上棒的内阻 r', C.Q],
  ], 22, 72);

  x = 975; w = 915;
  card('b', x, cy, w, ch, '② v–t 图，以及撤去拉力后滑多远');
  const pts: number[][] = [];
  for (let i = 0; i <= 40; i++) { const t = (2 * i) / 40; pts.push([t, 2 * (1 - Math.exp(-t / 0.4))]); }
  const g = vt('b-g', x + 30, cy + 76, w - 60, 360, 2, 2.6, [0.4, 1, 2], [1, 2], [{pts, color: C.B, label: '恒力 F 拉动', lt: 0.15, lv: 1.7}]);
  dash('b-as', g.sx(0), g.sy(2), g.sx(2), g.sy(2), C.Q);
  T('b-ast', '收尾速度 2 m/s', g.sx(1.2), g.sy(2) - 30, 18, C.Q, 700, 200);
  eqs('b-e', x + 24, cy + 480, w - 40, [
    ['动量', 'BLq=mv_0\\Rightarrow q=\\frac{0.1\\times4}{1\\times0.5}=0.8\\ \\mathrm{C}'],
    ['距离', 'q=\\frac{BLx}{R}\\Rightarrow x=\\frac{qR}{BL}=\\frac{0.8\\times1}{0.5}=1.6\\ \\mathrm{m}'],
    ['热', 'Q=\\frac{1}{2}mv_0^2=\\frac{1}{2}\\times0.1\\times4^2=0.8\\ \\mathrm{J}'],
    ['口诀', '!最大速度 → 受力平衡；距离和电荷量 → 动量定理；热 → 能量守恒', C.Ep],
  ], 22, 80);
  T('b-pre', '撤去拉力，棒以 v0 = 4 m/s 滑行：', x + 24, cy + 446, 19, C.sub, 600, 600);
}

// ---------------- 图 3：双棒与线框 ----------------
function img3() {
  header(3, '双棒与线框', '例 4：等宽光滑导轨，两棒各 0.1 kg，棒 1 以 4 m/s 运动；例 5：线框 0.1 kg、边长 0.5 m、R = 1 Ω');
  const cy = 160, ch = 890;
  let x = 30, w = 1060;
  card('a', x, cy, w, ch, '① 等宽双棒：和完全非弹性碰撞一样');
  const r1 = cy + 110, r2 = cy + 250, lx = x + 60, rx = x + w - 60;
  R('a-f', lx, r1, rx - lx, r2 - r1, '#eef2f8', 0, '', 0);
  crosses('a-x', lx, r1, rx, r2, 46);
  P('a-rails', `M ${lx} ${r1} L ${rx} ${r1} M ${lx} ${r2} L ${rx} ${r2}`, C.wall, 3);
  R('a-b1', x + 260 - 7, r1 - 16, 14, r2 - r1 + 32, '#e3edf8', 3, C.A, 2.5);
  R('a-b2', x + 640 - 7, r1 - 16, 14, r2 - r1 + 32, '#f7e9dc', 3, C.B, 2.5);
  T('a-b1t', '棒 1', x + 230, r2 + 22, 18, C.A, 700, 60, 'center'); T('a-b2t', '棒 2', x + 610, r2 + 22, 18, C.B, 700, 60, 'center');
  arrow('a-v1', x + 275, r1 + 40, 110, C.A, '4 m/s');
  T('a-v2', '静止', x + 660, r1 + 50, 18, C.B, 600, 80);
  const p1: number[][] = [], p2: number[][] = [];
  for (let i = 0; i <= 40; i++) { const t = i / 40; const e = Math.exp(-t / 0.2); p1.push([t, 2 + 2 * e]); p2.push([t, 2 - 2 * e]); }
  vt('a-g', x + 30, cy + 300, 480, 300, 1, 4.6, [0.5, 1], [2, 4], [
    {pts: p1, color: C.A, label: '棒 1', lt: 0.06, lv: 4.3}, {pts: p2, color: C.B, label: '棒 2', lt: 0.25, lv: 0.6}]);
  eqs('a-e', x + 540, cy + 330, 500, [
    ['动量', 'm_1v_0=(m_1+m_2)v'],
    ['代入', '0.1\\times4=0.2v\\Rightarrow v=2\\ \\mathrm{m/s}'],
    ['热', 'Q=0.8-0.4=0.4\\ \\mathrm{J}'],
    ['电荷', 'BLq=m_2v\\Rightarrow q=0.4\\ \\mathrm{C}'],
    ['间距', '\\Delta x=\\frac{qR}{BL}=0.8\\ \\mathrm{m}'],
  ], 22, 58);
  eqs('a-e2', x + 24, cy + 660, w - 40, [
    ['为什么', '!两棒电流相同、长度相同 → 安培力等大反向 → 系统动量守恒'],
    ['注意', '!导轨不等宽：安培力不相等，动量不守恒；末态 BL1v1 = BL2v2', C.Q],
  ], 22, 70);

  x = 1105; w = 785;
  card('b', x, cy, w, ch, '② 线框匀速穿过磁场');
  const fy1 = cy + 400, fy2 = cy + 550, fl = x + 60, fr = x + w - 60, sq = 150, sx0 = x + 200;
  R('b-f', fl, fy1, fr - fl, fy2 - fy1, '#eef2f8', 0, '', 0);
  crosses('b-x', fl, fy1, fr, fy2, 50);
  P('b-fb', `M ${fl} ${fy1} L ${fr} ${fy1} M ${fl} ${fy2} L ${fr} ${fy2}`, C.hl, 2);
  R('b-sq', sx0, cy + 120, sq, sq, 'transparent', 0, C.B, 4);
  T('b-sqt', '线框', sx0 + sq + 16, cy + 180, 18, C.B, 700, 60);
  dim('b-h', cy + 120 + sq, fy1, sx0 - 40, '', C.hl);
  P('b-hl', `M ${sx0 - 40} ${cy + 120 + sq} L ${sx0 - 40} ${fy1}`, C.hl, 2);
  T('b-ht', 'h', sx0 - 70, (cy + 270 + fy1) / 2 - 12, 20, C.hl, 700, 20);
  arrow('b-v', sx0 + sq / 2, cy + 120 + sq + 10, 90, C.A, '', true);
  T('b-vt', 'v', sx0 + sq / 2 + 12, cy + 300, 18, C.A, 700, 20);
  T('b-H', '磁场宽度 = L = 0.5 m', fr - 260, fy2 + 12, 17, C.hl, 600, 260);
  eqs('b-e', x + 24, cy + 610, w - 40, [
    ['匀速', 'mg=\\frac{B^2L^2v}{R}\\Rightarrow v=\\frac{0.1\\times10\\times1}{0.25}=4\\ \\mathrm{m/s}'],
    ['高度', 'h=\\frac{v^2}{2g}=\\frac{16}{20}=0.8\\ \\mathrm{m}'],
    ['热', 'Q=mg\\cdot2L=0.1\\times10\\times1=1\\ \\mathrm{J}'],
  ], 22, 70);
}

export default defineComponent({
  name: '电磁综合演示图',
  parameters: {},
  render(ctx) {
    N = [];
    R('bg', 0, 0, 1920, 1080, C.bg, 0);
    const k = Math.min(2, Math.floor(ctx.seconds * 30 + 0.01));
    [img1, img2, img3][k]();
    return N;
  },
});
