const PARTICLE_MARGIN = 48;
const TARGET_DENSITY = 600;
const TRAIL_ALPHA = 0.11;
const ANCHOR_X_MIN = 72;
const ANCHOR_X_MAX = 180;
const ANCHOR_X_RATIO = 0.12;
const ANCHOR_Y_MIN = 64;
const ANCHOR_Y_MAX = 150;
const ANCHOR_Y_RATIO = 0.14;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  size: number;
  color: string;
}

const theme = ['#8ff2ff', '#6dd4ff', '#6a8dff', '#f4fcff'];

const getDensity = () => TARGET_DENSITY;

const getAnchorPoint = (width: number, height: number) => {
  const anchorX = Math.min(ANCHOR_X_MAX, Math.max(ANCHOR_X_MIN, width * ANCHOR_X_RATIO));
  const anchorY = Math.min(ANCHOR_Y_MAX, Math.max(ANCHOR_Y_MIN, height * ANCHOR_Y_RATIO));
  return { x: anchorX, y: anchorY };
};

const getRandomColor = () => theme[Math.floor(Math.random() * theme.length)] ?? theme[0];

const buildParticle = (
  width: number,
  height: number,
  mode: 'ambient' | 'burst' = 'ambient',
): Particle => {
  const isBurst = mode === 'burst';
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * (isBurst ? 3.2 : 0.5),
    vy: (Math.random() - 0.5) * (isBurst ? 3.2 : 0.5),
    life: 1,
    decay: 1 / (Math.random() * 90 + 70),
    size: Math.random() * 2 + 0.4,
    color: getRandomColor(),
  };
};

export const initThirdPanelNebulaBackground = ({
  panel,
  prefersReducedMotion,
}: {
  panel: HTMLElement | null;
  prefersReducedMotion: boolean;
}) => {
  if (!panel) {
    return;
  }

  const canvas = panel.querySelector<HTMLCanvasElement>('[data-nebula-canvas]');
  if (!(canvas instanceof HTMLCanvasElement)) {
    return;
  }

  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  let width = 0;
  let height = 0;
  let rafId = 0;
  let density = getDensity();
  let particles: Particle[] = [];
  const resize = () => {
    const bounds = panel.getBoundingClientRect();
    width = Math.max(1, Math.floor(bounds.width));
    height = Math.max(1, Math.floor(bounds.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    density = getDensity();

    if (particles.length < density) {
      while (particles.length < density) {
        particles.push(buildParticle(width, height));
      }
    } else {
      particles.length = density;
    }
  };

  const resetParticle = (particle: Particle, spawnMode: 'ambient' | 'burst' = 'ambient') => {
    Object.assign(particle, buildParticle(width, height, spawnMode));
  };

  const updateParticle = (particle: Particle) => {
    const anchor = getAnchorPoint(width, height);
    const dx = anchor.x - particle.x;
    const dy = anchor.y - particle.y;
    const distance = Math.hypot(dx, dy) + 1;
    const force = Math.min(140 / distance, 1.8);
    particle.vx += (-dy / distance) * force * 0.07;
    particle.vy += (dx / distance) * force * 0.07;

    particle.vx *= 0.95;
    particle.vy *= 0.95;
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life -= particle.decay;

    const outOfBounds =
      particle.x < -PARTICLE_MARGIN ||
      particle.x > width + PARTICLE_MARGIN ||
      particle.y < -PARTICLE_MARGIN ||
      particle.y > height + PARTICLE_MARGIN;

    if (particle.life <= 0 || outOfBounds) {
      resetParticle(particle);
    }
  };

  const drawConnections = () => {
    if (particles.length > 340) {
      return;
    }
    context.lineWidth = 0.55;
    context.strokeStyle = 'rgba(137, 235, 255, 0.45)';
    for (let i = 0; i < particles.length; i += 2) {
      for (let j = i + 2; j < particles.length; j += 5) {
        const a = particles[i];
        const b = particles[j];
        if (!a || !b) {
          continue;
        }
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared > 5400) {
          continue;
        }
        context.globalAlpha = (1 - Math.sqrt(distanceSquared) / 74) * 0.24 * Math.min(a.life, b.life);
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.stroke();
      }
    }
  };

  const frame = () => {
    context.fillStyle = `rgba(5, 7, 11, ${TRAIL_ALPHA})`;
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = 'lighter';

    for (const particle of particles) {
      updateParticle(particle);
      context.globalAlpha = particle.life * 0.9;
      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
      context.fill();
    }

    context.globalCompositeOperation = 'source-over';
    context.globalAlpha = 1;
    drawConnections();
    rafId = window.requestAnimationFrame(frame);
  };

  resize();
  particles = Array.from({ length: density }, () => buildParticle(width, height));
  frame();

  window.addEventListener('resize', resize);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.cancelAnimationFrame(rafId);
      return;
    }
    window.cancelAnimationFrame(rafId);
    frame();
  });
};
