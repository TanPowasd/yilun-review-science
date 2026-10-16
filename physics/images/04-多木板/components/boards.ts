import {defineComponent, rect, text, ellipse, path, formula} from '@vmotion/sdk';

// 物理 04「多木板板块」演示图：帧 0~2 → 图 1~3。模板见 ../STYLE.md（讲义风）。
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
  T('hk', `物理 · 板块模型 · 多块木板　${k} / 3`, 60, 28, 20, C.muted, 500);
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

function grey(id: string, x: number, gy: number, w: number, h: number, label: string) {
  R(id, x, gy - h, w, h, '#efefef', 4, '#a8a8a8', 2);
  if (label) T(id + '-l', label, x, gy - h / 2 - 11, 16, '#8a8a8a', 700, w, 'center');
}
function board(id: string, x: number, gy: number, w: number, h: number, label: string) {
  block(id, x, gy, w, h, C.B, '', 16);
  if (label) T(id + '-l', label, x, gy - h / 2 - 11, 16, C.B, 700, w, 'center');
}

// ---------------- 图 1：谁会被推动 ----------------
function img1() {
  header(1, '多块木板并排：物块在哪块，看哪块', '每块木板质量 M，物块 m；物块—木板 μ1，木板—地面 μ2。板和板之间只能推、不能拉');
  const cy = 160, ch = 890;
  let x = 30, w = 930;
  card('a', x, cy, w, ch, '① 物块在 A 上：A 要动，必须推着 B');
  let gy = cy + 300;
  ground('a-g', gy, x + 24, x + w - 24, '');
  board('a-A', x + 60, gy, 400, 30, 'A');
  board('a-B', x + 460, gy, 400, 30, 'B');
  block('a-m', x + 200, gy - 30, 90, 70, C.A, 'm', 18);
  arrow('a-v', x + 210, cy + 150, 90, C.A, 'v0');
  arrow('a-f1', x + 300, gy - 50, 110, C.Q, '');
  T('a-f1t', 'μ1mg（推 A 向前）', x + 300, gy - 92, 18, C.Q, 600, 240);
  arrow('a-p', x + 430, gy - 15, 50, C.hl, '');
  T('a-pt', 'A 推 B', x + 410, gy - 62, 17, C.hl, 600, 100, 'center');
  arrow('a-fa', x + 300, gy + 40, -100, C.Eg, '');
  T('a-fat', 'μ2(m+M)g', x + 180, gy + 52, 18, C.Eg, 600, 160, 'center');
  arrow('a-fb', x + 700, gy + 40, -100, C.Eg, '');
  T('a-fbt', 'μ2Mg', x + 580, gy + 52, 18, C.Eg, 600, 160, 'center');
  eqs('a-e', x + 24, cy + 440, w - 40, [
    ['条件', '\\mu_1mg>\\mu_2(m+M)g+\\mu_2Mg=\\mu_2(m+2M)g'],
    ['动', '!满足：A、B 一起加速，a = [μ1mg − μ2(m+2M)g] / (2M)'],
    ['不动', '!不满足：两块板都不动，地面给静摩擦'],
    ['注意', '!只看 A 的 μ2(m+M)g 就判断"A 会动"——漏了被挤的 B', C.Q],
  ], 23, 80);

  x = 975; w = 915;
  card('b', x, cy, w, ch, '② 物块在 B 上：只看 B，A 被留下');
  gy = cy + 300;
  ground('b-g', gy, x + 24, x + w - 24, '');
  grey('b-A', x + 40, gy, 400, 30, 'A');
  board('b-B', x + 440, gy, 400, 30, 'B');
  block('b-m', x + 560, gy - 30, 90, 70, C.A, 'm', 18);
  arrow('b-f1', x + 660, gy - 50, 110, C.Q, '');
  T('b-f1t', 'μ1mg（推 B 向前）', x + 660, gy - 92, 18, C.Q, 600, 240);
  arrow('b-fb', x + 700, gy + 40, -100, C.Eg, '');
  T('b-fbt', 'μ2(m+M)g', x + 580, gy + 52, 18, C.Eg, 600, 160, 'center');
  T('b-At', '没有物块：只受阻力', x + 40, gy + 52, 18, C.muted, 600, 400, 'center');
  eqs('b-e', x + 24, cy + 440, w - 40, [
    ['条件', '\\mu_1mg>\\mu_2(m+M)g'],
    ['B', 'a_B=\\frac{\\mu_1mg-\\mu_2(m+M)g}{M}'],
    ['A', '!若 A 原来在动：只受 μ2Mg，以 μ2g 减速，和 B 分开'],
    ['n 块', '\\mu_1mg>\\mu_2(m+M)g+(n-k)\\mu_2Mg'],
    ['说明', '!物块在第 k 块：第 k 块到第 n 块一起被推动，前面 k−1 块不动'],
  ], 23, 80);
}

// ---------------- 图 2：例 1 ----------------
function img2() {
  header(2, '例 1：滑上 A 时不动，滑上 B 时 B 才动', '每块 M = 1 kg、长 L = 3 m；m = 1 kg，v0 = 7 m/s；μ1 = 0.4，μ2 = 0.15');
  const cy = 160, ch = 890;
  let x = 30, w = 900;
  card('a', x, cy, w, ch, '① 分两段判断');
  rowTag('a-r1', x + 24, cy + 76, '刚滑上 A');
  let gy = cy + 200;
  ground('a-g1', gy, x + 24, x + w - 24, '');
  board('a-A1', x + 40, gy, 410, 26, 'A'); board('a-B1', x + 450, gy, 410, 26, 'B');
  block('a-m1', x + 50, gy - 26, 64, 54, C.A, 'm', 17);
  arrow('a-v1', x + 90, gy - 100, 100, C.A, '7 m/s');
  rowTag('a-r2', x + 24, cy + 226, '刚滑到 B（t = 0.5 s）');
  gy = cy + 340;
  ground('a-g2', gy, x + 24, x + w - 24, '');
  grey('a-A2', x + 40, gy, 410, 26, 'A'); board('a-B2', x + 450, gy, 410, 26, 'B');
  block('a-m2', x + 460, gy - 26, 64, 54, C.A, 'm', 17);
  arrow('a-v2', x + 540, gy - 50, 80, C.A, '5 m/s');
  eqs('a-e', x + 24, cy + 390, w - 40, [
    ['A 上', '\\mu_1mg<\\mu_2(m+2M)g'],
    ['代入', '0.4\\times1\\times10=4\\ \\mathrm{N}<0.15\\times3\\times10=4.5\\ \\mathrm{N}'],
    ['结论', '!A、B 都不动，物块以 μ1g = 4 m/s² 匀减速'],
    ['速度', 'v_1^2=v_0^2-2\\mu_1gL'],
    ['代入', 'v_1^2=49-2\\times4\\times3=25\\Rightarrow v_1=5\\ \\mathrm{m/s}'],
    ['B 上', '\\mu_1mg>\\mu_2(m+M)g'],
    ['代入', '4\\ \\mathrm{N}>0.15\\times2\\times10=3\\ \\mathrm{N}'],
    ['结论', '!B 开始动，A 留在原地'],
  ], 22, 58);

  x = 945; w = 945;
  card('b', x, cy, w, ch, '② v–t 图与 B 上的运动');
  const g = vt('b-g', x + 30, cy + 76, w - 60, 400, 2.4, 8, [0.5, 1.5, 2], [1, 5, 7], [
    {pts: [[0, 7], [0.5, 5], [1.5, 1], [1.5 + 2 / 3, 0]], color: C.A, label: '物块', lt: 0.15, lv: 7.6},
    {pts: [[0, 0], [0.5, 0], [1.5, 1], [1.5 + 2 / 3, 0]], color: C.B, label: '木板 B', lt: 1.0, lv: 1.3},
  ]);
  dash('b-d1', g.sx(0.5), g.sy(0), g.sx(0.5), g.sy(7.6));
  T('b-z1', 'A 上', g.sx(0) + 30, g.sy(3), 18, C.muted, 600, 120);
  T('b-z2', 'B 上', g.sx(0.9), g.sy(3), 18, C.muted, 600, 120);
  T('b-z3', '一起减速', g.sx(1.6), g.sy(1.6), 18, C.hl, 600, 160);
  eqs('b-e', x + 24, cy + 500, w - 40, [
    ['B', 'a_B=\\frac{\\mu_1mg-\\mu_2(m+M)g}{M}=\\frac{4-3}{1}=1\\ \\mathrm{m/s^2}'],
    ['共速', 'v_1-a_1t=a_Bt'],
    ['代入', '5-4t=t\\Rightarrow t=1\\ \\mathrm{s},\\ v=1\\ \\mathrm{m/s}'],
    ['位移', '\\Delta x=x_1-x_B=3-0.5=2.5\\ \\mathrm{m}<L'],
    ['结论', '!不滑出 B；之后一起以 1.5 m/s² 减速，再走 1/3 m'],
    ['检验', '!12 J（A 上）+ 10 J + 2.5 J = 24.5 J = ½×1×7² ✓', C.Ep],
  ], 22, 60);
}

// ---------------- 图 3：n 块 ----------------
function img3() {
  header(3, '例 2：5 块木板，滑到第几块才开始动', '每块 M = 1 kg；m = 1 kg；μ1 = 0.45，μ2 = 0.1');
  const cy = 160, ch = 890, x = 30, w = 1860;
  card('a', x, cy, w, ch, '逐块判断：只算物块所在板和它前面的板');
  const gy = cy + 260, bw = 340;
  ground('a-g', gy, x + 40, x + w - 40, '');
  for (let i = 0; i < 5; i++) {
    const bx = x + 80 + i * bw;
    if (i < 2) grey(`a-b${i}`, bx, gy, bw, 30, `第 ${i + 1} 块（不动）`);
    else board(`a-b${i}`, bx, gy, bw, 30, `第 ${i + 1} 块`);
  }
  block('a-m', x + 80 + 2 * bw + 60, gy - 30, 90, 70, C.A, 'm', 18);
  arrow('a-f1', x + 80 + 2 * bw + 160, gy - 50, 110, C.Q, '');
  T('a-f1t', 'μ1mg', x + 80 + 2 * bw + 160, gy - 92, 18, C.Q, 600, 120);
  dim('a-dm', x + 80 + 2 * bw, x + 80 + 5 * bw, gy + 40, '第 3、4、5 块一起被推动', C.B);
  eqs('a-e', x + 24, cy + 360, 1040, [
    ['条件', '\\mu_1mg>\\mu_2(m+M)g+(n-k)\\mu_2Mg'],
    ['左边', '\\mu_1mg=0.45\\times1\\times10=4.5\\ \\mathrm{N}'],
    ['右边', '0.1\\times2\\times10+(5-k)\\times0.1\\times1\\times10=7-k'],
    ['结论', '!滑到第 3 块开始动，第 3、4、5 块一起动', C.A],
    ['加速', 'a=\\frac{\\mu_1mg-\\mu_2(m+3M)g}{3M}'],
    ['代入', 'a=\\frac{4.5-4}{3}=\\frac{1}{6}\\ \\mathrm{m/s^2}'],
    ['注意', '!物块后面的板不算；只有物块所在那块要加 m', C.Q],
  ], 24, 70);
  // 逐块代入小表
  const tx = x + 1140, ty = cy + 360, cw = [180, 220, 230], rh = 62;
  const rows = [['物块在第 k 块', '右边 7 − k', '4.5 N 推得动？'], ['1', '6 N', '不动'], ['2', '5 N', '不动'], ['3', '4 N', '动'], ['4', '3 N', '动'], ['5', '2 N', '动']];
  const tw = cw[0] + cw[1] + cw[2];
  rows.forEach((r, i) => {
    const yy = ty + i * rh;
    if (i === 0) R(`t-h`, tx, yy, tw, rh, '#eef2f8', 0, '', 0);
    if (i === 3) R(`t-k`, tx, yy, tw, rh, '#f7e9dc', 0, '', 0);
    let cx = tx;
    r.forEach((c, j) => {
      const col = i === 0 ? C.hl : (j === 2 ? (c === '动' ? C.B : C.muted) : C.text);
      T(`t-${i}-${j}`, c, cx, yy + 18, 19, col, i === 0 || j === 2 ? 700 : 500, cw[j], 'center');
      cx += cw[j];
    });
    P(`t-l${i}`, `M ${tx} ${yy + rh} L ${tx + tw} ${yy + rh}`, C.line, 1.5);
  });
  P('t-top', `M ${tx} ${ty} L ${tx + tw} ${ty}`, C.hl, 2);
}

export default defineComponent({
  name: '多木板演示图',
  parameters: {},
  render(ctx) {
    N = [];
    R('bg', 0, 0, 1920, 1080, C.bg, 0);
    const k = Math.min(2, Math.floor(ctx.seconds * 30 + 0.01));
    [img1, img2, img3][k]();
    return N;
  },
});
