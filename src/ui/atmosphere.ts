// Ported from personal-blog src/scripts/atmosphere.ts. Pure decoration, so Math.random is fine here;
// oracle results never use it (see src/engine/rng.ts).

type Effect = 'embers' | 'ash' | 'snow' | 'spores' | 'none';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  phase: number;
}

interface EffectSpec {
  density: number; // particles per 10,000 px²
  spawn: (w: number, h: number, fresh: boolean) => Particle;
  color: (p: Particle, accent: string) => string;
  glow: boolean;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

const SPECS: Record<Exclude<Effect, 'none'>, EffectSpec> = {
  embers: {
    density: 0.35,
    spawn: (w, h, fresh) => ({
      x: rand(0, w), y: fresh ? rand(0, h) : h + 10,
      vx: rand(-0.15, 0.15), vy: rand(-0.9, -0.3),
      r: rand(0.6, 2.2), life: 1, phase: rand(0, Math.PI * 2),
    }),
    color: (_p, accent) => accent,
    glow: true,
  },
  ash: {
    density: 0.3,
    spawn: (w, h, fresh) => ({
      x: rand(0, w), y: fresh ? rand(0, h) : -10,
      vx: rand(-0.2, 0.3), vy: rand(0.15, 0.5),
      r: rand(0.8, 2.4), life: 1, phase: rand(0, Math.PI * 2),
    }),
    color: () => '#9a9a94',
    glow: false,
  },
  snow: {
    density: 0.5,
    spawn: (w, h, fresh) => ({
      x: rand(0, w), y: fresh ? rand(0, h) : -10,
      vx: rand(-0.3, 0.3), vy: rand(0.3, 1.1),
      r: rand(0.6, 2.6), life: 1, phase: rand(0, Math.PI * 2),
    }),
    color: () => '#d9e2e2',
    glow: false,
  },
  spores: {
    density: 0.18,
    spawn: (w, h) => ({
      x: rand(0, w), y: rand(0, h),
      vx: rand(-0.12, 0.12), vy: rand(-0.12, 0.12),
      r: rand(0.8, 2), life: 1, phase: rand(0, Math.PI * 2),
    }),
    color: (_p, accent) => accent,
    glow: true,
  },
};

const MAX_PARTICLES = 140;

function startParticles(canvas: HTMLCanvasElement, effect: Effect, accent: string) {
  if (effect === 'none') return;
  const spec = SPECS[effect];
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let w = 0;
  let h = 0;
  let particles: Particle[] = [];

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const target = Math.min(MAX_PARTICLES, Math.round(((w * h) / 10000) * spec.density));
    particles = Array.from({ length: target }, () => spec.spawn(w, h, true));
  };

  let t = 0;
  let running = true;

  const frame = () => {
    if (!running) return;
    t += 1;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = spec.glow ? 'lighter' : 'source-over';

    particles.forEach((p, i) => {
      p.x += p.vx + Math.sin(t * 0.01 + p.phase) * 0.25;
      p.y += p.vy;
      if (effect === 'embers') p.life -= 0.0016;

      const offscreen = p.y < -20 || p.y > h + 20 || p.x < -20 || p.x > w + 20;
      if (offscreen || p.life <= 0) {
        particles[i] = spec.spawn(w, h, effect === 'spores');
        return;
      }

      // Flicker: each particle pulses on its own phase, like a coal breathing.
      const flicker = 0.55 + 0.45 * Math.sin(t * 0.06 + p.phase * 3);
      ctx.globalAlpha = Math.max(0, p.life * flicker);
      ctx.fillStyle = spec.color(p, accent);

      if (spec.glow) {
        ctx.globalAlpha *= 0.18;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = Math.max(0, p.life * flicker);
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(frame);
  };

  // Don't burn battery animating a tab nobody is looking at.
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) requestAnimationFrame(frame);
  });

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(frame);
}

function startTorch(root: HTMLElement) {
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight * 0.3;
  let x = targetX;
  let y = targetY;
  let flicker = 1;

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    targetX = e.clientX;
    targetY = e.clientY;
  });

  const tick = () => {
    // Ease toward the pointer so the light trails like a carried torch.
    x += (targetX - x) * 0.08;
    y += (targetY - y) * 0.08;
    flicker += (rand(0.9, 1.08) - flicker) * 0.15;
    root.style.setProperty('--tx', `${x}px`);
    root.style.setProperty('--ty', `${y}px`);
    root.style.setProperty('--flicker', flicker.toFixed(3));
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function startAtmosphere() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const body = document.body;
  const accent = getComputedStyle(body).getPropertyValue('--accent').trim() || '#d08a3a';
  const canvas = document.querySelector<HTMLCanvasElement>('.atmo-particles');

  if (canvas) startParticles(canvas, (body.dataset.effect as Effect) ?? 'embers', accent);
  startTorch(document.documentElement);
}
