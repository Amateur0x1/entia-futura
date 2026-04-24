const I_CHING_64_GUA =
  '乾坤屯蒙需讼师比小畜履泰否同人大有谦豫随蛊临观噬嗑贲剥复无妄大畜颐大过坎离咸恒遁大壮晋明夷家人睽蹇解损益夬姤萃升困井革鼎震艮渐归妹丰旅巽兑涣节中孚小过既济未济';
const CODE_GARBLED =
  '{}[]()<>+=-*/%$#@!?&|^~;:,.`\'"\\_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const BINARY_TEXT = '01';

const PHASE_CHAR_POOLS = [I_CHING_64_GUA, CODE_GARBLED, BINARY_TEXT] as const;
const PHASE_DURATION_MS = 3000;
const CHAR_GRADIENT_COLORS = [
  'rgba(72, 242, 255, 0.95)',
  'rgba(120, 118, 255, 0.92)',
  'rgba(210, 96, 255, 0.9)',
] as const;

const randomCharFrom = (pool: string) => pool[Math.floor(Math.random() * pool.length)] ?? '0';

const randomGradientColor = () =>
  CHAR_GRADIENT_COLORS[Math.floor(Math.random() * CHAR_GRADIENT_COLORS.length)];

const createRowText = (length: number, pool: string) =>
  Array.from({ length }, () => randomCharFrom(pool));

const createCyanPurpleGradient = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  halfHeight: number,
  topColor: string,
  bottomColor: string,
  reverse: boolean,
) => {
  const gradient = reverse
    ? ctx.createLinearGradient(x, y + halfHeight, x, y - halfHeight)
    : ctx.createLinearGradient(x, y - halfHeight, x, y + halfHeight);
  gradient.addColorStop(0, topColor);
  gradient.addColorStop(1, bottomColor);
  return gradient;
};

export const initMonolithBinaryVisuals = (prefersReducedMotion: boolean) => {
  const streamRoots = Array.from(document.querySelectorAll<HTMLElement>('[data-binary-streams]'));

  streamRoots.forEach((streamRoot) => {
    if (streamRoot.dataset.binaryReady === 'true') {
      return;
    }

    streamRoot.dataset.binaryReady = 'true';
    const canvas = document.createElement('canvas');
    canvas.className = 'landing-next-panel__binary-canvas';
    streamRoot.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = streamRoot.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();

    const rows = prefersReducedMotion ? 48 : 82;
    const fontSize = prefersReducedMotion ? 10 : 14;
    const lineHeight = prefersReducedMotion ? 12 : 16;
    const charsPerRow = 180;
    const rowText = Array.from({ length: rows }, () => createRowText(charsPerRow, PHASE_CHAR_POOLS[0]));
    const rowOffset = Array.from({ length: rows }, () => 0);
    const rowCharTopColor = Array.from({ length: rows }, () =>
      Array.from({ length: charsPerRow }, randomGradientColor),
    );
    const rowCharBottomColor = Array.from({ length: rows }, () =>
      Array.from({ length: charsPerRow }, randomGradientColor),
    );
    const rowCharGradientReverse = Array.from({ length: rows }, () =>
      Array.from({ length: charsPerRow }, () => Math.random() > 0.5),
    );

    let rafId = 0;
    let tick = 0;
    let currentPhase = 0;

    const measureCharacterCellWidth = (pool: string, extraPadding: number) => {
      const sampleChars = new Set<string>();
      for (const char of pool) {
        sampleChars.add(char);
      }
      let maxWidth = 0;
      sampleChars.forEach((char) => {
        maxWidth = Math.max(maxWidth, ctx.measureText(char).width);
      });

      return Math.max(1, Math.ceil(maxWidth) + extraPadding);
    };
    ctx.font = `${fontSize}px SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
    const phaseCharacterCellWidth = PHASE_CHAR_POOLS.map((pool, phaseIndex) => {
      // Give the I-Ching phase a little extra spacing, keep others compact.
      const extraPadding = phaseIndex === 0 ? 1 : 0;
      return measureCharacterCellWidth(pool, extraPadding);
    });

    const render = () => {
      const rect = streamRoot.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.globalAlpha = prefersReducedMotion ? 0.66 : 0.84;
      ctx.font = `${fontSize}px SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
      ctx.textBaseline = 'middle';
      const nextPhase = Math.floor((performance.now() / PHASE_DURATION_MS) % PHASE_CHAR_POOLS.length);
      const charWidth = phaseCharacterCellWidth[nextPhase];
      const maxVisibleChars = Math.min(charsPerRow, Math.ceil(rect.width / charWidth) + 2);
      const charHalfHeight = lineHeight / 2;
      const charPool = PHASE_CHAR_POOLS[nextPhase];

      if (nextPhase !== currentPhase) {
        currentPhase = nextPhase;
        for (let row = 0; row < rows; row += 1) {
          rowText[row] = createRowText(charsPerRow, charPool);
          rowCharTopColor[row] = Array.from({ length: charsPerRow }, randomGradientColor);
          rowCharBottomColor[row] = Array.from({ length: charsPerRow }, randomGradientColor);
          rowCharGradientReverse[row] = Array.from(
            { length: charsPerRow },
            () => Math.random() > 0.5,
          );
        }
      }

      for (let row = 0; row < rows; row += 1) {
        if (tick % 3 === 0) {
          const flipCount = 2 + Math.floor(Math.random() * 6);
          for (let i = 0; i < flipCount; i += 1) {
            const idx = Math.floor(Math.random() * rowText[row].length);
            rowText[row][idx] = randomCharFrom(charPool);
            rowCharTopColor[row][idx] = randomGradientColor();
            rowCharBottomColor[row][idx] = randomGradientColor();
            if (!prefersReducedMotion && Math.random() > 0.5) {
              rowCharGradientReverse[row][idx] = !rowCharGradientReverse[row][idx];
            }
          }
        }

        const y = row * lineHeight + lineHeight / 2;
        if (y > rect.height + lineHeight) break;

        for (let col = 0; col < maxVisibleChars; col += 1) {
          const x = rowOffset[row] + col * charWidth;
          ctx.fillStyle = createCyanPurpleGradient(
            ctx,
            x,
            y,
            charHalfHeight,
            rowCharTopColor[row][col],
            rowCharBottomColor[row][col],
            rowCharGradientReverse[row][col],
          );
          ctx.fillText(rowText[row][col], x, y);
        }
      }

      tick += 1;
      rafId = window.requestAnimationFrame(render);
    };

    rafId = window.requestAnimationFrame(render);

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(streamRoot);

    streamRoot.addEventListener(
      'remove',
      () => {
        window.cancelAnimationFrame(rafId);
        resizeObserver.disconnect();
      },
      { once: true },
    );
  });
};
