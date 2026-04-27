const SHAPE_OVERLAY_NAMESPACE = 'http://www.w3.org/2000/svg';
const SHAPE_GRID_ROWS = 4;
const SHAPE_GRID_COLS = 6;

export const getShapeScaleX = (target: Element) => {
  void target;
  return 0;
};

export const getShapeScaleY = (target: Element) => {
  void target;
  return 0;
};

export const getShapeTransformOrigin = (target: Element) => {
  void target;
  return 'center center';
};

export const getShapeDuration = (target: Element, maxDuration: number) =>
  Math.min(Number(target.getAttribute('data-shape-duration') ?? 0.42), maxDuration);

export const getShapeDelay = (target: Element, maxDelay: number) =>
  Math.min(Number(target.getAttribute('data-shape-delay') ?? 0), maxDelay);

export const setupShapeOverlayGrid = (shapeOverlay: SVGSVGElement | null) => {
  if (!shapeOverlay) {
    return [];
  }

  const shapeGridCells: SVGRectElement[] = [];

  shapeOverlay.innerHTML = '';
  shapeOverlay.setAttribute('viewBox', '0 0 100 100');
  shapeOverlay.setAttribute('preserveAspectRatio', 'none');

  const defs = document.createElementNS(SHAPE_OVERLAY_NAMESPACE, 'defs');
  const gradient = document.createElementNS(SHAPE_OVERLAY_NAMESPACE, 'linearGradient');
  gradient.setAttribute('id', 'shape-overlay-accent-gradient');
  gradient.setAttribute('x1', '0%');
  gradient.setAttribute('y1', '0%');
  gradient.setAttribute('x2', '100%');
  gradient.setAttribute('y2', '100%');

  const startStop = document.createElementNS(SHAPE_OVERLAY_NAMESPACE, 'stop');
  startStop.setAttribute('offset', '0%');
  startStop.setAttribute('stop-color', 'var(--color-background-strong)');
  startStop.setAttribute('stop-opacity', '1');

  const midStop = document.createElementNS(SHAPE_OVERLAY_NAMESPACE, 'stop');
  midStop.setAttribute('offset', '58%');
  midStop.setAttribute('stop-color', 'var(--color-surface-variant)');
  midStop.setAttribute('stop-opacity', '1');

  const endStop = document.createElementNS(SHAPE_OVERLAY_NAMESPACE, 'stop');
  endStop.setAttribute('offset', '100%');
  endStop.setAttribute('stop-color', 'color-mix(in srgb, var(--color-background-strong) 84%, var(--color-text-primary) 16%)');
  endStop.setAttribute('stop-opacity', '1');

  gradient.append(startStop, midStop, endStop);
  defs.appendChild(gradient);
  shapeOverlay.appendChild(defs);

  const cellsGroup = document.createElementNS(SHAPE_OVERLAY_NAMESPACE, 'g');
  cellsGroup.setAttribute('data-shape-grid-cells', '');
  shapeOverlay.appendChild(cellsGroup);

  const cellWidth = 100 / SHAPE_GRID_COLS;
  const cellHeight = 100 / SHAPE_GRID_ROWS;
  const gap = 0;

  for (let row = 0; row < SHAPE_GRID_ROWS; row += 1) {
    for (let col = 0; col < SHAPE_GRID_COLS; col += 1) {
      const rect = document.createElementNS(SHAPE_OVERLAY_NAMESPACE, 'rect');
      rect.setAttribute('x', `${col * cellWidth + gap / 2}`);
      rect.setAttribute('y', `${row * cellHeight + gap / 2}`);
      rect.setAttribute('width', `${cellWidth - gap + 0.2}`);
      rect.setAttribute('height', `${cellHeight - gap + 0.2}`);
      rect.setAttribute('rx', '0');
      rect.setAttribute('ry', '0');
      rect.setAttribute('fill', 'url(#shape-overlay-accent-gradient)');
      rect.setAttribute('fill-opacity', '1');
      rect.dataset.shapeCellIndex = `${row * SHAPE_GRID_COLS + col}`;
      const centerCol = (SHAPE_GRID_COLS - 1) / 2;
      const centerRow = (SHAPE_GRID_ROWS - 1) / 2;
      const deltaCol = Math.abs(col - centerCol);
      const deltaRow = Math.abs(row - centerRow);
      const maxDistance = Math.sqrt(centerCol * centerCol + centerRow * centerRow) || 1;
      const normalizedDistance = Math.sqrt(deltaCol * deltaCol + deltaRow * deltaRow) / maxDistance;

      rect.dataset.shapeDelay = `${normalizedDistance * 0.22}`;
      rect.dataset.shapeDuration = `${0.36 + normalizedDistance * 0.16}`;
      cellsGroup.appendChild(rect);
      shapeGridCells.push(rect);
    }
  }

  return shapeGridCells;
};
