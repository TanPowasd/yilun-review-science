import {defineComponent, rect, text, ellipse, path, formula} from '@vmotion/sdk';

// 物理 02「动量能量模型拓展」演示图：每一帧是一张静态图（帧 0~7 → 图 1~8）。
// 规则：每张卡片先画"前 → 后"示意图，再写方程——先字母式，下一行"代入"。
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
  T('hk', `物理 · 动量与能量 · 模型拓展　${k} / 8`, 60, 28, 20, C.muted, 500);
  T('ht', title, 60, 56, 42, C.hl, 700);
  T('hs', sub, 60, 114, 21, C.muted, 500, 1800);
  P('hr', 'M 60 150 L 1860 150', C.hl, 2);
}

// ---------------- 图 1：碰撞 ----------------
function img1() {
  header(1, '碰撞的拓展', '动碰动弹性 · 三个特殊质量 · 碰撞类型未知时求速度范围（取向右为正）');
  const cy = 160, ch = 890;
  // A 动碰动
  let x = 30, w = 610;
  card('a', x, cy, w, ch, '① 动碰动弹性碰撞');
  rowTag('a-r1', x + 24, cy + 80, '碰前');
  ground('a-g1', cy + 230, x + 24, x + w - 24);
  block('a-A', x + 110, cy + 230, 60, 60, C.A, 'A 1kg', 17); arrow('a-vA', x + 140, cy + 140, 4 * 22, C.A, '4 m/s');
  block('a-B', x + 330, cy + 230, 84, 84, C.B, 'B 2kg', 17); arrow('a-vB', x + 372, cy + 125, 22, C.B, '1 m/s');
  rowTag('a-r2', x + 24, cy + 270, '碰后');
  ground('a-g2', cy + 420, x + 24, x + w - 24);
  block('a-A2', x + 200, cy + 420, 60, 60, C.A, 'A', 17); T('a-A2v', '静止', x + 180, cy + 320, 20, C.A, 600, 100, 'center');
  block('a-B2', x + 330, cy + 420, 84, 84, C.B, 'B', 17); arrow('a-vB2', x + 372, cy + 315, 66, C.B, '3 m/s');
  eqs('a-e', x + 24, cy + 470, w - 40, [
    ['动量', 'm_1v_1+m_2v_2=m_1v_1\'+m_2v_2\''],
    ['代入', '1\\times4+2\\times1=1\\times0+2\\times3'],
    ['公式', 'v_1\'=\\frac{(m_1-m_2)v_1+2m_2v_2}{m_1+m_2}'],
    ['代入', 'v_1\'=\\frac{(1-2)\\times4+2\\times2\\times1}{1+2}=0'],
    ['公式', 'v_2\'=\\frac{(m_2-m_1)v_2+2m_1v_1}{m_1+m_2}'],
    ['代入', 'v_2\'=\\frac{(2-1)\\times1+2\\times1\\times4}{3}=3\\ \\mathrm{m/s}'],
  ], 23, 66);
  // B 特殊质量
  x = 655; w = 610;
  card('b', x, cy, w, ch, '② 动碰静的三种特殊情况');
  const rows: [string, number, number, string, string, number, string][] = [
    ['m1 = m2：交换速度', 60, 60, '碰后 A 停，B 以 v0 走', '', 0, ''],
    ['m1 ≫ m2：小的以约 2v0 飞出', 100, 40, '大的几乎不减速', '', 0, ''],
    ['m1 ≪ m2：小的原速弹回', 40, 110, '大的几乎不动', '', 0, ''],
  ];
  rows.forEach(([lab, wa, wb], i) => {
    const y0 = cy + 80 + i * 200, gy = y0 + 150;
    T(`b-l${i}`, lab, x + 24, y0, 22, C.text, 700, w - 40);
    ground(`b-g${i}`, gy, x + 24, x + w - 24, '');
    // 碰前
    const ha = wa * 0.45 + 18, hb = wb * 0.45 + 18, ay = gy - 82;
    block(`b-A${i}`, x + 40, gy, wa, ha, C.A, '', 16); arrow(`b-v${i}`, x + 40 + wa / 2 - 20, ay, 60, C.A, 'v0');
    block(`b-B${i}`, x + 100 + wa, gy, wb, hb, C.B, '', 16);
    T(`b-ar${i}`, '→', x + 320, gy - 50, 34, C.muted, 700, 60);
    // 碰后
    const bx = x + 380;
    if (i === 0) { block(`b-A2${i}`, bx, gy, wa, ha, C.A, '', 16); T(`b-s${i}`, '0', bx, ay - 30, 20, C.A, 700, wa, 'center'); block(`b-B2${i}`, bx + 110, gy, wb, hb, C.B, '', 16); arrow(`b-w${i}`, bx + 120, ay, 60, C.B, 'v0'); }
    if (i === 1) { block(`b-A2${i}`, bx, gy, wa, ha, C.A, '', 16); arrow(`b-w${i}a`, bx + 30, ay, 50, C.A, '≈v0'); block(`b-B2${i}`, bx + 140, gy, wb, hb, C.B, '', 16); arrow(`b-w${i}`, bx + 150, ay + 30, 60, C.B, '≈2v0'); }
    if (i === 2) { block(`b-A2${i}`, bx + 40, gy, wa, ha, C.A, '', 16); arrow(`b-w${i}a`, bx + 60, ay, -50, C.A, '≈−v0'); block(`b-B2${i}`, bx + 100, gy, wb, hb, C.B, '', 16); T(`b-s${i}`, '≈0', bx + 100, ay - 30, 20, C.B, 700, wb, 'center'); }
    T(`b-n${i}`, rows[i][3], x + 24, gy + 14, 18, C.muted, 500, w - 40);
  });
  eqs('b-e', x + 24, cy + 700, w - 40, [
    ['公式', 'v_1\'=\\frac{m_1-m_2}{m_1+m_2}v_0'],
    ['公式', 'v_2\'=\\frac{2m_1}{m_1+m_2}v_0'],
    ['说明', '!把质量关系代入上面两式即可得到', C.muted],
  ], 24, 62);
  // C 范围
  x = 1280; w = 610;
  card('c', x, cy, w, ch, '③ 碰撞类型未知：求速度范围');
  T('c-q', 'A（1 kg，6 m/s）撞静止的 B（2 kg）', x + 24, cy + 80, 22, C.text, 600, w - 40);
  const lx = x + 60, lw = 480, ly = cy + 270, sc = lw / 6;
  P('c-ax', `M ${lx} ${ly} L ${lx + lw} ${ly}`, C.muted, 3);
  for (let v = 0; v <= 6; v++) { P(`c-t${v}`, `M ${lx + v * sc} ${ly - 8} L ${lx + v * sc} ${ly + 8}`, C.muted, 2); T(`c-tl${v}`, String(v), lx + v * sc - 20, ly + 14, 18, C.muted, 500, 40, 'center'); }
  R('c-seg', lx + 2 * sc, ly - 10, 2 * sc, 20, C.Ep, 6);
  T('c-ax-t', 'B 碰后的速度 v_B（m/s）', lx, ly + 44, 18, C.muted, 500, lw, 'center');
  T('c-lo', '完全非弹性\n最小 2', lx + 2 * sc - 70, ly - 92, 19, C.Q, 700, 140, 'center');
  T('c-hi', '弹性\n最大 4', lx + 4 * sc - 70, ly - 92, 19, C.Ep, 700, 140, 'center');
  eqs('c-e', x + 24, cy + 400, w - 40, [
    ['最小', 'm_Av_0=(m_A+m_B)v', C.Q],
    ['代入', '1\\times6=(1+2)v\\Rightarrow v=2\\ \\mathrm{m/s}'],
    ['最大', 'v_B=\\frac{2m_Av_0}{m_A+m_B}', C.Ep],
    ['代入', 'v_B=\\frac{2\\times1\\times6}{1+2}=4\\ \\mathrm{m/s}'],
    ['结果', '2\\ \\mathrm{m/s}\\le v_B\\le 4\\ \\mathrm{m/s}', C.A],
    ['注意', '!真实碰撞介于两个极端之间', C.Q],
  ], 24, 66);
}

// ---------------- 图 2：子弹打木块 ----------------
function img2() {
  header(2, '子弹打木块的拓展', '打穿木块 · 木块固定 vs 可动（g = 10 m/s²，取向右为正）');
  const cy = 160, ch = 890;
  let x = 30, w = 920;
  card('a', x, cy, w, ch, '① 子弹打穿木块');
  T('a-q', 'm = 0.1 kg，v0 = 100 m/s；M = 0.9 kg，长 L = 0.15 m；阻力 f = 2250 N', x + 24, cy + 66, 20, C.muted, 500, w - 40);
  rowTag('a-r1', x + 24, cy + 110, '射入前');
  ground('a-g1', cy + 260, x + 24, x + w - 24);
  R('a-bul', x + 120, cy + 204, 40, 12, C.A, 4); arrow('a-vb', x + 160, cy + 210, 90, C.A, '100 m/s');
  block('a-M', x + 380, cy + 260, 180, 110, C.B, '木块 0.9 kg', 20);
  dim('a-L', x + 380, x + 560, cy + 290, 'L = 0.15 m');
  rowTag('a-r2', x + 24, cy + 340, '打穿后');
  ground('a-g2', cy + 500, x + 24, x + w - 24);
  block('a-M2', x + 420, cy + 500, 180, 110, C.B, '木块', 20); arrow('a-vM2', x + 480, cy + 372, 50, C.B, '5 m/s');
  R('a-bul2', x + 680, cy + 444, 40, 12, C.A, 4); arrow('a-vb2', x + 720, cy + 450, 110, C.A, '55 m/s');
  eqs('a-e', x + 24, cy + 545, w - 40, [
    ['判断', '!先假设不穿：d = Q ÷ f = 450 ÷ 2250 = 0.2 m > 0.15 m → 打穿', C.hl],
    ['动量', 'mv_0=mv_1+Mv_2'],
    ['代入', '0.1\\times100=0.1v_1+0.9v_2'],
    ['能量', '\\tfrac12mv_0^2=\\tfrac12mv_1^2+\\tfrac12Mv_2^2+fL'],
    ['代入', '500=0.05v_1^2+0.45v_2^2+2250\\times0.15'],
    ['结果', 'v_1=55\\ \\mathrm{m/s},\\ v_2=5\\ \\mathrm{m/s}', C.A],
    ['注意', '!另一根 v2 = 15 时 v1 = −35，子弹倒飞，舍去', C.Q],
  ], 24, 49);
  x = 970; w = 920;
  card('b', x, cy, w, ch, '② 木块固定与木块可动的比较');
  rowTag('b-r1', x + 24, cy + 80, '固定');
  ground('b-g1', cy + 240, x + 24, x + 600, '');
  wall('b-w', x + 600, cy + 120, cy + 240, 1);
  block('b-M1', x + 420, cy + 240, 180, 110, C.B, '', 20);
  R('b-hole1', x + 420, cy + 180, 100, 10, C.text, 3); R('b-bul1', x + 500, cy + 179, 30, 12, C.A, 4);
  dim('b-d1', x + 420, x + 520, cy + 112, 'd0 ≈ 0.222 m', C.Q, true);
  rowTag('b-r2', x + 24, cy + 280, '可动（光滑）');
  ground('b-g2', cy + 450, x + 24, x + w - 24);
  block('b-M2', x + 420, cy + 450, 180, 110, C.B, '', 20);
  R('b-hole2', x + 420, cy + 390, 90, 10, C.text, 3); R('b-bul2', x + 480, cy + 389, 30, 12, C.A, 4);
  dim('b-d2', x + 420, x + 510, cy + 322, 'd = 0.2 m', C.Q, true);
  arrow('b-v2', x + 640, cy + 395, 70, C.B, '10 m/s 共速');
  eqs('b-e', x + 24, cy + 510, w - 40, [
    ['固定', 'fd_0=\\tfrac12mv_0^2', C.hl],
    ['代入', '2250\\,d_0=\\tfrac12\\times0.1\\times100^2\\Rightarrow d_0\\approx0.222\\ \\mathrm{m}'],
    ['可动', 'fd=\\tfrac12mv_0^2-\\tfrac12(m+M)v^2', C.hl],
    ['代入', '2250\\,d=500-50\\Rightarrow d=0.2\\ \\mathrm{m}'],
    ['结论', 'd=d_0\\cdot\\frac{M}{m+M}', C.A],
    ['注意', '!木块被推着走，动能有一部分给了木块，所以打得浅', C.Q],
  ], 25, 58);
}

// ---------------- 图 3：板块① ----------------
function img3() {
  header(3, '板块模型的拓展（一）', '木板不够长：滑出 · 木板运动、物块轻放（地面光滑，g = 10 m/s²）');
  const cy = 160, ch = 890;
  let x = 30, w = 920;
  card('a', x, cy, w, ch, '① 木板不够长：物块滑出');
  T('a-q', 'm = 1 kg 以 6 m/s 滑上静止木板 M = 2 kg，μ = 0.2，板长 L = 4.5 m', x + 24, cy + 66, 20, C.muted, 500, w - 40);
  rowTag('a-r1', x + 24, cy + 110, '刚滑上');
  ground('a-g1', cy + 260, x + 24, x + w - 24);
  R('a-bd', x + 120, cy + 236, 520, 24, C.B, 4); T('a-bdl', '木板 M = 2 kg', x + 120, cy + 274, 18, C.B, 600, 520, 'center');
  block('a-m', x + 120, cy + 236, 54, 54, C.A, 'm', 18); arrow('a-vm', x + 147, cy + 150, 100, C.A, '6 m/s');
  dim('a-L', x + 120, x + 640, cy + 310, 'L = 4.5 m');
  rowTag('a-r2', x + 24, cy + 350, '滑出瞬间');
  ground('a-g2', cy + 500, x + 24, x + w - 24);
  R('a-bd2', x + 200, cy + 476, 520, 24, C.B, 4);
  block('a-m2', x + 690, cy + 476, 54, 54, C.A, 'm', 18); arrow('a-vm2', x + 717, cy + 390, 70, C.A, '4 m/s');
  arrow('a-vM2', x + 420, cy + 540, 30, C.B, '1 m/s');
  eqs('a-e', x + 24, cy + 560, w - 40, [
    ['判断', '!不滑出需要 L需 = 6 m > 4.5 m → 会滑出', C.hl],
    ['动量', 'mv_0=mv_1+Mv_2'],
    ['代入', '1\\times6=v_1+2v_2'],
    ['能量', '\\tfrac12mv_0^2=\\tfrac12mv_1^2+\\tfrac12Mv_2^2+\\mu mgL'],
    ['代入', '18=\\tfrac12v_1^2+v_2^2+0.2\\times1\\times10\\times4.5'],
    ['结果', 'v_1=4\\ \\mathrm{m/s},\\ v_2=1\\ \\mathrm{m/s}', C.A],
    ['注意', '!另一根 v2 = 3 时 v1 = 0，物块比木板慢，舍去', C.Q],
  ], 23, 46);
  x = 970; w = 920;
  card('b', x, cy, w, ch, '② 木板在动，物块轻放上去');
  T('b-q', '木板 M = 2 kg 以 3 m/s 运动，轻放 m = 1 kg，μ = 0.2', x + 24, cy + 66, 20, C.muted, 500, w - 40);
  rowTag('b-r1', x + 24, cy + 110, '刚放上');
  ground('b-g1', cy + 260, x + 24, x + w - 24);
  R('b-bd', x + 120, cy + 236, 520, 24, C.B, 4); arrow('b-vM', x + 380, cy + 318, 90, C.B, '3 m/s');
  block('b-m', x + 400, cy + 236, 54, 54, C.A, 'm', 18); T('b-m0', '静止', x + 377, cy + 140, 20, C.A, 600, 100, 'center');
  arrow('b-f1', x + 460, cy + 210, 60, C.Q, ''); T('b-f1t', '摩擦力推物块向前', x + 470, cy + 170, 18, C.Q, 600, 260);
  rowTag('b-r2', x + 24, cy + 350, '共速');
  ground('b-g2', cy + 500, x + 24, x + w - 24);
  R('b-bd2', x + 260, cy + 476, 520, 24, C.B, 4);
  block('b-m2', x + 390, cy + 476, 54, 54, C.A, 'm', 18);
  arrow('b-v2', x + 560, cy + 420, 60, C.hl, '一起 2 m/s');
  dim('b-rel', x + 444, x + 540, cy + 530, '相对后滑 1.5 m', C.Q);
  eqs('b-e', x + 24, cy + 570, w - 40, [
    ['动量', 'Mv_0=(M+m)v'],
    ['代入', '2\\times3=3v\\Rightarrow v=2\\ \\mathrm{m/s}'],
    ['能量', 'Q=\\tfrac12Mv_0^2-\\tfrac12(M+m)v^2'],
    ['代入', 'Q=\\tfrac12\\times2\\times3^2-\\tfrac12\\times3\\times2^2=3\\ \\mathrm{J}'],
    ['相对', 'L=\\frac{Q}{\\mu mg}'],
    ['代入', 'L=\\frac{3}{0.2\\times1\\times10}=1.5\\ \\mathrm{m}'],
  ], 23, 50);
}

// ---------------- 图 4：板块② ----------------
function img4() {
  header(4, '板块模型的拓展（二）', '木板撞墙 · 地面也有摩擦——什么时候动量不守恒');
  const cy = 160, ch = 890;
  let x = 30, w = 920;
  card('a', x, cy, w, ch, '① 木板撞墙后原速反弹');
  T('a-q', 'M = 2 kg、m = 1 kg 一起以 2 m/s 向右，木板撞墙后以 2 m/s 弹回', x + 24, cy + 66, 20, C.muted, 500, w - 40);
  const wx = x + 760;
  const stage = (k: number, gy: number, bx: number, mx: number, vb: number, vm: number, tag: string, common = '') => {
    rowTag(`a-r${k}`, x + 24, gy - 110, tag);
    ground(`a-g${k}`, gy, x + 24, wx, '');
    wall(`a-w${k}`, wx, gy - 100, gy, 1);
    R(`a-bd${k}`, bx, gy - 22, 380, 22, C.B, 4);
    block(`a-m${k}`, mx, gy - 22, 46, 46, C.A, 'm', 16);
    if (common) arrow(`a-c${k}`, mx + 23, gy - 92, common === 'L' ? -50 : 60, C.hl, common === 'L' ? '共速 u = 2/3 m/s' : '共速 2 m/s');
    else { arrow(`a-vm${k}`, mx + 23, gy - 92, vm * 30, C.A, `${vm > 0 ? '' : '−'}${Math.abs(vm)} m/s`); arrow(`a-vb${k}`, bx + 190, gy + 26, vb * 30, C.B, ''); T(`a-vbt${k}`, `${vb > 0 ? '' : '−'}${Math.abs(vb)} m/s`, bx + 190 + vb * 15 - 60, gy + 34, 18, C.B, 600, 120, 'center'); }
  };
  stage(1, cy + 230, wx - 400, wx - 300, 2, 2, '① 撞前', 'R');
  stage(2, cy + 410, wx - 382, wx - 280, -2, 2, '② 撞后瞬间：墙给外力，这一下动量不守恒');
  stage(3, cy + 600, wx - 560, wx - 330, 0, 0, '③ 最终共速 u，向左离开墙', 'L');
  eqs('a-e', x + 24, cy + 650, w - 40, [
    ['动量', 'mv-Mv=(m+M)u'],
    ['代入', '1\\times2-2\\times2=3u\\Rightarrow u=-\\tfrac23\\ \\mathrm{m/s}'],
    ['能量', 'Q=\\tfrac12(m+M)v^2-\\tfrac12(m+M)u^2'],
    ['代入', 'Q=\\tfrac12\\times3\\times2^2-\\tfrac12\\times3\\times(\\tfrac23)^2=\\tfrac{16}{3}\\ \\mathrm{J}'],
    ['注意', '!M > m 最终向左不再撞；m > M 会再撞墙，要分次算', C.Q],
  ], 23, 46);
  x = 970; w = 920;
  card('b', x, cy, w, ch, '② 地面也有摩擦：动量不守恒');
  const gy = cy + 330;
  ground('b-g', gy, x + 60, x + w - 60, '粗糙 μ2');
  R('b-bd', x + 200, gy - 30, 520, 30, C.B, 4); T('b-bdl', '木板 M', x + 200, gy - 28, 20, C.text, 700, 520, 'center');
  block('b-m', x + 260, gy - 30, 70, 70, C.A, 'm', 20); T('b-mu1', '上表面 μ1', x + 340, gy - 120, 18, C.muted, 500, 140);
  arrow('b-v0', x + 295, gy - 170, 100, C.A, 'v0');
  arrow('b-f1', x + 260, gy - 110, -70, C.Q, ''); T('b-f1t', 'μ1mg（阻碍物块）', x + 70, gy - 150, 18, C.Q, 600, 220);
  arrow('b-f2', x + 560, gy - 44, 80, C.Q, ''); T('b-f2t', 'μ1mg（带动木板）', x + 540, gy - 84, 18, C.Q, 600, 220);
  arrow('b-f3', x + 640, gy + 14, -90, C.Eg, ''); T('b-f3t', '地面摩擦 μ2(m+M)g（外力！）', x + 450, gy + 30, 18, C.Eg, 600, 360);
  eqs('b-e', x + 24, cy + 420, w - 40, [
    ['注意', '!地面摩擦是外力 → 不能用 mv0 = (m+M)v', C.Q],
    ['判断', '!μ1·mg > μ2·(m+M)g 时木板才会动，否则木板不动'],
    ['物块', 'a_1=\\mu_1g'],
    ['木板', 'a_2=\\frac{\\mu_1mg-\\mu_2(m+M)g}{M}'],
    ['共速', 'v_0-a_1t=a_2t\\Rightarrow t=\\frac{v_0}{a_1+a_2}'],
    ['能量', '!Q总 = μ1·mg·L相对 + μ2·(m+M)g·x板'],
    ['方法', '!牛顿第二定律求加速度 → 运动学找共速时刻 → 再算位移', C.A],
  ], 25, 64);
}

// ---------------- 图 5：弹簧 ----------------
function img5() {
  header(5, '弹簧模型的拓展', '两端都连 · B 靠墙压缩后释放 · 先碰撞粘连再压弹簧（光滑水平面）');
  const cy = 160, ch = 890, w = 610;
  // A
  let x = 30;
  card('a', x, cy, w, ch, '① 两端都连：最短、最长');
  T('a-q', 'A 2 kg 以 3 m/s 运动，B 1 kg 静止', x + 24, cy + 66, 20, C.muted, 500, w - 40);
  const sp = (id: string, gy: number, ax: number, bx: number, tag: string) => {
    rowTag(id + '-r', x + 24, gy - 110, tag);
    ground(id + '-g', gy, x + 24, x + w - 24, '');
    block(id + '-A', ax, gy, 70, 70, C.A, 'A 2kg', 17);
    spring(id + '-s', ax + 70, bx, gy - 30);
    block(id + '-B', bx, gy, 56, 56, C.B, 'B', 17);
    arrow(id + '-v', (ax + bx) / 2 + 20, gy - 92, 50, C.hl, '共速 2 m/s');
  };
  sp('a1', cy + 260, x + 150, x + 260, '弹簧最短');
  sp('a2', cy + 450, x + 100, x + 400, '弹簧最长');
  eqs('a-e', x + 24, cy + 510, w - 40, [
    ['动量', 'm_Av_0=(m_A+m_B)v'],
    ['代入', '2\\times3=3v\\Rightarrow v=2\\ \\mathrm{m/s}'],
    ['能量', 'E_p=\\tfrac12m_Av_0^2-\\tfrac12(m_A+m_B)v^2'],
    ['代入', 'E_p=9-6=3\\ \\mathrm{J}'],
    ['结论', '!最短和最长都是共速，Ep 都是 3 J', C.A],
  ], 24, 66);
  // B
  x = 655;
  card('b', x, cy, w, ch, '② B 靠墙，压缩后释放');
  T('b-q', 'm_A = 1 kg，m_B = 3 kg，弹簧储存 Ep0 = 8 J', x + 24, cy + 66, 20, C.muted, 500, w - 40);
  const wl = x + 60;
  let gy = cy + 260;
  rowTag('b-r1', x + 24, gy - 150, '阶段 1：到原长（B 被墙顶住不动）');
  ground('b-g1', gy, wl, x + w - 24, '');
  wall('b-w1', wl, gy - 100, gy, -1);
  block('b-B1', wl, gy, 80, 80, C.B, 'B 3kg', 17); spring('b-s1', wl + 80, wl + 250, gy - 30);
  block('b-A1', wl + 250, gy, 56, 56, C.A, 'A', 17); arrow('b-v1', wl + 278, gy - 92, 100, C.A, '4 m/s');
  gy = cy + 450;
  rowTag('b-r2', x + 24, gy - 120, '阶段 2：B 离墙，弹簧最长');
  ground('b-g2', gy, wl, x + w - 24, '');
  wall('b-w2', wl, gy - 100, gy, -1);
  block('b-B2', wl + 60, gy, 80, 80, C.B, 'B', 17); spring('b-s2', wl + 140, wl + 400, gy - 30);
  block('b-A2', wl + 400, gy, 56, 56, C.A, 'A', 17); arrow('b-v2', wl + 250, gy - 92, 40, C.hl, '共速 1 m/s');
  eqs('b-e', x + 24, cy + 510, w - 40, [
    ['阶段1', 'E_{p0}=\\tfrac12m_Av_A^2', C.hl],
    ['代入', '8=\\tfrac12\\times1\\times v_A^2\\Rightarrow v_A=4\\ \\mathrm{m/s}'],
    ['阶段2', 'm_Av_A=(m_A+m_B)v', C.hl],
    ['代入', '1\\times4=(1+3)v\\Rightarrow v=1\\ \\mathrm{m/s}'],
    ['能量', 'E_p=E_{p0}-\\tfrac12(m_A+m_B)v^2'],
    ['代入', 'E_p=8-\\tfrac12\\times4\\times1^2=6\\ \\mathrm{J}'],
    ['注意', '!回不到 8 J：B 离墙后系统有动量，要留动能', C.Q],
  ], 22, 50);
  // C
  x = 1280;
  card('c', x, cy, w, ch, '③ 先碰撞粘连，再压弹簧');
  T('c-q', 'C 1 kg 以 6 m/s 撞 A 1 kg 并粘住；A 通过弹簧连 B 2 kg', x + 24, cy + 66, 20, C.muted, 500, w - 40);
  const st = (k: number, gy: number, cx: number, ax: number, bx: number, tag: string, lab: string, len: number, col: string) => {
    rowTag(`c-r${k}`, x + 24, gy - 130, tag);
    ground(`c-g${k}`, gy, x + 24, x + w - 24, '');
    block(`c-C${k}`, cx, gy, 46, 46, C.Eg, 'C', 16);
    block(`c-A${k}`, ax, gy, 46, 46, C.A, 'A', 16);
    spring(`c-s${k}`, ax + 46, bx, gy - 23);
    block(`c-B${k}`, bx, gy, 64, 64, C.B, 'B', 16);
    arrow(`c-v${k}`, (k === 1 ? cx + 23 : (cx + ax) / 2 + 23), gy - 66, len, col, lab);
  };
  st(1, cy + 250, x + 60, x + 200, x + 380, '① 碰前（弹簧来不及形变）', '6 m/s', 90, C.Eg);
  st(2, cy + 400, x + 154, x + 200, x + 380, '② 刚粘住', '3 m/s', 60, C.hl);
  st(3, cy + 550, x + 214, x + 260, x + 360, '③ 弹簧最短', '共速 1.5 m/s', 40, C.hl);
  eqs('c-e', x + 24, cy + 585, w - 40, [
    ['碰撞', 'm_Cv_0=(m_C+m_A)v_1', C.hl],
    ['代入', '1\\times6=2v_1\\Rightarrow v_1=3\\ \\mathrm{m/s}'],
    ['压缩', '(m_C+m_A)v_1=(m_C+m_A+m_B)v_2', C.hl],
    ['代入', '2\\times3=4v_2\\Rightarrow v_2=1.5\\ \\mathrm{m/s}'],
    ['能量', 'E_p=\\tfrac12(m_C+m_A)v_1^2-\\tfrac12(m_C+m_A+m_B)v_2^2'],
    ['代入', 'E_p=9-4.5=4.5\\ \\mathrm{J}'],
    ['注意', '!不是 18 − 4.5：粘住那一下已损失 9 J 热', C.Q],
  ], 21, 44);
}

// ---------------- 图 6：圆弧槽 ----------------
function img6() {
  header(6, '圆弧槽模型的拓展', '槽顶静止释放 · 冲出槽口 · 滑回离开槽（槽可在光滑水平面上自由滑动）');
  const cy = 160, ch = 890, w = 610;
  let x = 30;
  card('a', x, cy, w, ch, '① 从槽口静止释放');
  T('a-q', 'm = 1 kg，M = 3 kg，R = 0.6 m', x + 24, cy + 66, 20, C.muted, 500, w - 40);
  let gy = cy + 300;
  rowTag('a-r1', x + 24, cy + 110, '释放时');
  ground('a-g1', gy, x + 24, x + w - 24, '');
  groove('a-gr1', x + 260, gy, 150); E('a-b1', x + 410, gy - 172, 20, C.A);
  gy = cy + 530;
  rowTag('a-r2', x + 24, cy + 340, '到达槽底');
  ground('a-g2', gy, x + 24, x + w - 24, '');
  groove('a-gr2', x + 320, gy, 150); E('a-b2', x + 320, gy - 20, 20, C.A);
  arrow('a-vb', x + 320, gy - 70, -90, C.A, '球 3 m/s');
  arrow('a-vg', x + 430, gy + 30, 40, C.B, '');
  T('a-vgt', '槽 1 m/s', x + 482, gy + 18, 18, C.B, 600, 120);
  dim('a-dx', x + 260, x + 320, cy + 330 + 230 - 210, '后退 0.15 m', C.hl);
  eqs('a-e', x + 24, cy + 590, w - 40, [
    ['水平', '0=mv_1-Mv_2\\Rightarrow v_1=3v_2'],
    ['能量', 'mgR=\\tfrac12mv_1^2+\\tfrac12Mv_2^2'],
    ['代入', '6=\\tfrac12(3v_2)^2+\\tfrac32v_2^2\\Rightarrow v_2=1,\\ v_1=3'],
    ['位移', 'mx_1=Mx_2,\\ x_1+x_2=R'],
    ['代入', 'x_1=3x_2,\\ x_1+x_2=0.6\\Rightarrow x_2=0.15\\ \\mathrm{m}'],
  ], 23, 56);
  x = 655;
  card('b', x, cy, w, ch, '② 槽不够高：冲出槽口');
  T('b-q', 'm = 1 kg 以 4 m/s 冲上 M = 3 kg 的槽，槽高 R = 0.4 m', x + 24, cy + 66, 20, C.muted, 500, w - 40);
  gy = cy + 470;
  ground('b-g', gy, x + 24, x + w - 24, '');
  groove('b-gr', x + 230, gy, 200);
  dash('b-up', x + 430, gy - 200, x + 430, gy - 380, C.A);
  E('b-b', x + 430, gy - 270, 20, C.A);
  arrow('b-vy', x + 455, gy - 270, -70, C.Ep, 'vy = 2 m/s', true);
  arrow('b-vx', x + 430, gy - 320, 40, C.hl, '');
  T('b-vxt', '水平 1 m/s', x + 300, gy - 345, 18, C.hl, 600, 120);
  arrow('b-vg', x + 330, gy + 30, 40, C.B, ''); T('b-vgt', '槽 1 m/s', x + 380, gy + 18, 18, C.B, 600, 120);
  T('b-top', '再升 0.2 m', x + 470, gy - 380, 18, C.Ep, 600, 140);
  eqs('b-e', x + 24, cy + 530, w - 40, [
    ['水平', 'mv_0=(m+M)v_x'],
    ['代入', '1\\times4=(1+3)v_x\\Rightarrow v_x=1\\ \\mathrm{m/s}'],
    ['能量', '\\tfrac12mv_0^2=\\tfrac12(m+M)v_x^2+mgR+\\tfrac12mv_y^2'],
    ['代入', '8=2+4+\\tfrac12v_y^2\\Rightarrow v_y=2\\ \\mathrm{m/s}'],
    ['上升', '\\Delta h=\\frac{v_y^2}{2g}=\\frac{4}{20}=0.2\\ \\mathrm{m}'],
    ['结论', '!总高 0.6 m；相对槽竖直上抛 → 落回槽口', C.A],
  ], 23, 56);
  x = 1280;
  card('c', x, cy, w, ch, '③ 小球滑回并离开槽');
  T('c-q', '同 ②：m = 1 kg，M = 3 kg，v0 = 4 m/s', x + 24, cy + 66, 20, C.muted, 500, w - 40);
  gy = cy + 330;
  ground('c-g', gy, x + 24, x + w - 24, '');
  groove('c-gr', x + 330, gy, 150);
  E('c-b', x + 150, gy - 20, 20, C.A); arrow('c-vb', x + 140, gy - 70, -70, C.A, '球 −2 m/s');
  arrow('c-vg', x + 400, gy - 190, 70, C.B, '槽 2 m/s');
  eqs('c-e', x + 24, cy + 400, w - 40, [
    ['公式', 'v_1\'=\\frac{m-M}{m+M}v_0'],
    ['代入', 'v_1\'=\\frac{1-3}{4}\\times4=-2\\ \\mathrm{m/s}'],
    ['公式', 'v_2\'=\\frac{2m}{m+M}v_0'],
    ['代入', 'v_2\'=\\frac{2\\times1}{4}\\times4=2\\ \\mathrm{m/s}'],
    ['口诀', '!m < M 球弹回；m = M 球停下；m > M 球继续向前', C.A],
  ], 24, 70);
}

// ---------------- 图 7：人船 ----------------
function img7() {
  header(7, '人船模型的拓展', '条件：两个物体、开始都静止、某方向不受外力 → m1x1 = m2x2');
  const cy = 160, ch = 890;
  let x = 30, w = 920;
  card('a', x, cy, w, ch, '① 气球与绳梯');
  T('a-q', '气球 M = 200 kg，人 m = 50 kg，离地 20 m，人要沿绳梯安全落地', x + 24, cy + 66, 20, C.muted, 500, w - 40);
  const gy = cy + 560;
  ground('a-g', gy, x + 24, x + w - 24, '地面');
  const balloon = (id: string, bx: number, by: number, py: number, lab: string) => {
    N.push(ellipse(id + '-bal', {x: bx - 56, y: by - 56, width: 112, height: 112, fill: TINT[C.Eg], stroke: C.Eg, strokeWidth: 2.5}));
    P(id + '-lad', `M ${bx - 8} ${by + 56} L ${bx - 8} ${gy} M ${bx + 8} ${by + 56} L ${bx + 8} ${gy}`, C.muted, 2);
    E(id + '-ph', bx, py - 34, 11, C.A); P(id + '-pb', `M ${bx} ${py - 23} L ${bx} ${py}`, C.A, 4);
    T(id + '-l', lab, bx - 120, by - 100, 20, C.text, 700, 240, 'center');
  };
  balloon('a1', x + 240, cy + 265, cy + 365, '开始');
  balloon('a2', x + 640, cy + 215, gy, '人落地时');
  dash('a-ref', x + 300, cy + 265, x + 720, cy + 265, C.muted);
  P('a-hx', `M ${x + 330} ${cy + 365} L ${x + 330} ${gy}`, C.A, 2); T('a-hxt', 'x人 = 20 m', x + 340, cy + 440, 20, C.A, 600, 160);
  P('a-bx', `M ${x + 730} ${cy + 215} L ${x + 730} ${cy + 265}`, C.Eg, 3); T('a-bxt', 'x球 = 5 m', x + 740, cy + 225, 20, C.Eg, 600, 160);
  eqs('a-e', x + 24, cy + 610, w - 40, [
    ['动量', '!m·x人 = M·x球（竖直方向合外力为 0）'],
    ['代入', '!50 × 20 = 200 · x球 → x球 = 5 m'],
    ['梯长', '!L = x人 + x球'],
    ['代入', '!L = 20 + 5 = 25 m'],
  ], 25, 62);
  x = 970; w = 920;
  card('b', x, cy, w, ch, '② 滑块从光滑斜面滑下，斜面后退');
  T('b-q', 'm = 1 kg，斜面体 M = 4 kg，底边 b = 1 m，全部光滑', x + 24, cy + 66, 20, C.muted, 500, w - 40);
  const wedgeTri = (id: string, gx: number, gy2: number) => P(id, `M ${gx} ${gy2} L ${gx + 400} ${gy2} L ${gx + 400} ${gy2 - 160} Z`, C.B, 2.5, TINT[C.B]);
  let g2 = cy + 330;
  rowTag('b-r1', x + 24, cy + 110, '开始');
  ground('b-g1', g2, x + 24, x + w - 24, '');
  wedgeTri('b-w1', x + 300, g2); block('b-m1', x + 660, g2 - 160, 44, 44, C.A, 'm', 16);
  dim('b-b', x + 300, x + 700, g2 + 30, 'b = 1 m');
  g2 = cy + 600;
  rowTag('b-r2', x + 24, cy + 390, '滑到底端');
  ground('b-g2', g2, x + 24, x + w - 24, '');
  wedgeTri('b-w2', x + 380, g2); block('b-m2', x + 340, g2, 44, 44, C.A, 'm', 16);
  dash('b-ref', x + 300, cy + 330, x + 300, g2, C.muted); dash('b-ref2', x + 700, cy + 330, x + 700, g2, C.muted);
  arrow('b-dx', x + 700, g2 + 40, 80, C.B, '斜面后退 0.2 m');
  arrow('b-dm', x + 660, g2 + 100, -300, C.A, '滑块水平走 0.8 m');
  eqs('b-e', x + 24, cy + 720, w - 40, [
    ['动量', '!m·x块 = M·x斜，x块 + x斜 = b'],
    ['结论', '!x斜 = mb ÷ (m + M)', C.A],
    ['代入', '!x斜 = 1 × 1 ÷ (1 + 4) = 0.2 m'],
  ], 25, 64);
}

// ---------------- 图 8：反冲爆炸 + 新模型 ----------------
function img8() {
  header(8, '反冲爆炸的拓展、冲击摆与摆球小车', '最高点爆炸 · 冲击摆 · 摆球小车（g = 10 m/s²）');
  const cy = 160, ch = 890, w = 610;
  let x = 30;
  card('a', x, cy, w, ch, '① 炮弹在最高点爆炸');
  T('a-q', '2 kg 炮弹到最高点速度水平 20 m/s，炸成两块各 1 kg，一块自由落体', x + 24, cy + 66, 20, C.muted, 500, w - 40);
  const gy = cy + 480;
  ground('a-g', gy, x + 24, x + w - 24, '地面');
  let d = '';
  for (let i = 0; i <= 20; i++) { const u = i / 20; const px = x + 50 + u * 200, py = gy - 300 * (1 - (1 - u) * (1 - u)); d += (i ? ' L ' : 'M ') + px + ' ' + py; }
  P('a-path', d, C.muted, 2);
  E('a-top', x + 250, gy - 300, 14, C.hl);
  arrow('a-f1', x + 250, gy - 280, 120, C.A, '', true); T('a-f1t', '1 kg：v = 0\n自由落体', x + 130, gy - 210, 18, C.A, 600, 120);
  arrow('a-f2', x + 270, gy - 300, 160, C.B, '1 kg：40 m/s');
  let d2 = '';
  for (let i = 0; i <= 20; i++) { const u = i / 20; d2 += (i ? ' L ' : 'M ') + (x + 270 + u * 300) + ' ' + (gy - 300 + 300 * u * u); }
  dash('a-p2a', x + 270, gy - 300, x + 270, gy - 300); P('a-p2', d2, C.B, 2);
  eqs('a-e', x + 24, cy + 530, w - 40, [
    ['动量', 'mv=m_1v_1+m_2v_2'],
    ['代入', '2\\times20=1\\times0+1\\times v_2\\Rightarrow v_2=40\\ \\mathrm{m/s}'],
    ['能量', '\\Delta E=\\tfrac12m_2v_2^2-\\tfrac12mv^2'],
    ['代入', '\\Delta E=800-400=400\\ \\mathrm{J}'],
    ['注意', '!多出来的 400 J 来自炸药的化学能', C.Q],
    ['结论', '!两块同时落地，水平距离比 = 水平速度比', C.A],
  ], 23, 56);
  x = 655;
  card('b', x, cy, w, ch, '② 冲击摆：子弹打入沙箱');
  T('b-q', 'm = 0.01 kg 以 400 m/s 射入悬挂沙箱 M = 0.99 kg', x + 24, cy + 66, 20, C.muted, 500, w - 40);
  const px = x + 300, py = cy + 120, L = 260;
  R('b-ceil', px - 120, py - 8, 240, 8, C.wall, 2);
  P('b-s1', `M ${px} ${py} L ${px} ${py + L}`, C.muted, 2);
  R('b-box1', px - 45, py + L, 90, 70, C.B, 6);
  R('b-bul', px - 160, py + L + 30, 30, 10, C.A, 3); arrow('b-vb', px - 130, py + L + 35, 60, C.A, '400 m/s');
  const th = 0.8, bx2 = px + L * Math.sin(th), by2 = py + L * Math.cos(th);
  dash('b-s2', px, py, bx2, by2, C.hl);
  R('b-box2', bx2 - 45, by2, 90, 70, C.B, 6);
  P('b-h', `M ${bx2 + 58} ${by2 + 70} L ${bx2 + 58} ${py + L + 70}`, C.Ep, 3); T('b-ht', 'h =\n0.8 m', bx2 + 64, by2 + 80, 18, C.Ep, 600, 70);
  eqs('b-e', x + 24, cy + 500, w - 40, [
    ['打入', 'mv_0=(m+M)v', C.hl],
    ['代入', '0.01\\times400=1\\times v\\Rightarrow v=4\\ \\mathrm{m/s}'],
    ['摆起', '\\tfrac12(m+M)v^2=(m+M)gh', C.hl],
    ['代入', 'h=\\frac{v^2}{2g}=\\frac{16}{20}=0.8\\ \\mathrm{m}'],
    ['注意', '!不能一步列 ½mv0² = (m+M)gh：打入时有大量生热', C.Q],
  ], 23, 64);
  x = 1280;
  card('c', x, cy, w, ch, '③ 摆球小车（与圆弧槽同类）');
  T('c-q', '光滑面上小车 M 挂着小球 m，小球获得水平初速 v0', x + 24, cy + 66, 20, C.muted, 500, w - 40);
  const g3 = cy + 480;
  ground('c-g', g3, x + 24, x + w - 24, '');
  R('c-car', x + 120, g3 - 90, 360, 60, C.B, 8); E('c-w1', x + 180, g3 - 18, 18, C.wall); E('c-w2', x + 420, g3 - 18, 18, C.wall);
  P('c-post', `M ${x + 300} ${g3 - 90} L ${x + 300} ${g3 - 300} L ${x + 330} ${g3 - 300}`, C.muted, 4);
  const qx = x + 330 + 150 * Math.sin(1.0), qy = g3 - 300 + 150 * Math.cos(1.0);
  P('c-str', `M ${x + 330} ${g3 - 300} L ${qx} ${qy}`, C.muted, 2);
  E('c-ball', qx, qy, 18, C.A);
  arrow('c-v', x + 300, g3 - 335, 60, C.hl, '最高点：水平共速 v');
  eqs('c-e', x + 24, cy + 540, w - 40, [
    ['水平', 'mv_0=(m+M)v'],
    ['能量', '\\tfrac12mv_0^2=\\tfrac12(m+M)v^2+mgh'],
    ['结论', 'h=\\frac{Mv_0^2}{2g(m+M)}', C.A],
    ['注意', '!和圆弧槽同一套：最高点水平共速，球不是静止', C.Q],
  ], 24, 70);
}

export default defineComponent({
  name: '模型拓展演示图',
  parameters: {},
  render(ctx) {
    N = [];
    R('bg', 0, 0, 1920, 1080, C.bg, 0);
    const k = Math.min(7, Math.floor(ctx.seconds * 30 + 0.01));
    [img1, img2, img3, img4, img5, img6, img7, img8][k]();
    return N;
  },
});
