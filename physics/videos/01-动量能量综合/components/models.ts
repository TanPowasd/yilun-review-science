import {defineComponent, rect, text, ellipse, path, formula} from '@vmotion/sdk';

// 动量守恒 × 能量守恒：七大模型动画。所有运动都由解析解 / 确定性数值积分给出，可任意帧跳转。
const FONT = 'Vmotion Sans';
const C = {
  bg: '#0f1424', panel: '#182038', line: '#2c3655', text: '#eef2ff', muted: '#9aa8cb',
  A: '#4f9dff', B: '#ff8a4c', Q: '#ff5d6c', Ep: '#4cd6a0', Eg: '#c38bff', hl: '#ffd166',
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const fmt = (v: number, d = 1) => {
  const r = Math.abs(v) < 0.05 / Math.pow(10, d - 1) ? 0 : v;
  const s = Math.abs(r).toFixed(d);
  return (r < 0 ? '−' : '') + s;
};
const smooth = (x: number) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };

type Hold = {at: number; dur: number};
// 视频时间 s → 模拟时间 τ；在 holds 处定格（关键状态停留讲解）
function warp(s: number, start: number, rate: number, holds: Hold[], max: number) {
  let t = s - start;
  if (t <= 0) return {tau: 0, holding: -1};
  let prev = 0;
  for (let i = 0; i < holds.length; i++) {
    const h = holds[i];
    const need = (h.at - prev) / rate;
    if (t <= need) return {tau: Math.min(prev + t * rate, max), holding: -1};
    t -= need;
    if (t <= h.dur) return {tau: h.at, holding: i};
    t -= h.dur;
    prev = h.at;
  }
  return {tau: Math.min(prev + t * rate, max), holding: -1};
}

let N: any[] = [];
const T = (id: string, s: string, x: number, y: number, size: number, color = C.text, weight = 400, w = 1600, align: 'left' | 'center' | 'right' = 'left', opacity = 1) =>
  N.push(text(id, s, {x, y, width: w, height: size * 1.5, fontSize: size, fill: color, fontWeight: weight, fontFamily: FONT, align, lineHeight: 1.3, opacity}));
const R = (id: string, x: number, y: number, w: number, h: number, fill: string, radius = 6, stroke = '', sw = 0, opacity = 1) =>
  N.push(rect(id, {x, y, width: w, height: h, fill, radius, stroke, strokeWidth: sw, opacity}));
const P = (id: string, d: string, stroke: string, sw = 3, fill = 'transparent', opacity = 1) =>
  N.push(path(id, d, {stroke, strokeWidth: sw, fill, opacity}));
const E = (id: string, cx: number, cy: number, r: number, fill: string, opacity = 1) =>
  N.push(ellipse(id, {x: cx - r, y: cy - r, width: 2 * r, height: 2 * r, fill, opacity}));


const F = (id: string, tex: string, x: number, y: number, size: number, color = C.text, w = 600, opacity = 1) =>
  N.push(formula(id, tex, {x, y, width: w, height: size * 1.8, fontSize: size, fill: color, opacity}));
// 列方程卡片：关键状态出现，动量式 + 能量式
function eqCard(id: string, x: number, y: number, w: number, rows: [string, string, string][], a: number) {
  if (a <= 0.01) return;
  R(id + '-bg', x, y, w, 64 + rows.length * 62, '#1d2744', 14, C.hl, 2, a);
  T(id + '-h', '列方程（取向右为正）', x + 22, y + 12, 22, C.hl, 700, w - 40, 'left', a);
  rows.forEach(([tag, tex, col], i) => {
    T(`${id}-k${i}`, tag, x + 22, y + 60 + i * 62, 22, col, 700, 90, 'left', a);
    if (tex.startsWith('!')) T(`${id}-f${i}`, tex.slice(1), x + 110, y + 56 + i * 62, 28, C.text, 600, w - 130, 'left', a);
    else F(`${id}-f${i}`, tex, x + 110, y + 52 + i * 62, 30, C.text, w - 130, a);
  });
}
function holdBadge(on: boolean) {
  if (!on) return;
  R('hold-bg', 1560, 40, 240, 50, C.hl, 25);
  R('hold-p1', 1584, 53, 7, 24, '#0b1020', 2);
  R('hold-p2', 1597, 53, 7, 24, '#0b1020', 2);
  T('hold-t', '定格：关键状态', 1614, 50, 22, '#0b1020', 700, 180);
}
function dots(k: number) {
  for (let i = 1; i <= 7; i++) E('dot' + i, 1140 + i * 50, 66, i === k ? 11 : 7, i === k ? C.hl : i < k ? C.muted : C.line);
}

function block(id: string, x: number, groundY: number, w: number, h: number, color: string, label: string) {
  R(id, x, groundY - h, w, h, color, 8);
  T(id + '-l', label, x, groundY - h / 2 - 16, 24, '#0b1020', 700, w, 'center');
}
function arrow(id: string, x: number, y: number, len: number, color: string, label = '') {
  if (Math.abs(len) < 6) { if (label) T(id + '-t', label, x - 130, y - 40, 22, color, 600, 260, 'center'); return; }
  const dir = Math.sign(len), x2 = x + len;
  P(id, `M ${x} ${y} L ${x2} ${y}`, color, 5);
  P(id + '-h', `M ${x2 - dir * 16} ${y - 10} L ${x2} ${y} L ${x2 - dir * 16} ${y + 10}`, color, 5);
  if (label) { const lw = Math.max(Math.abs(len) + 80, 260); T(id + '-t', label, (x + x2) / 2 - lw / 2, y - 42, 22, color, 600, lw, 'center'); }
}
function ground(id: string, y: number, x1 = 120, x2 = 1300, label = '光滑') {
  P(id, `M ${x1} ${y} L ${x2} ${y}`, C.muted, 3);
  if (label) T(id + '-t', label, x1, y + 8, 20, C.muted);
}
function header(k: number, title: string) {
  T('hdr-k', `模型 ${k} / 7`, 120, 40, 24, C.hl, 600);
  T('hdr-t', title, 120, 74, 50, C.text, 700);
  dots(k);
}
function caption(s: string) {
  R('cap-bg', 120, 958, 1680, 84, C.panel, 14, C.line, 2);
  R('cap-bar', 120, 958, 8, 84, C.hl, 4);
  T('cap', s, 156, 975, 32, C.text, 500, 1620);
}
function panel(id: string, x: number, y: number, w: number, lines: [string, string][], title = '实时读数') {
  R(id + '-bg', x, y, w, 56 + lines.length * 46, C.panel, 14, C.line, 2);
  T(id + '-h', title, x + 22, y + 12, 22, C.muted, 600);
  lines.forEach(([s, c], i) => T(`${id}-${i}`, s, x + 22, y + 48 + i * 46, 28, c, 600, w - 40));
}
// 能量条：堆叠条形图，表示总能量的分配
function bars(id: string, x: number, y: number, total: number, items: {label: string; value: number; color: string}[], width = 640, title = '能量分配（J）') {
  T(id + '-h', title, x, y - 44, 24, C.muted, 600);
  R(id + '-frame', x, y, width, 46, 'transparent', 6, C.line, 2);
  let cx = x;
  items.forEach((it, i) => {
    const w = Math.max(0, it.value) / total * width;
    if (w > 0.5) R(`${id}-b${i}`, cx, y, w, 46, it.color, 4);
    cx += w;
  });
  items.forEach((it, i) => {
    E(`${id}-d${i}`, x + 10 + i * (width / items.length), y + 76, 8, it.color);
    T(`${id}-v${i}`, `${it.label} ${fmt(it.value)}`, x + 24 + i * (width / items.length), y + 60, 22, C.text, 500, width / items.length);
  });
}
function spring(id: string, x1: number, x2: number, y: number, color = '#c8d0e0') {
  const n = 10, amp = 14, L = x2 - x1;
  let d = `M ${x1} ${y}`;
  for (let i = 1; i < 2 * n; i++) d += ` L ${x1 + (L * i) / (2 * n)} ${y + (i % 2 ? -amp : amp)}`;
  d += ` L ${x2} ${y}`;
  P(id, d, color, 4);
}

// ---------- 模型 1：两种碰撞对比 ----------
function collision(s: number) {
  header(1, '弹性碰撞 vs 完全非弹性碰撞');
  const sc = 100, x0 = 160;
  const {tau} = warp(s, 1.5, 0.45, [], 1.6);
  const tc = 0.7;
  const rows = [
    {y: 400, name: '弹性碰撞（碰后分开）', vA2: -2, vB2: 4},
    {y: 720, name: '完全非弹性碰撞（碰后粘在一起）', vA2: 2, vB2: 2},
  ];
  rows.forEach((r, k) => {
    const after = tau > tc, u = tau - tc;
    const xA = after ? 5.2 + r.vA2 * u : 1 + 6 * tau;
    const xB = after ? 6 + r.vB2 * u : 6;
    const vA = after ? r.vA2 : 6, vB = after ? r.vB2 : 0;
    T(`row${k}`, r.name, x0, r.y - 190, 28, k ? C.Q : C.Ep, 700);
    ground(`g${k}`, r.y, 120, 1260);
    block(`A${k}`, x0 + xA * sc, r.y, 80, 80, C.A, 'A 1kg');
    block(`B${k}`, x0 + xB * sc, r.y, 120, 100, C.B, 'B 2kg');
    arrow(`vA${k}`, x0 + xA * sc + 40, r.y - 110, vA * 25, C.A, `${fmt(vA)} m/s`);
    arrow(`vB${k}`, x0 + xB * sc + 60, r.y - 130, vB * 25, C.B, vB ? `${fmt(vB)} m/s` : '静止');
    const ek = 0.5 * 1 * vA * vA + 0.5 * 2 * vB * vB;
    const lines: [string, string][] = [
      [`vA = ${fmt(vA)} m/s　vB = ${fmt(vB)} m/s`, C.text],
      [`p总 = ${fmt(1 * vA + 2 * vB)} kg·m/s`, C.hl],
      [`Ek总 = ${fmt(ek)} J${ek < 17.9 ? `　热 Q = ${fmt(18 - ek)} J` : ''}`, ek < 17.9 ? C.Q : C.Ep],
    ];
    panel(`p${k}`, 1320, r.y - 200, 480, lines, k ? '完全非弹性' : '弹性');
  });
  if (tau > tc && tau < tc + 0.12) rows.forEach((r, k) => E('fl' + k, x0 + 6 * sc, r.y - 50, 40 + 500 * (tau - tc), C.hl, 0.6 * (1 - (tau - tc) / 0.12)));
  const ea = smooth((s - 6) / 0.6);
  if (ea > 0) {
    F('ce1', '1\\times6=1\\times v_A+2\\times v_B,\\ \\tfrac12\\cdot1\\cdot6^2=\\tfrac12 v_A^2+\\tfrac12\\cdot2v_B^2', 160, 430, 28, C.Ep, 1100, ea);
    F('ce2', '1\\times6=(1+2)v\\Rightarrow v=2,\\quad Q=18-\\tfrac12\\cdot3\\cdot2^2=12\\ \\mathrm{J}', 160, 750, 28, C.Q, 1100, ea);
  }
  let cap = '同一个 A（1 kg，6 m/s）撞静止的 B（2 kg），比较两种碰撞';
  if (s > 1.5 && tau <= tc) cap = '碰前：p总 = 1×6 = 6 kg·m/s，Ek总 = ½×1×6² = 18 J';
  if (tau > tc) cap = '两种碰撞动量都守恒（都是 6），但粘在一起时动能损失最多：12 J 变成了热';
  if (s > 8.5) cap = '弹性：动能不变，动能一点不损失；完全非弹性：损失最多。真实碰撞介于两者之间';
  caption(cap);
}

// ---------- 模型 2：板块 ----------
function board(s: number) {
  header(2, '板块模型（滑块 + 木板，地面光滑）');
  const sc = 100, x0 = 160, gy = 560;
  const {tau, holding} = warp(s, 1.5, 0.6, [{at: 2, dur: 3}], 3);
  const t1 = Math.min(tau, 2), t2 = Math.max(0, tau - 2);
  const xb = 1 + 6 * t1 - t1 * t1 + 2 * t2; // 物块左端
  const xM = 1 + 0.5 * t1 * t1 + 2 * t2; // 木板左端
  const vb = tau < 2 ? 6 - 2 * tau : 2, vM = tau < 2 ? tau : 2;
  ground('g', gy, 120, 1300);
  R('board', x0 + xM * sc, gy - 30, 650, 30, C.B, 4);
  T('board-l', '木板 M = 2 kg', x0 + xM * sc, gy + 8, 22, C.B, 600, 650, 'center');
  block('blk', x0 + xb * sc, gy - 30, 50, 50, C.A, 'm');
  arrow('vb', x0 + xb * sc + 25, gy - 120, vb * 30, C.A, `${fmt(vb)} m/s`);
  arrow('vM', x0 + xM * sc + 325, gy + 110, vM * 30, C.B, vM > 0.05 ? `${fmt(vM)} m/s` : '静止');
  if (tau > 0 && tau < 2) {
    arrow('f1', x0 + xb * sc, gy - 55, -60, C.Q, '');
    T('f1t', 'f', x0 + xb * sc - 50, gy - 92, 22, C.Q, 700, 40);
  }
  // v-t 图
  const gx = 160, gy2 = 930, gw = 600, gh = 190;
  const X = (t: number) => gx + (t / 3) * gw, Y = (v: number) => gy2 - (v / 6) * gh;
  P('vt-ax', `M ${gx} ${gy2 - gh - 10} L ${gx} ${gy2} L ${gx + gw + 10} ${gy2}`, C.muted, 2);
  T('vt-h', 'v–t 图', gx, gy2 - gh - 50, 24, C.muted, 600);
  T('vt-x', 't/s', gx + gw + 14, gy2 - 16, 20, C.muted);
  if (tau > 0) {
    const steps = 40;
    let dA = '', dB = '', poly = '';
    for (let i = 0; i <= steps; i++) {
      const t = (tau * i) / steps;
      const va = t < 2 ? 6 - 2 * t : 2, vm = t < 2 ? t : 2;
      dA += (i ? ' L ' : 'M ') + X(t) + ' ' + Y(va);
      dB += (i ? ' L ' : 'M ') + X(t) + ' ' + Y(vm);
    }
    const tm = Math.min(tau, 2);
    poly = `M ${X(0)} ${Y(6)} L ${X(tm)} ${Y(6 - 2 * tm)} L ${X(tm)} ${Y(tm)} L ${X(0)} ${Y(0)} Z`;
    P('vt-area', poly, 'transparent', 0, C.hl, 0.22);
    P('vt-a', dA, C.A, 4);
    P('vt-b', dB, C.B, 4);
    if (tau >= 2) T('vt-n', '阴影面积 = 相对位移 6 m', X(2.1), Y(4.6), 22, C.hl, 600, 400);
  }
  const ekb = 0.5 * vb * vb, ekM = 0.5 * 2 * vM * vM;
  bars('en', 1080, 830, 18, [
    {label: 'Ek物块', value: ekb, color: C.A},
    {label: 'Ek木板', value: ekM, color: C.B},
    {label: '热Q', value: 18 - ekb - ekM, color: C.Q},
  ]);
  panel('rd', 1360, 170, 440, [
    [`v物块 = ${fmt(vb)} m/s`, C.A],
    [`v木板 = ${fmt(vM)} m/s`, C.B],
    [`p总 = ${fmt(vb + 2 * vM)} kg·m/s`, C.hl],
    [`相对滑动 = ${fmt(xb - xM, 2)} m`, C.Q],
  ]);
  holdBadge(holding === 0);
  eqCard('eq', 1360, 430, 440, [
    ['动量', '1\\times6=(1+2)v\\Rightarrow v=2', C.hl],
    ['能量', 'Q=\\tfrac12\\cdot1\\cdot6^2-\\tfrac12\\cdot3\\cdot2^2=12', C.Q],
    ['热量', '\\mu mgL=Q\\Rightarrow L=6\\ \\mathrm{m}', C.Q],
  ], tau >= 2 ? smooth((s - (1.5 + 2 / 0.6)) / 0.6) : 0);
  let cap = '物块 m = 1 kg 以 6 m/s 滑上静止木板 M = 2 kg，μ = 0.2，地面光滑';
  if (tau > 0 && tau < 2) cap = '摩擦力是内力 → 动量守恒；摩擦生热 → 动能不断减少';
  if (holding === 0) cap = '共速 v = 2 m/s，物块恰好滑到右端：Q = 18 − 6 = 12 J，L = Q/(μmg) = 6 m';
  if (tau > 2 && holding < 0) cap = '共速以后没有相对滑动，不再生热，一起以 2 m/s 匀速运动';
  caption(cap);
}

// ---------- 模型 3：弹簧 ----------
function springModel(s: number) {
  header(3, '弹簧连接两物体（地面光滑）');
  const sc = 110, x0 = 160, gy = 560, w = 5, Tc = Math.PI / w, tc = 2.5 / 3;
  const {tau, holding} = warp(s, 1.5, 0.25, [{at: tc + Tc / 2, dur: 3}], 2.1);
  let xA: number, xB: number, vA: number, vB: number, phase = 0;
  if (tau < tc) { xA = 1 + 3 * tau; xB = 5.5; vA = 3; vB = 0; }
  else if (tau < tc + Tc) {
    const u = tau - tc; phase = 1;
    xA = 3.5 + 2 * u + 0.2 * Math.sin(w * u); xB = 5.5 + 2 * u - 0.4 * Math.sin(w * u);
    vA = 2 + Math.cos(w * u); vB = 2 - 2 * Math.cos(w * u);
  } else {
    const u = tau - tc - Tc; phase = 2;
    xA = 3.5 + 2 * Tc + u; xB = 5.5 + 2 * Tc + 4 * u; vA = 1; vB = 4;
  }
  ground('g', gy, 120, 1320);
  const len = phase === 1 ? xB - (xA + 0.8) : 1.2;
  spring('spr', x0 + (xB - len) * sc, x0 + xB * sc, gy - 40, phase === 1 ? C.Ep : '#c8d0e0');
  block('A', x0 + xA * sc, gy, 88, 80, C.A, 'A 2kg');
  block('B', x0 + xB * sc, gy, 66, 80, C.B, 'B 1kg');
  arrow('vA', x0 + xA * sc + 44, gy - 130, vA * 40, C.A, `${fmt(vA)} m/s`);
  arrow('vB', x0 + xB * sc + 33, gy - 200, vB * 40, C.B, vB > 0.05 ? `${fmt(vB)} m/s` : '静止');
  const ekA = 0.5 * 2 * vA * vA, ekB = 0.5 * vB * vB, ep = Math.max(0, 9 - ekA - ekB);
  bars('en', 160, 820, 9, [
    {label: 'Ek_A', value: ekA, color: C.A},
    {label: 'Ek_B', value: ekB, color: C.B},
    {label: '弹性势能', value: ep, color: C.Ep},
  ], 900, '能量分配（J）——总量始终 9 J');
  panel('rd', 1360, 170, 440, [
    [`vA = ${fmt(vA, 2)} m/s`, C.A],
    [`vB = ${fmt(vB, 2)} m/s`, C.B],
    [`p总 = ${fmt(2 * vA + vB)} kg·m/s`, C.hl],
    [`弹性势能 = ${fmt(ep, 2)} J`, C.Ep],
  ]);
  holdBadge(holding === 0);
  const tHold = 1.5 + (tc + Tc / 2) / 0.25;
  eqCard('eq', 1360, 430, 440, [
    ['动量', '2\\times3=(2+1)v\\Rightarrow v=2', C.hl],
    ['能量', 'E_p=\\tfrac12\\cdot2\\cdot3^2-\\tfrac12\\cdot3\\cdot2^2=3', C.Ep],
  ], smooth((s - tHold) / 0.6));
  let cap = 'A（2 kg）以 3 m/s 冲向连着弹簧的 B（1 kg），整个过程没有摩擦';
  if (phase === 1 && vA > vB + 0.02) cap = 'A 比 B 快 → 越靠越近 → 弹簧被压缩，动能变成弹性势能';
  if (holding === 0) cap = '弹簧最短：A、B 共速 2 m/s，弹性势能最大 Ep = 9 − 6 = 3 J';
  if (phase === 1 && vB > vA + 0.02) cap = 'B 比 A 快 → 两者分开 → 弹簧伸长，弹性势能还给动能';
  if (phase === 2) cap = '恢复原长：vA = 1 m/s，vB = 4 m/s——和弹性碰撞公式结果一模一样';
  caption(cap);
}

// ---------- 模型 4：可动光滑圆弧槽（数值积分） ----------
const WEDGE = (() => {
  const M = 3, m = 1, R = 1, g = 10, dt = 0.001;
  let X = 0, Xd = 0, th = 0, thd = 4, t = 0;
  const samples: {t: number; X: number; Xd: number; th: number; thd: number}[] = [{t, X, Xd, th, thd}];
  const acc = (th: number, thd: number) => {
    const c = Math.cos(th), sn = Math.sin(th);
    const thdd = (-g * sn - (m * R * c * sn * thd * thd) / (M + m)) / (R - (m * R * c * c) / (M + m));
    const Xdd = -(m * R * (c * thdd - sn * thd * thd)) / (M + m);
    return {thdd, Xdd};
  };
  let top = 0;
  for (let i = 0; i < 5000; i++) {
    // RK4
    const k1 = acc(th, thd);
    const k2 = acc(th + (dt / 2) * thd, thd + (dt / 2) * k1.thdd);
    const k3 = acc(th + (dt / 2) * (thd + (dt / 2) * k1.thdd), thd + (dt / 2) * k2.thdd);
    const k4 = acc(th + dt * (thd + (dt / 2) * k2.thdd), thd + dt * k3.thdd);
    const nth = th + dt * (thd + (dt / 6) * (k1.thdd + k2.thdd + k3.thdd));
    const nthd = thd + (dt / 6) * (k1.thdd + 2 * k2.thdd + 2 * k3.thdd + k4.thdd);
    const nXd = Xd + (dt / 6) * (k1.Xdd + 2 * k2.Xdd + 2 * k3.Xdd + k4.Xdd);
    X += dt * (Xd + nXd) / 2; Xd = nXd; th = nth; thd = nthd; t += dt;
    if (!top && thd <= 0) top = t;
    if (th <= 0 && thd < 0) { samples.push({t, X, Xd, th: 0, thd}); break; }
    samples.push({t, X, Xd, th, thd});
  }
  return {samples, top, exit: t};
})();
function wedge(s: number) {
  header(4, '光滑圆弧槽（槽可以自由滑动）');
  const sc = 160, x0 = 160, gy = 700, R = 1, r = 0.12, tIn = 0.5;
  const {tau, holding} = warp(s, 1.5, 0.45, [{at: tIn + WEDGE.top, dur: 3.2}], tIn + WEDGE.exit + 0.9);
  const S = WEDGE.samples;
  let X = 0, Xd = 0, th = 0, thd = 4, bx: number, by: number, vbx: number, phase = 0;
  if (tau < tIn) { bx = 2.5 - 4 * (tIn - tau); by = r; vbx = 4; }
  else if (tau - tIn < WEDGE.exit) {
    phase = 1;
    const k = Math.min(S.length - 1, Math.round((tau - tIn) / 0.001));
    ({X, Xd, th, thd} = S[k]);
    bx = 2.5 + X + R * Math.sin(th); by = r + R * (1 - Math.cos(th));
    vbx = Xd + R * Math.cos(th) * thd;
  } else {
    phase = 2;
    const last = S[S.length - 1], u = tau - tIn - WEDGE.exit;
    X = last.X + last.Xd * u; Xd = last.Xd; vbx = last.Xd + R * last.thd;
    bx = 2.5 + last.X + vbx * u; by = r; th = 0; thd = 0;
  }
  const Xc = 2.5 + X;
  const px = (x: number) => x0 + x * sc, py = (y: number) => gy - y * sc;
  ground('g', gy, 120, 1320);
  let d = `M ${px(Xc)} ${py(0)}`;
  for (let i = 1; i <= 30; i++) { const a = (i / 30) * (Math.PI / 2); d += ` L ${px(Xc + (R + r) * Math.sin(a))} ${py((R + r) * (1 - Math.cos(a)))}`; }
  d += ` L ${px(Xc + R + r)} ${py(1.3)} L ${px(Xc + R + r + 0.4)} ${py(1.3)} L ${px(Xc + R + r + 0.4)} ${py(0)} Z`;
  P('wedge', d, C.B, 3, C.B, 0.85);
  T('wedge-l', '槽 M = 3 kg', px(Xc + R + r + 0.2) - 100, py(1.3) - 40, 22, C.B, 700, 200, 'center');
  E('ball', px(bx), py(by), r * sc, C.A);
  const h = by - r;
  if (phase === 1) {
    P('h-line', `M ${px(bx) - 40} ${py(by)} L ${px(bx) - 40} ${py(r)}`, C.Eg, 2, 'transparent', 0.8);
    T('h-t', `h = ${fmt(h, 2)} m`, px(bx) - 250, py(by / 2 + r / 2) - 16, 22, C.Eg, 600, 200, 'right');
  }
  arrow('vb', px(bx), py(1.3) - 90, vbx * 35, C.A, `球(水平) ${fmt(vbx)} m/s`);
  arrow('vM', px(Xc + 0.7), gy + 50, Xd * 35, C.B, Xd > 0.05 ? `槽 ${fmt(Xd)} m/s` : '槽 静止');
  const vby = phase === 1 ? R * Math.sin(th) * thd : 0;
  const ekb = 0.5 * (vbx * vbx + vby * vby), ekM = 0.5 * 3 * Xd * Xd, eg = 10 * Math.max(0, h);
  bars('en', 160, 860, 8, [
    {label: 'Ek球', value: ekb, color: C.A},
    {label: 'Ek槽', value: ekM, color: C.B},
    {label: '重力势能', value: eg, color: C.Eg},
  ], 900, '能量分配（J）——总量始终 8 J');
  panel('rd', 1360, 170, 440, [
    [`v球(水平) = ${fmt(vbx, 2)} m/s`, C.A],
    [`v槽 = ${fmt(Xd, 2)} m/s`, C.B],
    [`p水平 = ${fmt(vbx + 3 * Xd)} kg·m/s`, C.hl],
    [`高度 h = ${fmt(Math.max(0, h), 2)} m`, C.Eg],
  ]);
  holdBadge(holding === 0);
  eqCard('eq', 1360, 430, 440, [
    ['动量', '1\\times4=(1+3)v\\Rightarrow v=1', C.hl],
    ['能量', '\\tfrac12\\cdot1\\cdot4^2=\\tfrac12\\cdot4\\cdot1^2+mgh', C.Eg],
    ['结果', 'h=0.6\\ \\mathrm{m}', C.Eg],
  ], smooth((s - (1.5 + (tIn + WEDGE.top) / 0.45)) / 0.6));
  let cap = '小球 m = 1 kg 以 4 m/s 冲上光滑、可自由滑动的圆弧槽 M = 3 kg';
  if (phase === 1) cap = '竖直方向有重力 → 只有水平动量守恒；全程光滑 → 机械能守恒';
  if (holding === 0) cap = '最高点：球和槽水平共速 1 m/s（球不是静止！）h = (8 − 2)/10 = 0.6 m';
  if (phase === 1 && holding < 0 && tau > tIn + WEDGE.top) cap = '小球滑回来，继续推着槽向右加速';
  if (phase === 2) cap = '离开槽：v球 = −2 m/s（向左），v槽 = 2 m/s——等效一次弹性碰撞';
  caption(cap);
}

// ---------- 模型 5：子弹打木块 ----------
function bullet(s: number) {
  header(5, '子弹打木块');
  const sc = 220, x0 = 160, gy = 600;
  const {tau, holding} = warp(s, 1.5, 0.04, [{at: 0.16, dur: 3}], 0.36);
  let tip: number, xB: number, vb: number, vB: number, phase = 0;
  if (tau < 0.08) { tip = 1.7 + 10 * tau; xB = 2.5; vb = 10; vB = 0; }
  else if (tau < 0.16) { const u = tau - 0.08; phase = 1; tip = 2.5 + 10 * u - 50 * u * u; xB = 2.5 + 12.5 * u * u; vb = 10 - 100 * u; vB = 25 * u; }
  else { const u = tau - 0.16; phase = 2; tip = 2.5 + 0.48 + 2 * u; xB = 2.5 + 0.08 + 2 * u; vb = 2; vB = 2; }
  ground('g', gy, 120, 1320);
  R('blk', x0 + xB * sc, gy - 110, 132, 110, C.B, 6, '', 0, 0.9);
  T('blk-l', '木块 0.8kg', x0 + xB * sc, gy - 40, 20, '#0b1020', 700, 132, 'center');
  R('bul', x0 + (tip - 0.14) * sc, gy - 66, 0.14 * sc, 14, C.A, 7);
  const depth = Math.max(0, tip - xB);
  if (phase >= 1) {
    P('dep', `M ${x0 + xB * sc} ${gy - 130} L ${x0 + tip * sc} ${gy - 130}`, C.Q, 3);
    T('dep-t', `打入深度 d = ${fmt(depth, 2)} m`, x0 + xB * sc - 60, gy - 175, 22, C.Q, 600, 320);
  }
  arrow('vb', x0 + tip * sc - 20, gy - 230, vb * 14, C.A, `子弹 ${fmt(vb)} m/s`);
  arrow('vB', x0 + xB * sc + 66, gy + 60, vB * 14, C.B, vB > 0.05 ? `木块 ${fmt(vB)} m/s` : '木块 静止');
  T('slow', '慢放 25 倍', 1360, 150, 22, C.muted, 600, 200);
  const ekb = 0.5 * 0.2 * vb * vb, ekB = 0.5 * 0.8 * vB * vB;
  bars('en', 160, 860, 10, [
    {label: 'Ek子弹', value: ekb, color: C.A},
    {label: 'Ek木块', value: ekB, color: C.B},
    {label: '热Q', value: 10 - ekb - ekB, color: C.Q},
  ], 900, '能量分配（J）');
  panel('rd', 1360, 200, 440, [
    [`v子弹 = ${fmt(vb, 2)} m/s`, C.A],
    [`v木块 = ${fmt(vB, 2)} m/s`, C.B],
    [`p总 = ${fmt(0.2 * vb + 0.8 * vB)} kg·m/s`, C.hl],
    [`热 Q = ${fmt(10 - ekb - ekB, 2)} J`, C.Q],
  ]);
  holdBadge(holding === 0);
  eqCard('eq', 1360, 460, 440, [
    ['动量', '0.2\\times10=(0.2+0.8)v\\Rightarrow v=2', C.hl],
    ['能量', 'Q=10-\\tfrac12\\cdot1\\cdot2^2=8', C.Q],
    ['热量', 'Q=f\\cdot d', C.Q],
  ], smooth((s - (1.5 + 0.16 / 0.04)) / 0.6));
  let cap = '子弹 m = 0.2 kg 以 10 m/s 射向静止木块 M = 0.8 kg，地面光滑';
  if (phase === 1) cap = '时间极短，内力 ≫ 外力 → 动量守恒；子弹受摩擦阻力 → 生热';
  if (holding === 0) cap = '子弹停在木块里 = 共速 2 m/s：Q = 10 − 2 = 8 J = f·d（d 是相对位移）';
  if (phase === 2 && holding < 0) cap = '若木块不够长、共速前子弹到达末端，就会打穿';
  caption(cap);
}

// ---------- 模型 6：人船 ----------
function boat(s: number) {
  header(6, '人船模型（总动量始终为 0）');
  const sc = 120, x0 = 160, wy = 640;
  const p = smooth((s - 2) / 6), dp = (s > 2 && s < 8) ? 6 * ((s - 2) / 6) * (1 - (s - 2) / 6) / 6 : 0;
  const r = 4 * p, vrel = 4 * dp * 1.2; // vrel 仅用于显示箭头（比例）
  const Xb = 4 - r / 4, xp = Xb + 0.2 + r;
  const vb = -vrel / 4, vp = vrel * 0.75;
  // 水面与岸边参考线
  P('water', `M 120 ${wy} L 1320 ${wy}`, '#3d6fb8', 4);
  for (let i = 0; i < 12; i++) P('wv' + i, `M ${150 + i * 100} ${wy + 18} q 15 -10 30 0 q 15 10 30 0`, '#2c4d80', 3);
  P('ref1', `M ${x0 + 4.2 * sc} ${wy - 330} L ${x0 + 4.2 * sc} ${wy + 40}`, C.muted, 2, 'transparent', 0.5);
  P('ref2', `M ${x0 + 4 * sc} ${wy - 300} L ${x0 + 4 * sc} ${wy + 40}`, C.muted, 2, 'transparent', 0.5);
  const bx = x0 + Xb * sc;
  P('hull', `M ${bx - 20} ${wy - 40} L ${bx + 4.4 * sc + 20} ${wy - 40} L ${bx + 4.4 * sc - 20} ${wy + 20} L ${bx + 20} ${wy + 20} Z`, C.B, 2, C.B, 0.9);
  T('hull-l', '船 M = 150 kg，长 4 m', bx, wy - 32, 22, '#0b1020', 700, 4.4 * sc, 'center');
  const hx = x0 + xp * sc;
  E('head', hx, wy - 190, 22, C.A);
  P('body', `M ${hx} ${wy - 168} L ${hx} ${wy - 100} M ${hx} ${wy - 150} L ${hx - 26} ${wy - 120} M ${hx} ${wy - 150} L ${hx + 26} ${wy - 120} M ${hx} ${wy - 100} L ${hx - 20 + 10 * Math.sin(s * 8 * (dp > 0 ? 1 : 0))} ${wy - 42} M ${hx} ${wy - 100} L ${hx + 20 - 10 * Math.sin(s * 8 * (dp > 0 ? 1 : 0))} ${wy - 42}`, C.A, 6);
  T('p-l', '人 50 kg', hx - 60, wy - 260, 22, C.A, 600, 120, 'center');
  if (dp > 0) {
    arrow('vp', hx, wy - 300, 120 * dp * 6 / 1.5, C.A, '人 →');
    arrow('vbt', bx + 2.2 * sc, wy + 70, -40 * dp * 6 / 1.5, C.B, '← 船');
  }
  if (s > 8.3) {
    P('dx-p', `M ${x0 + 4.2 * sc} ${wy - 350} L ${hx} ${wy - 350}`, C.A, 4);
    T('dx-pt', 'x人 = 3 m', x0 + 4.2 * sc, wy - 395, 24, C.A, 700, 300);
    P('dx-b', `M ${x0 + 4 * sc} ${wy + 90} L ${bx} ${wy + 90}`, C.B, 4);
    T('dx-bt', 'x船 = 1 m', bx - 20, wy + 100, 24, C.B, 700, 200);
  }
  panel('rd', 1360, 170, 440, [
    [`人对地位移 = ${fmt(xp - 4.2, 2)} m`, C.A],
    [`船对地位移 = ${fmt(Xb - 4, 2)} m`, C.B],
    ['p总 = 0（始终）', C.hl],
    [`50×${fmt(xp - 4.2, 2)} + 150×(${fmt(Xb - 4, 2)}) = 0`, C.text],
  ], '读数');
  eqCard('eq', 1360, 430, 440, [
    ['动量', '!50·x人 = 150·x船', C.hl],
    ['几何', '!x人 + x船 = 4 m', C.text],
    ['结果', '!x人 = 3 m，x船 = 1 m', C.A],
  ], smooth((s - 8.3) / 0.6));
  let cap = '人 m = 50 kg 站在静止的船 M = 150 kg 一端，走到另一端；水的阻力不计';
  if (s > 2 && s < 8.3) cap = '人向前走，船就向后退：任何时刻 m·v人 = M·v船，总动量始终为 0';
  if (s >= 8.3) cap = '位移也成比例：50·x人 = 150·x船，x人 + x船 = 4 m → x人 = 3 m，x船 = 1 m';
  caption(cap);
  void vb; void vp;
}

// ---------- 模型 7：爆炸 / 反冲 ----------
function explosion(s: number) {
  header(7, '爆炸与反冲（动能会增加）');
  const sc = 100, x0 = 160, gy = 600;
  const t = Math.max(0, (s - 3) * 0.5), tt = Math.min(t, 1.2);
  ground('g', gy, 120, 1320);
  const v1 = t > 0 ? -4 : 0, v2 = t > 0 ? 2 : 0;
  if (t <= 0) {
    block('O', x0 + 5.6 * sc, gy, 140, 90, C.Eg, '3 kg');
    if (s > 2) { const k = (s - 2) % 0.4 < 0.2 ? 1 : 0.6; R('glow', x0 + 5.6 * sc - 6, gy - 96, 152, 102, 'transparent', 10, C.hl, 4, k); }
  } else {
    const x1 = 5.6 + v1 * tt, x2 = 6.1 + v2 * tt;
    if (t < 0.4) E('flash', x0 + 6.3 * sc, gy - 45, 60 + 400 * t, C.hl, 0.7 * (1 - t / 0.4));
    block('m1', x0 + x1 * sc, gy, 50, 70, C.A, '1kg');
    block('m2', x0 + x2 * sc, gy, 90, 90, C.B, '2kg');
    arrow('v1', x0 + x1 * sc + 25, gy - 130, v1 * 40, C.A, '−4 m/s');
    arrow('v2', x0 + x2 * sc + 45, gy - 150, v2 * 40, C.B, '2 m/s');
  }
  const ek = t > 0 ? 0.5 * 16 + 0.5 * 2 * 4 : 0;
  bars('en', 160, 860, 12, [
    {label: 'Ek(1kg)', value: t > 0 ? 8 : 0, color: C.A},
    {label: 'Ek(2kg)', value: t > 0 ? 4 : 0, color: C.B},
    {label: '化学能', value: 12 - ek, color: C.Eg},
  ], 900, '能量分配（J）');
  panel('rd', 1360, 170, 440, [
    [`v1 = ${fmt(v1)} m/s`, C.A],
    [`v2 = ${fmt(v2)} m/s`, C.B],
    [`p总 = 1×(${fmt(v1)}) + 2×${fmt(v2)} = 0`, C.hl],
    [`Ek总 = ${fmt(ek)} J`, C.Ep],
  ]);
  eqCard('eq', 1360, 430, 440, [
    ['动量', '0=1\\cdot v_1+2\\cdot v_2', C.hl],
    ['能量', '\\tfrac12\\cdot1\\cdot v_1^2+\\tfrac12\\cdot2\\cdot v_2^2=12', C.Ep],
    ['结果', 'v_1=-4,\\ v_2=2', C.A],
  ], smooth((s - 5.5) / 0.6));
  let cap = '静止的物体（3 kg）炸成两块：m1 = 1 kg，m2 = 2 kg，释放化学能 12 J';
  if (t > 0) cap = '0 = m1·v1 + m2·v2 → 两块反向飞出，质量小的跑得快';
  if (t > 1.2) cap = 'v1 = −4 m/s，v2 = 2 m/s；动能 0 → 12 J，来自化学能（唯一动能增加的情况）';
  caption(cap);
}

// ---------- 片头 / 片尾 ----------
function intro(s: number) {
  const a = smooth(s / 0.8);
  T('t1', '动量守恒 × 能量守恒', 160, 200, 84, C.text, 800, 1600, 'left', a);
  T('t2', '七大模型动画演示 · 江苏新高考物理一轮复习', 164, 330, 34, C.muted, 500, 1600, 'left', a);
  const items = ['① 弹性 / 完全非弹性碰撞', '② 板块模型', '③ 弹簧模型', '④ 可动圆弧槽', '⑤ 子弹打木块', '⑥ 人船模型', '⑦ 爆炸与反冲'];
  items.forEach((it, i) => T('i' + i, it, 164 + (i % 2) * 560, 450 + Math.floor(i / 2) * 70, 34, C.text, 500, 540, 'left', smooth((s - 1 - i * 0.25) / 0.5)));
  R('key-bg', 160, 760, 1600, 120, C.panel, 16, C.hl, 2, smooth((s - 3.5) / 0.6));
  T('key', '动量管速度　·　能量管位移、高度、热量', 200, 790, 44, C.hl, 700, 1520, 'center', smooth((s - 3.5) / 0.6));
}
function outro(s: number) {
  T('o1', '一句话记住', 160, 120, 40, C.muted, 600, 1600, 'left', smooth(s / 0.6));
  const lines: [string, string][] = [
    ['共速 = 弹簧最短/最长、槽上最高点、恰好不滑出 → 能量损失最多 / Ep 最大', C.hl],
    ['分离 = 弹簧恢复原长、离开圆弧槽 → 等效一次弹性碰撞', C.Ep],
    ['有摩擦：减少的机械能 = Q = f × s相对（相对位移！）', C.Q],
    ['做题四步：分过程 → 判守恒 → 找关键状态 → 列两个方程（先定正方向）', C.text],
  ];
  lines.forEach(([l, c], i) => {
    const a = smooth((s - 0.8 - i * 0.9) / 0.6);
    R('ob' + i, 160, 220 + i * 170, 1600, 130, C.panel, 16, c, 2, a);
    T('ol' + i, l, 200, 258 + i * 170, 38, c, 700, 1520, 'left', a);
  });
}

export default defineComponent({
  name: '动量能量七大模型',
  parameters: {
    freezes: {type: 'string', label: '配音定格（场景秒:时长,…）', default: ''},
    model: {type: 'enum', label: '模型', options: ['intro', 'collision', 'board', 'spring', 'wedge', 'bullet', 'boat', 'explosion', 'outro'], default: 'collision'},
  },
  render(ctx, params) {
    N = [];
    R('bg', 0, 0, 1920, 1080, C.bg, 0);
    // 为配音插入的画面定格：在原时间点 t 停 d 秒
    let s = ctx.seconds;
    const fr = String(params.freezes || '').split(',').filter(Boolean).map((p) => p.split(':').map(Number)).sort((a, b) => a[0] - b[0]);
    for (const [t, d] of fr) { if (s < t) break; if (s < t + d) { s = t; break; } s -= d; }
    const m = String(params.model);
    if (m === 'intro') intro(s);
    else if (m === 'collision') collision(s);
    else if (m === 'board') board(s);
    else if (m === 'spring') springModel(s);
    else if (m === 'wedge') wedge(s);
    else if (m === 'bullet') bullet(s);
    else if (m === 'boat') boat(s);
    else if (m === 'explosion') explosion(s);
    else outro(s);
    return N;
  },
});
