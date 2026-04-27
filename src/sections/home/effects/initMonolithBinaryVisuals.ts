const BINARY_TEXT = '01';
const CODE_GARBLED =
  '{}[]()<>+=-*/%$#@!?&|^~;:,.`\'"\\_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const STREAM_CHAR_POOLS = [BINARY_TEXT, CODE_GARBLED] as const;

const STREAM_MIN_SEGMENT_LENGTH = 20;
const STREAM_MAX_SEGMENT_LENGTH = 24;
// Keep columns nearly continuous without segment overlap.
const STREAM_MIN_GAP_ROWS = 0;
const STREAM_MAX_GAP_ROWS = 4;
const STREAM_MIN_HEAD_ROW = -84;
const STREAM_MAX_HEAD_ROW = 10;
const LEFT_STATIC_REGION_RATIO = 0.25;
const ACCELERATION_END_REGION_RATIO = 0.75;
const LEFT_REGION_SPEED_MULTIPLIER = 0;
const MOVING_MIN_SPEED_MULTIPLIER = 0;
const RIGHT_EDGE_MAX_SPEED_MULTIPLIER = 1;
const BASE_COLUMN_DENSITY = 1.92;
const MIN_COLUMNS = 14;
const MAX_COLUMNS = 80;
// Darker violet range aligned with the project's cosmic-violet semantic palette.
const COLOR_BODY = 'rgba(86, 68, 168, 0.56)';
const COLOR_TAIL = 'rgba(74, 56, 148, 0.86)';
const COLOR_TAIL_GLOW = 'rgba(172, 142, 255, 0.56)';
const COLOR_STREAM_GLOW = 'rgba(98, 72, 188, 0.28)';
const FONT_SIZE_STEPS = {
  reduced: [
    { minWidth: 0, fontSize: 10, lineHeight: 12 },
    { minWidth: 640, fontSize: 11, lineHeight: 13 },
    { minWidth: 1024, fontSize: 12, lineHeight: 14 },
  ],
  normal: [
    { minWidth: 0, fontSize: 12, lineHeight: 14 },
    { minWidth: 720, fontSize: 13, lineHeight: 15 },
    { minWidth: 960, fontSize: 14, lineHeight: 16 },
    { minWidth: 1280, fontSize: 15, lineHeight: 17 },
    { minWidth: 1600, fontSize: 16, lineHeight: 18 },
  ],
} as const;

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);
const randomIntBetween = (min: number, max: number) => Math.floor(randomBetween(min, max + 1));

const randomCharFrom = (pool: string) => pool[Math.floor(Math.random() * pool.length)] ?? '0';

const buildRandomSegment = (length: number) => {
  let output = '';
  while (output.length < length) {
    const pool = STREAM_CHAR_POOLS[Math.floor(Math.random() * STREAM_CHAR_POOLS.length)] ?? BINARY_TEXT;
    output += randomCharFrom(pool);
  }
  return output.slice(0, length).split('');
};

interface StreamSegment {
  chars: string[];
  headRow: number;
  speedRowsPerSecond: number;
  gapRows: number;
  mutationElapsedMs: number[];
  mutationIntervalMs: number[];
  repeatDistanceRows: number;
}

const randomCharFromPools = () =>
  randomCharFrom(STREAM_CHAR_POOLS[Math.floor(Math.random() * STREAM_CHAR_POOLS.length)] ?? BINARY_TEXT);

const getMutationIntervalMs = (depthRatio: number, prefersReducedMotion: boolean) => {
  const fastMin = prefersReducedMotion ? 160 : 70;
  const slowMax = prefersReducedMotion ? 640 : 360;
  const base = fastMin + depthRatio * (slowMax - fastMin);
  // Make the brightest tail mutate about 3x slower while keeping upper chars near current speed.
  const tailSlowdownMultiplier = 1 + depthRatio * 2;
  return base * tailSlowdownMultiplier * randomBetween(0.82, 1.24);
};

export const initMonolithBinaryVisuals = (prefersReducedMotion: boolean) => {
  const streamRoots = Array.from(document.querySelectorAll<HTMLElement>('[data-binary-streams]'));

  streamRoots.forEach((streamRoot) => {
    if (streamRoot.dataset.binaryReady === 'true') {
      return;
    }

    streamRoot.dataset.binaryReady = 'true';
    const canvas = document.createElement('canvas');
    canvas.className = 'landing-second-panel__binary-canvas';
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

    let fontSize = prefersReducedMotion ? 10 : 14;
    let lineHeight = prefersReducedMotion ? 12 : 16;
    let streamColumns = 0;
    let streamSegments: StreamSegment[] = [];
    let charCellWidth = 12;

    let rafId = 0;
    let lastFrameMs = performance.now();
    let pointerSpeedMultiplier = 1;

    const hoverTarget =
      (streamRoot.closest<HTMLElement>('[data-monolith-visual]') as HTMLElement | null) ?? streamRoot;

    const handlePointerMove = (event: PointerEvent) => {
      const leftBoundaryPx = window.innerWidth * LEFT_STATIC_REGION_RATIO;
      const accelerationEndPx = window.innerWidth * ACCELERATION_END_REGION_RATIO;
      if (event.clientX <= leftBoundaryPx) {
        pointerSpeedMultiplier = LEFT_REGION_SPEED_MULTIPLIER;
        return;
      }

      if (event.clientX >= accelerationEndPx) {
        pointerSpeedMultiplier = RIGHT_EDGE_MAX_SPEED_MULTIPLIER;
        return;
      }

      const availableWidth = Math.max(accelerationEndPx - leftBoundaryPx, 1);
      const progress = Math.min(1, Math.max(0, (event.clientX - leftBoundaryPx) / availableWidth));
      pointerSpeedMultiplier =
        MOVING_MIN_SPEED_MULTIPLIER +
        progress * (RIGHT_EDGE_MAX_SPEED_MULTIPLIER - MOVING_MIN_SPEED_MULTIPLIER);
    };

    const handlePointerCancel = () => {
      pointerSpeedMultiplier = 1;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerCancel);
    window.addEventListener('blur', handlePointerCancel);

    const measureCharacterCellWidth = () => {
      const sampleChars = new Set<string>();
      STREAM_CHAR_POOLS.forEach((pool) => {
        for (const char of pool) sampleChars.add(char);
      });
      let maxWidth = 0;
      sampleChars.forEach((char) => {
        maxWidth = Math.max(maxWidth, ctx.measureText(char).width);
      });
      return Math.max(1, Math.ceil(maxWidth));
    };

    const recomputeTypography = (viewportWidth: number) => {
      const steps = prefersReducedMotion ? FONT_SIZE_STEPS.reduced : FONT_SIZE_STEPS.normal;
      const matchedStep =
        [...steps].reverse().find((step) => viewportWidth >= step.minWidth) ?? steps[0];
      fontSize = matchedStep.fontSize;
      lineHeight = matchedStep.lineHeight;
      ctx.font = `${fontSize}px SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
      charCellWidth = measureCharacterCellWidth();
    };
    recomputeTypography(streamRoot.getBoundingClientRect().width);

    const getColumnCount = (viewportWidth: number) => {
      const rawColumns = viewportWidth / (charCellWidth * BASE_COLUMN_DENSITY);
      return Math.max(MIN_COLUMNS, Math.min(MAX_COLUMNS, Math.round(rawColumns)));
    };

    const createSegment = (headRowOverride?: number): StreamSegment => {
      const segmentLength = randomIntBetween(STREAM_MIN_SEGMENT_LENGTH, STREAM_MAX_SEGMENT_LENGTH);
      const tailIndex = segmentLength - 1;
      const mutationElapsedMs = Array.from({ length: segmentLength }, () => randomBetween(0, 160));
      const mutationIntervalMs = Array.from({ length: segmentLength }, (_, index) => {
        const depthRatio = index / Math.max(tailIndex, 1);
        return getMutationIntervalMs(depthRatio, prefersReducedMotion);
      });
      return {
        chars: buildRandomSegment(segmentLength),
        headRow:
          typeof headRowOverride === 'number'
            ? headRowOverride
            : randomBetween(STREAM_MIN_HEAD_ROW, STREAM_MAX_HEAD_ROW),
        speedRowsPerSecond: prefersReducedMotion ? randomBetween(9, 11) : randomBetween(13, 19),
        gapRows: randomIntBetween(STREAM_MIN_GAP_ROWS, STREAM_MAX_GAP_ROWS),
        mutationElapsedMs,
        mutationIntervalMs,
        repeatDistanceRows: segmentLength + randomIntBetween(STREAM_MIN_GAP_ROWS, STREAM_MAX_GAP_ROWS),
      };
    };

    const normalizeHeadRow = (segment: StreamSegment) => {
      const wrap = Math.max(1, segment.repeatDistanceRows);
      while (segment.headRow >= wrap) segment.headRow -= wrap;
      while (segment.headRow < 0) segment.headRow += wrap;
    };

    const rebuildStreamData = (columnCount: number) => {
      streamColumns = columnCount;
      const headRowSpan = STREAM_MAX_HEAD_ROW - STREAM_MIN_HEAD_ROW;
      streamSegments = Array.from({ length: streamColumns }, (_, index) => {
        // Uniformly spread initial segments per column, then add mild jitter.
        const distributedHeadRow =
          STREAM_MIN_HEAD_ROW +
          (headRowSpan * (index + 0.5)) / Math.max(streamColumns, 1) +
          randomBetween(-6, 6);
        return createSegment(distributedHeadRow);
      });
    };

    const render = () => {
      const rect = streamRoot.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.globalAlpha = prefersReducedMotion ? 0.74 : 0.9;
      ctx.font = `${fontSize}px SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
      ctx.textBaseline = 'middle';
      const now = performance.now();
      const deltaMs = Math.max(0, now - lastFrameMs);
      lastFrameMs = now;
      const columnCount = getColumnCount(rect.width);
      if (streamColumns !== columnCount || streamSegments.length === 0) {
        rebuildStreamData(columnCount);
      }

      const columnStep = rect.width / streamColumns;

      streamSegments.forEach((segment, col) => {
        const movementRows = (segment.speedRowsPerSecond * deltaMs * pointerSpeedMultiplier) / 1000;
        segment.headRow += movementRows;
        normalizeHeadRow(segment);

        const x = col * columnStep + Math.max(0, (columnStep - charCellWidth) * 0.5);
        const tailIndex = segment.chars.length - 1;

        segment.chars.forEach((char, index) => {
          segment.mutationElapsedMs[index] += deltaMs;
          if (segment.mutationElapsedMs[index] >= segment.mutationIntervalMs[index]) {
            segment.chars[index] = randomCharFromPools();
            segment.mutationElapsedMs[index] %= segment.mutationIntervalMs[index];
            const depthRatio = index / Math.max(tailIndex, 1);
            segment.mutationIntervalMs[index] = getMutationIntervalMs(depthRatio, prefersReducedMotion);
            char = segment.chars[index];
          }

          const baseRow = segment.headRow - (tailIndex - index);
          const repeatDistance = Math.max(1, segment.repeatDistanceRows);
          const firstVisibleRepeat = Math.floor((baseRow * lineHeight + lineHeight / 2) / (repeatDistance * lineHeight));
          for (let repeat = firstVisibleRepeat + 2; repeat >= firstVisibleRepeat - 6; repeat -= 1) {
            const row = baseRow - repeat * repeatDistance;
            const y = row * lineHeight + lineHeight / 2;
            if (y < -lineHeight || y > rect.height + lineHeight) continue;

            const depthRatio = index / Math.max(tailIndex, 1);
            const alpha = 0.28 + depthRatio * 0.52;
            ctx.fillStyle = COLOR_BODY.replace(/[\d.]+\)$/, `${alpha.toFixed(3)})`);
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
            ctx.fillText(char, x, y);

            if (index === tailIndex) {
              ctx.fillStyle = COLOR_TAIL;
              ctx.shadowColor = COLOR_TAIL_GLOW;
              ctx.shadowBlur = prefersReducedMotion ? 7 : 12;
              ctx.fillText(char, x, y);

              ctx.fillStyle = COLOR_STREAM_GLOW;
              ctx.shadowBlur = prefersReducedMotion ? 4 : 7;
              ctx.fillText(char, x, y);
              ctx.shadowBlur = 0;
              ctx.shadowColor = 'transparent';
            }
          }
        });
      });

      rafId = window.requestAnimationFrame(render);
    };

    rafId = window.requestAnimationFrame(render);

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
      recomputeTypography(streamRoot.getBoundingClientRect().width);
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
