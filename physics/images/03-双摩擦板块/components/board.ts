import {defineComponent, rect, text, ellipse, path, formula} from '@vmotion/sdk';

// 物理 03「双摩擦板块」演示图：帧 0~3 → 图 1~4。模板见 ../STYLE.md（讲义风）。
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
  T('hk', `物理 · 板块模型 · 双摩擦　${k} / 4`, 60, 28, 20, C.muted, 500);
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

// ---------------- 图 1：受力分析 ----------------
function img1() {
  header(1, '受力分析：地面也有摩擦', '物块 m 在木板 M 上；物块—木板 μ1，木板—地面 μ2（以物块滑上木板为例，向右为正）');
  const cy = 160, ch = 890;
  let x = 30, w = 930;
  card('a', x, cy, w, ch, '① 两个物体分开受力');
  const gy = cy + 400;
  ground('a-g', gy, x + 40, x + w - 40, '');
  T('a-gt', '粗糙 μ2', x + w - 140, gy + 13, 17, C.muted);
  block('a-bd', x + 150, gy, 620, 36, C.B, '', 18);
  T('a-bdl', '木板 M', x + 150, gy - 30, 18, C.B, 700, 620, 'center');
  block('a-m', x + 360, gy - 36, 110, 90, C.A, '物块 m', 19);
  arrow('a-v', x + 375, cy + 200, 90, C.A, 'v0'); T('a-vt', '物块相对木板向右滑', x + 480, cy + 186, 18, C.A, 600, 300);
  arrow('a-f1', x + 355, gy - 60, -110, C.Q, '');
  T('a-f1t', 'f1 = μ1mg（物块受，向后）', x + 40, gy - 100, 18, C.Q, 600, 300);
  arrow('a-f1b', x + 480, gy - 52, 120, C.Q, '');
  T('a-f1bt', "f1'（木板受，向前）", x + 500, gy - 92, 18, C.Q, 600, 260);
  arrow('a-f2', x + 145, gy - 8, -100, C.Eg, '');
  T('a-f2t', 'f2（地面给木板，向后）', x + 40, gy + 16, 18, C.Eg, 600, 260);
  arrow('a-N2', x + 640, gy + 110, -80, C.hl, '', true);
  T('a-N2t', 'N2 = (m+M)g（地面支持力）', x + 655, gy + 60, 18, C.hl, 600, 260);
  eqs('a-e', x + 24, cy + 540, w - 40, [
    ['竖直', 'N_2=Mg+mg=(m+M)g'],
    ['地面', 'f_2=\\mu_2N_2=\\mu_2(m+M)g'],
    ['方向', '!f1 看物块相对木板往哪滑；f2 看木板相对地面往哪走'],
    ['注意', '!最常见错误：写成 μ2Mg，漏了压在上面的物块', C.Q],
  ], 24, 76);

  x = 975; w = 915;
  card('b', x, cy, w, ch, '② 木板动不动？共速后能不能一起走？');
  eqs('b-e', x + 24, cy + 90, w - 40, [
    ['拖力', 'f_1=\\mu_1mg'],
    ['阻力', 'f_{2\\max}=\\mu_2(m+M)g'],
    ['不动', '!μ1mg ≤ μ2(m+M)g：木板静止，地面给的是静摩擦，等于 μ1mg'],
    ['会动', '!μ1mg > μ2(m+M)g：木板加速，a2 = [μ1mg − μ2(m+M)g] / M'],
    ['共速后', '!先假设一起减速，a = μ2g，物块需要摩擦 mμ2g'],
    ['一起', '!μ2 ≤ μ1：一起减速到停'],
    ['分开', '!μ2 > μ1：又相对滑动，物块受的摩擦方向反过来', C.Q],
    ['方法', '!动量不守恒 → 牛顿第二定律 + 运动学，以"共速"为界分段'],
  ], 24, 92);
}

// ---------------- 图 2：例 1 ----------------
function img2() {
  header(2, '例 1：物块滑上静止木板（木板被带动）', 'm = 1 kg，v0 = 6 m/s，M = 1 kg，μ1 = 0.4，μ2 = 0.1，木板足够长');
  const cy = 160, ch = 890;
  let x = 30, w = 900;
  card('a', x, cy, w, ch, '① 判断 → 加速度 → 共速');
  rowTag('a-r1', x + 24, cy + 76, '开始');
  let gy = cy + 220;
  ground('a-g1', gy, x + 24, x + w - 24, '');
  block('a-bd1', x + 60, gy, 600, 28, C.B, '', 16); T('a-bd1l', 'M = 1 kg（静止）', x + 60, gy - 25, 16, C.B, 600, 600, 'center');
  block('a-m1', x + 70, gy - 28, 80, 66, C.A, 'm', 18);
  arrow('a-v1', x + 110, cy + 110, 110, C.A, '6 m/s');
  rowTag('a-r2', x + 24, cy + 250, '共速（t = 1 s）');
  gy = cy + 380;
  ground('a-g2', gy, x + 24, x + w - 24, '');
  block('a-bd2', x + 160, gy, 600, 28, C.B, '', 16);
  block('a-m2', x + 450, gy - 28, 80, 66, C.A, 'm', 18);
  arrow('a-v2', x + 560, gy - 70, 70, C.hl, '一起 2 m/s');
  eqs('a-e', x + 24, cy + 420, w - 40, [
    ['判断', '\\mu_1mg>\\mu_2(m+M)g'],
    ['代入', '0.4\\times1\\times10=4\\ \\mathrm{N}>0.1\\times2\\times10=2\\ \\mathrm{N}'],
    ['物块', 'a_1=\\mu_1g'],
    ['代入', 'a_1=0.4\\times10=4\\ \\mathrm{m/s^2}'],
    ['木板', 'a_2=\\frac{\\mu_1mg-\\mu_2(m+M)g}{M}'],
    ['代入', 'a_2=\\frac{4-2}{1}=2\\ \\mathrm{m/s^2}'],
    ['共速', 'v_0-a_1t=a_2t'],
    ['代入', '6-4t=2t\\Rightarrow t=1\\ \\mathrm{s},\\ v=2\\ \\mathrm{m/s}'],
  ], 22, 56);

  x = 945; w = 945;
  card('b', x, cy, w, ch, '② v–t 图与热量');
  vt('b-g', x + 30, cy + 76, w - 60, 440, 3.4, 7, [1, 2, 3], [2, 4, 6], [
    {pts: [[0, 6], [1, 2]], color: C.A, label: '物块', lt: 0.25, lv: 6.2},
    {pts: [[0, 0], [1, 2]], color: C.B, label: '木板', lt: 0.55, lv: 0.9},
    {pts: [[1, 2], [3, 0]], color: C.hl, label: '共速后一起减速（μ2 ≤ μ1）', lt: 1.6, lv: 2.4},
  ], {pts: [[0, 6], [1, 2], [0, 0]], label: '面积差 = Δx = 3 m', lt: 0.75, lv: 4.6});
  eqs('b-e', x + 24, cy + 540, w - 40, [
    ['位移', 'x_1=v_0t-\\frac{1}{2}a_1t^2,\\ \\ x_2=\\frac{1}{2}a_2t^2'],
    ['代入', 'x_1=6-2=4\\ \\mathrm{m},\\ x_2=1\\ \\mathrm{m},\\ \\Delta x=3\\ \\mathrm{m}'],
    ['热量', 'Q_1=\\mu_1mg\\,\\Delta x,\\ \\ Q_2=\\mu_2(m+M)g\\,x_M'],
    ['代入', 'Q_1=4\\times3=12\\ \\mathrm{J},\\ Q_2=2\\times(1+2)=6\\ \\mathrm{J}'],
    ['检验', '!初动能 ½×1×6² = 18 J = 12 J + 6 J ✓（xM 是木板对地总路程）', C.Ep],
  ], 23, 62);
}

// ---------------- 图 3：例 2 + 易错拓展 ----------------
function img3() {
  header(3, '例 2：木板带着速度，物块轻放上去', 'M = 1 kg 以 6 m/s 运动，m = 1 kg 轻放（初速 0）。左：μ1 = 0.2，μ2 = 0.1　右：μ1 = 0.1，μ2 = 0.2');
  const cy = 160, ch = 890;
  let x = 30, w = 930;
  card('a', x, cy, w, ch, '① μ2 ≤ μ1：共速后一起减速');
  const gy = cy + 200;
  ground('a-g', gy, x + 24, x + w - 24, '');
  block('a-bd', x + 80, gy, 560, 28, C.B, '', 16);
  block('a-m', x + 520, gy - 28, 76, 62, C.A, 'm', 18);
  T('a-mt', '物块 v = 0', x + 480, gy - 128, 18, C.A, 600, 160, 'center');
  arrow('a-vb', x + 680, gy - 14, 110, C.B, '木板 6 m/s');
  T('a-ft', '木板受 μ1mg、μ2(m+M)g 都向后 → 相加', x + 24, cy + 76, 19, C.sub, 600, w - 40);
  vt('a-v', x + 30, cy + 240, w - 60, 360, 3.4, 7, [1, 2, 3], [2, 4, 6], [
    {pts: [[0, 6], [1, 2]], color: C.B, label: '木板', lt: 0.3, lv: 6},
    {pts: [[0, 0], [1, 2]], color: C.A, label: '物块', lt: 0.6, lv: 0.9},
    {pts: [[1, 2], [3, 0]], color: C.hl, label: '一起减速', lt: 1.8, lv: 1.9},
  ]);
  eqs('a-e', x + 24, cy + 620, w - 40, [
    ['物块', 'a_1=\\mu_1g=2\\ \\mathrm{m/s^2}'],
    ['木板', 'a_2=\\frac{\\mu_1mg+\\mu_2(m+M)g}{M}=\\frac{2+2}{1}=4\\ \\mathrm{m/s^2}'],
    ['共速', 'a_1t=v_0-a_2t\\Rightarrow 2t=6-4t\\Rightarrow t=1\\ \\mathrm{s}'],
    ['热量', 'Q_1=2\\times3=6\\ \\mathrm{J},\\ \\ Q_2=2\\times(4+2)=12\\ \\mathrm{J}'],
  ], 22, 62);

  x = 975; w = 915;
  card('b', x, cy, w, ch, '② μ2 > μ1：共速后又分开（易错）');
  vt('b-v', x + 30, cy + 76, w - 60, 420, 2.4, 7, [1, 2], [1, 2, 4, 6], [
    {pts: [[0, 6], [1, 1], [4 / 3, 0], [2.3, 0]], color: C.B, label: '木板（t = 4/3 s 先停）', lt: 0.55, lv: 4.6},
    {pts: [[0, 0], [1, 1], [2, 0]], color: C.A, label: '物块', lt: 0.45, lv: 1.2},
  ]);
  eqs('b-e', x + 24, cy + 520, w - 40, [
    ['共速', '!t = 1 s，v = 1 m/s（a1 = 1 m/s²，a2 = 5 m/s²）'],
    ['假设', 'a=\\mu_2g=2\\ \\mathrm{m/s^2}>\\mu_1g=1\\ \\mathrm{m/s^2}'],
    ['结论', '!物块跟不上 → 相对木板向前滑，摩擦方向反过来', C.Q],
    ['物块', "a_1'=\\mu_1g=1\\ \\mathrm{m/s^2}"],
    ['木板', "a_2'=\\frac{\\mu_2(m+M)g-\\mu_1mg}{M}=\\frac{4-1}{1}=3\\ \\mathrm{m/s^2}"],
    ['结果', '!木板再走 1/6 m 停，物块再走 0.5 m；相对向前滑 1/3 m'],
  ], 22, 58);
}

// ---------------- 图 4：拉力 F ----------------
function img4() {
  header(4, '拉力 F：什么时候相对滑动', '先整体求共同加速度，再隔离看跟不跟得上。例：M = 2 kg，m = 1 kg，μ2 = 0.1');
  const cy = 160, ch = 890;
  let x = 30, w = 930;
  card('a', x, cy, w, ch, '① F 拉木板（μ1 = 0.2）');
  let gy = cy + 200;
  ground('a-g', gy, x + 24, x + w - 24, '');
  block('a-bd', x + 100, gy, 520, 30, C.B, '', 16); T('a-bdl', 'M', x + 100, gy - 26, 16, C.B, 700, 520, 'center');
  block('a-m', x + 300, gy - 30, 90, 70, C.A, 'm', 18);
  arrow('a-F', x + 620, gy - 15, 140, C.hl, 'F');
  nline('a-n', x + 60, x + w - 60, cy + 330, 13, [[3, '3 N'], [9, '9 N']],
    [[0, 3, C.muted, '都不动'], [3, 9, C.Ep, '一起加速'], [9, 13, C.B, '相对滑动']]);
  eqs('a-e', x + 24, cy + 420, w - 40, [
    ['起动', 'F>\\mu_2(m+M)g=3\\ \\mathrm{N}'],
    ['整体', 'a=\\frac{F-\\mu_2(m+M)g}{m+M}'],
    ['隔离', '!物块的加速度只能靠摩擦给，最大 a = μ1g'],
    ['临界', 'F_0=(\\mu_1+\\mu_2)(m+M)g'],
    ['代入', 'F_0=(0.2+0.1)\\times3\\times10=9\\ \\mathrm{N}'],
    ['举例', '!F = 6 N：一起 a = (6 − 3)/3 = 1 m/s²；F = 15 N：a1 = 2，a2 = 5 m/s²'],
  ], 23, 66);

  x = 975; w = 915;
  card('b', x, cy, w, ch, '② F 拉物块（先看木板拖不拖得动）');
  gy = cy + 200;
  ground('b-g', gy, x + 24, x + w - 24, '');
  block('b-bd', x + 100, gy, 520, 30, C.B, '', 16); T('b-bdl', 'M', x + 100, gy - 26, 16, C.B, 700, 520, 'center');
  block('b-m', x + 300, gy - 30, 90, 70, C.A, 'm', 18);
  arrow('b-F', x + 390, gy - 65, 140, C.hl, 'F');
  T('b-nt', 'μ1 = 0.5 时：', x + 24, cy + 250, 17, C.muted, 600, 200);
  nline('b-n', x + 60, x + w - 60, cy + 330, 10, [[3, '3 N'], [6, '6 N']],
    [[0, 3, C.muted, '都不动'], [3, 6, C.Ep, '一起加速'], [6, 10, C.B, '相对滑动']]);
  eqs('b-e', x + 24, cy + 420, w - 40, [
    ['先判', '!比较 μ1mg 和 μ2(m+M)g = 3 N'],
    ['不动', '!μ1 = 0.2：μ1mg = 2 N < 3 N → 木板永远不动，F > 2 N 物块就滑'],
    ['木板', 'a_{\\max}=\\frac{\\mu_1mg-\\mu_2(m+M)g}{M}'],
    ['代入', 'a_{\\max}=\\frac{5-3}{2}=1\\ \\mathrm{m/s^2}\\ \\ (\\mu_1=0.5)'],
    ['临界', 'F_0=(m+M)a_{\\max}+\\mu_2(m+M)g'],
    ['代入', 'F_0=3\\times1+3=6\\ \\mathrm{N}'],
  ], 23, 66);
}

export default defineComponent({
  name: '双摩擦板块演示图',
  parameters: {},
  render(ctx) {
    N = [];
    R('bg', 0, 0, 1920, 1080, C.bg, 0);
    const k = Math.min(3, Math.floor(ctx.seconds * 30 + 0.01));
    [img1, img2, img3, img4][k]();
    return N;
  },
});
