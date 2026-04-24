const randomBit = () => (Math.random() > 0.5 ? '0' : '1');

const pickBlueCyan = () =>
  Math.random() > 0.5
    ? 'rgba(72, 242, 255, 0.92)'
    : 'rgba(118, 210, 255, 0.9)';

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
    const fontSize = prefersReducedMotion ? 9 : 12;
    const lineHeight = prefersReducedMotion ? 10 : 13;
    const charsPerRow = 220;
    const rowText = Array.from({ length: rows }, () =>
      Array.from({ length: charsPerRow }, randomBit).join(''),
    );
    const rowSpeed = Array.from({ length: rows }, () => 0);
    const rowOffset = Array.from({ length: rows }, () => 0);
    const rowColor = Array.from({ length: rows }, () => pickBlueCyan());

    let rafId = 0;
    let tick = 0;

    const render = () => {
      const rect = streamRoot.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.globalAlpha = prefersReducedMotion ? 0.66 : 0.84;
      ctx.font = `${fontSize}px SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
      ctx.textBaseline = 'middle';

      for (let row = 0; row < rows; row += 1) {
        if (tick % 3 === 0) {
          const chars = rowText[row].split('');
          const flipCount = 2 + Math.floor(Math.random() * 6);
          for (let i = 0; i < flipCount; i += 1) {
            const idx = Math.floor(Math.random() * chars.length);
            chars[idx] = randomBit();
          }
          rowText[row] = chars.join('');
        }

        if (!prefersReducedMotion && tick % 18 === 0 && Math.random() > 0.6) {
          // Subtle cyan hue variation without spatial movement.
          rowColor[row] = pickBlueCyan();
        }

        const y = row * lineHeight + lineHeight / 2;
        if (y > rect.height + lineHeight) break;

        ctx.fillStyle = rowColor[row];
        const text = rowText[row];
        ctx.fillText(text, rowOffset[row], y);
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
