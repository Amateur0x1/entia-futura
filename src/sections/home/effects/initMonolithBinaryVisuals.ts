const I_CHING_64_GUA =
  '乾坤屯蒙需讼师比小畜履泰否同人大有谦豫随蛊临观噬嗑贲剥复无妄大畜颐大过坎离咸恒遁大壮晋明夷家人睽蹇解损益夬姤萃升困井革鼎震艮渐归妹丰旅巽兑涣节中孚小过既济未济';
const CODE_GARBLED =
  '{}[]()<>+=-*/%$#@!?&|^~;:,.`\'"\\_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const BINARY_TEXT = '01';

const PHASE_CHAR_POOLS = [BINARY_TEXT, CODE_GARBLED, I_CHING_64_GUA, ''] as const;
const PHASE_DURATIONS_MS = [25600, 33600, 25600, 14400] as const;
const STREAM_HEIGHT_MULTIPLIER = 3.2;
const EXTRA_TRAVEL_VIEWPORT_MULTIPLIER = 1;
const LEFT_STATIC_REGION_RATIO = 0.25;
const ACCELERATION_END_REGION_RATIO = 0.75;
const RIGHT_EDGE_MAX_SPEED_MULTIPLIER = 0.6;
const COLUMN_START_STAGGER_ROWS = 10;
const BASE_COLUMN_DENSITY = 1.18;
const MIN_COLUMNS = 14;
const MAX_COLUMNS = 48;
const PHASE_DENSITY_MULTIPLIER = [1.1, 1, 1.35, 1] as const;
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

const getPhaseByElapsed = (elapsedMs: number) => {
  const cycleDurationMs = PHASE_DURATIONS_MS.reduce((sum, duration) => sum + duration, 0);
  let timeInCycle = elapsedMs % cycleDurationMs;
  for (let index = 0; index < PHASE_DURATIONS_MS.length; index += 1) {
    const duration = PHASE_DURATIONS_MS[index];
    if (timeInCycle < duration) {
      return {
        phaseIndex: index,
        phaseElapsedMs: timeInCycle,
        phaseDurationMs: duration,
      };
    }
    timeInCycle -= duration;
  }
  return {
    phaseIndex: 0,
    phaseElapsedMs: 0,
    phaseDurationMs: PHASE_DURATIONS_MS[0],
  };
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

    const fontSize = prefersReducedMotion ? 10 : 14;
    const lineHeight = prefersReducedMotion ? 12 : 16;
    let streamRows = 0;
    let streamColumns = 0;
    let rowText: string[][] = [];
    let rowCharTopColor: string[][] = [];
    let rowCharBottomColor: string[][] = [];
    let rowCharGradientReverse: boolean[][] = [];
    let columnStartOffsetY: number[] = [];
    let columnFallSpeedMultiplier: number[] = [];
    let minColumnStartOffsetY = 0;
    let maxColumnStartOffsetY = 0;

    let rafId = 0;
    let tick = 0;
    let currentPhase = -1;
    let phaseElapsedMs = 0;
    let lastFrameMs = performance.now();
    let pointerSpeedMultiplier = 1;

    const hoverTarget =
      (streamRoot.closest<HTMLElement>('[data-monolith-visual]') as HTMLElement | null) ?? streamRoot;

    const handlePointerMove = (event: PointerEvent) => {
      const leftBoundaryPx = window.innerWidth * LEFT_STATIC_REGION_RATIO;
      const accelerationEndPx = window.innerWidth * ACCELERATION_END_REGION_RATIO;
      if (event.clientX <= leftBoundaryPx) {
        pointerSpeedMultiplier = 0;
        return;
      }

      if (event.clientX >= accelerationEndPx) {
        pointerSpeedMultiplier = RIGHT_EDGE_MAX_SPEED_MULTIPLIER;
        return;
      }

      const availableWidth = Math.max(accelerationEndPx - leftBoundaryPx, 1);
      const progress = Math.min(1, Math.max(0, (event.clientX - leftBoundaryPx) / availableWidth));
      pointerSpeedMultiplier = progress * RIGHT_EDGE_MAX_SPEED_MULTIPLIER;
    };

    const handlePointerCancel = () => {
      pointerSpeedMultiplier = 1;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerCancel);
    window.addEventListener('blur', handlePointerCancel);

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
      const extraPadding = phaseIndex === 2 ? 3 : 0;
      return measureCharacterCellWidth(pool || BINARY_TEXT, extraPadding);
    });
    const getPhaseColumnCount = (phaseIndex: number, viewportWidth: number) => {
      const charWidth = phaseCharacterCellWidth[phaseIndex];
      const rawColumns = viewportWidth / (charWidth * BASE_COLUMN_DENSITY);
      const scaledColumns = Math.round(rawColumns * PHASE_DENSITY_MULTIPLIER[phaseIndex]);
      return Math.max(MIN_COLUMNS, Math.min(MAX_COLUMNS, scaledColumns));
    };
    const rebuildStreamData = (activePool: string, viewportHeight: number, columnCount: number) => {
      const effectivePool = activePool || BINARY_TEXT;
      streamRows = Math.max(1, Math.ceil((viewportHeight / lineHeight) * STREAM_HEIGHT_MULTIPLIER));
      streamColumns = columnCount;
      rowText = Array.from({ length: streamRows }, () => createRowText(streamColumns, effectivePool));
      rowCharTopColor = Array.from({ length: streamRows }, () =>
        Array.from({ length: streamColumns }, randomGradientColor),
      );
      rowCharBottomColor = Array.from({ length: streamRows }, () =>
        Array.from({ length: streamColumns }, randomGradientColor),
      );
      rowCharGradientReverse = Array.from({ length: streamRows }, () =>
        Array.from({ length: streamColumns }, () => Math.random() > 0.5),
      );
      columnStartOffsetY = Array.from({ length: streamColumns }, () => {
        const staggerRows = (Math.random() * 2 - 1) * COLUMN_START_STAGGER_ROWS;
        return staggerRows * lineHeight;
      });
      columnFallSpeedMultiplier = Array.from({ length: streamColumns }, () => {
        const minSpeed = prefersReducedMotion ? 0.92 : 0.8;
        const maxSpeed = prefersReducedMotion ? 1.08 : 1.25;
        return minSpeed + Math.random() * (maxSpeed - minSpeed);
      });
      minColumnStartOffsetY = columnStartOffsetY.reduce((minValue, offset) => Math.min(minValue, offset), 0);
      maxColumnStartOffsetY = columnStartOffsetY.reduce((maxValue, offset) => Math.max(maxValue, offset), 0);
    };

    const render = () => {
      const rect = streamRoot.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.globalAlpha = prefersReducedMotion ? 0.66 : 0.84;
      ctx.font = `${fontSize}px SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
      ctx.textBaseline = 'middle';
      const now = performance.now();
      const deltaMs = Math.max(0, now - lastFrameMs);
      lastFrameMs = now;
      phaseElapsedMs += deltaMs * pointerSpeedMultiplier;
      const { phaseIndex, phaseElapsedMs: currentPhaseElapsedMs, phaseDurationMs } = getPhaseByElapsed(phaseElapsedMs);

      const charWidth = phaseCharacterCellWidth[phaseIndex];
      const charHalfHeight = lineHeight / 2;
      const activePool = PHASE_CHAR_POOLS[phaseIndex];
      const columnCount = getPhaseColumnCount(phaseIndex, rect.width);
      const phaseProgress = Math.min(1, currentPhaseElapsedMs / phaseDurationMs);

      if (phaseIndex !== currentPhase || streamRows === 0) {
        currentPhase = phaseIndex;
        rebuildStreamData(activePool, rect.height, columnCount);
      }

      const desiredStreamRows = Math.max(1, Math.ceil((rect.height / lineHeight) * STREAM_HEIGHT_MULTIPLIER));
      if (desiredStreamRows !== streamRows || columnCount !== streamColumns) {
        rebuildStreamData(activePool, rect.height, columnCount);
      }

      if (!activePool) {
        tick += 1;
        rafId = window.requestAnimationFrame(render);
        return;
      }

      const streamHeight = streamRows * lineHeight;
      // Start with full compensation so the earliest-entering column still begins above the viewport.
      const startY = -streamHeight - lineHeight - maxColumnStartOffsetY;
      // End with full compensation so the earliest-exiting column still passes below the viewport.
      const endY =
        rect.height +
        lineHeight +
        rect.height * EXTRA_TRAVEL_VIEWPORT_MULTIPLIER -
        minColumnStartOffsetY;
      const streamTop = startY + (endY - startY) * phaseProgress;
      const streamTravelDistance = streamTop - startY;
      const columnStep = rect.width / streamColumns;

      for (let row = 0; row < streamRows; row += 1) {
        const y = streamTop + row * lineHeight + lineHeight / 2;

        for (let col = 0; col < streamColumns; col += 1) {
          const x = col * columnStep + Math.max(0, (columnStep - charWidth) * 0.5);
          const columnTravelAdjustment = streamTravelDistance * (columnFallSpeedMultiplier[col] - 1);
          const yWithColumnOffset = y + columnStartOffsetY[col] + columnTravelAdjustment;
          if (yWithColumnOffset < -lineHeight || yWithColumnOffset > rect.height + lineHeight) continue;
          ctx.fillStyle = createCyanPurpleGradient(
            ctx,
            x,
            yWithColumnOffset,
            charHalfHeight,
            rowCharTopColor[row][col],
            rowCharBottomColor[row][col],
            rowCharGradientReverse[row][col],
          );
          ctx.fillText(rowText[row][col], x, yWithColumnOffset);
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
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerleave', handlePointerCancel);
        window.removeEventListener('blur', handlePointerCancel);
      },
      { once: true },
    );
  });
};
