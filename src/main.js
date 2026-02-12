const canvas = document.getElementById('network');
const ctx = canvas.getContext('2d');

let dpr = Math.min(2, window.devicePixelRatio || 1);
let points = [];
let count = 0;

const mouse = { x: 0, y: 0, active: false, radius: 170 };
const LINK_DIST = 140;

const COLORS = {
  node: { r: 25, g: 245, b: 255 },
  line: { r: 122, g: 92, b: 255 },
};

function rgba(c, a) {
  return `rgba(${c.r},${c.g},${c.b},${a})`;
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);

  const density = Math.floor((window.innerWidth * window.innerHeight) / 18000);
  count = Math.max(55, Math.min(140, density));

  points = Array.from({ length: count }, () => {
    const x = random(0, window.innerWidth);
    const y = random(0, window.innerHeight);
    return {
      x,
      y,
      ox: x,
      oy: y,
      vx: random(-0.35, 0.35),
      vy: random(-0.35, 0.35),
      r: random(1.2, 2.1),
    };
  });
}

function update(p) {
  p.vx += random(-0.01, 0.01);
  p.vy += random(-0.01, 0.01);

  p.vx += (p.ox - p.x) * 0.0025;
  p.vy += (p.oy - p.y) * 0.0025;

  if (mouse.active) {
    const dx = mouse.x - p.x;
    const dy = mouse.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist < mouse.radius) {
      const safe = Math.max(18, dist);
      const f = 1 - safe / mouse.radius;
      p.vx += (dx / safe) * (0.055 * f);
      p.vy += (dy / safe) * (0.055 * f);
    }
  }

  p.vx *= 0.985;
  p.vy *= 0.985;
  p.vx = Math.max(-0.45, Math.min(0.45, p.vx));
  p.vy = Math.max(-0.45, Math.min(0.45, p.vy));

  p.x += p.vx;
  p.y += p.vy;

  if (p.x < 0 || p.x > window.innerWidth) p.vx *= -1;
  if (p.y < 0 || p.y > window.innerHeight) p.vy *= -1;
  p.x = Math.max(0, Math.min(window.innerWidth, p.x));
  p.y = Math.max(0, Math.min(window.innerHeight, p.y));
}

function draw() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  for (const p of points) update(p);

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const a = points[i];
      const b = points[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < LINK_DIST) {
        const alpha = (1 - d / LINK_DIST) * 0.55;
        ctx.strokeStyle = rgba(COLORS.line, alpha);
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  for (const p of points) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r + 3, 0, Math.PI * 2);
    ctx.fillStyle = rgba(COLORS.node, 0.06);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = rgba(COLORS.node, 0.95);
    ctx.fill();
  }

  requestAnimationFrame(draw);
}

function setMouse(ev) {
  if (ev.touches && ev.touches[0]) {
    mouse.x = ev.touches[0].clientX;
    mouse.y = ev.touches[0].clientY;
  } else {
    mouse.x = ev.clientX;
    mouse.y = ev.clientY;
  }
}

window.addEventListener('resize', resize);
window.addEventListener('mousemove', (e) => { setMouse(e); mouse.active = true; }, { passive: true });
window.addEventListener('mouseleave', () => { mouse.active = false; }, { passive: true });
window.addEventListener('touchstart', (e) => { setMouse(e); mouse.active = true; }, { passive: true });
window.addEventListener('touchmove', (e) => { setMouse(e); mouse.active = true; }, { passive: true });
window.addEventListener('touchend', () => { mouse.active = false; }, { passive: true });

resize();
draw();
