const createBinaryText = (length: number) => {
  let text = '';

  for (let index = 0; index < length; index += 1) {
    text += Math.random() > 0.5 ? '0' : '1';

    if (index < length - 1) {
      text += '\n';
    }
  }

  return text;
};

const configureBinaryColumn = (column: HTMLSpanElement, prefersReducedMotion: boolean) => {
  const colorToken = Math.random() > 0.5 ? 'var(--color-primary)' : 'var(--color-secondary)';
  const opacity = prefersReducedMotion ? 0.28 + Math.random() * 0.18 : 0.42 + Math.random() * 0.42;

  column.textContent = createBinaryText(44 + Math.floor(Math.random() * 18));
  column.style.setProperty('--stream-color', colorToken);
  column.style.setProperty('--stream-opacity', opacity.toFixed(2));

  if (prefersReducedMotion) {
    column.style.setProperty('--stream-duration', '0s');
    column.style.setProperty('--stream-delay', '0s');
    column.style.setProperty('--stream-from', '0%');
    column.style.setProperty('--stream-to', '0%');
    return;
  }

  const reverse = Math.random() > 0.62;
  const duration = 6.8 + Math.random() * 5.4;
  const from = reverse ? `${16 + Math.random() * 24}%` : `${-38 - Math.random() * 22}%`;
  const to = reverse ? `${-34 - Math.random() * 18}%` : `${18 + Math.random() * 44}%`;

  column.style.setProperty('--stream-duration', `${duration.toFixed(2)}s`);
  column.style.setProperty('--stream-delay', `${(-Math.random() * duration).toFixed(2)}s`);
  column.style.setProperty('--stream-from', from);
  column.style.setProperty('--stream-to', to);
};

export const initMonolithBinaryVisuals = (prefersReducedMotion: boolean) => {
  const streamRoots = Array.from(document.querySelectorAll<HTMLElement>('[data-binary-streams]'));

  streamRoots.forEach((streamRoot) => {
    if (streamRoot.dataset.binaryReady === 'true') {
      return;
    }

    streamRoot.dataset.binaryReady = 'true';

    const columnCount = prefersReducedMotion ? 12 : 18;
    const columns: HTMLSpanElement[] = [];

    streamRoot.style.setProperty('--binary-columns', `${columnCount}`);

    for (let index = 0; index < columnCount; index += 1) {
      const column = document.createElement('span');
      column.className = 'landing-next-panel__binary-column';
      configureBinaryColumn(column, prefersReducedMotion);
      streamRoot.appendChild(column);
      columns.push(column);
    }

    if (prefersReducedMotion) {
      return;
    }

    const refreshColumns = () => {
      const refreshCount = Math.max(2, Math.floor(columns.length / 4));

      for (let index = 0; index < refreshCount; index += 1) {
        const column = columns[Math.floor(Math.random() * columns.length)];
        configureBinaryColumn(column, false);
      }
    };

    window.setInterval(refreshColumns, 1400 + Math.round(Math.random() * 900));
  });
};
