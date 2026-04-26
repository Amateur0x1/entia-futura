const SHAPE_OVERLAY_NAMESPACE = 'http://www.w3.org/2000/svg';
const SHAPE_GRID_ROWS = 4;
const SHAPE_GRID_COLS = 6;
const SHAPE_DIRECTIONS = ['left', 'right', 'top', 'bottom'] as const;

type ShapeDirection = (typeof SHAPE_DIRECTIONS)[number];

const getShapeDirection = (target: Element): ShapeDirection => {
  const direction = target instanceof SVGRectElement ? target.dataset.shapeDirection : null;
  return SHAPE_DIRECTIONS.includes(direction as ShapeDirection) ? (direction as ShapeDirection) : 'left';
};

export const getShapeScaleX = (target: Element) => {
  const direction = getShapeDirection(target);
  return direction === 'left' || direction === 'right' ? 0 : 1;
};

export const getShapeScaleY = (target: Element) => {
  const direction = getShapeDirection(target);
  return direction === 'top' || direction === 'bottom' ? 0 : 1;
};

export const getShapeTransformOrigin = (target: Element) => {
  const direction = getShapeDirection(target);

  if (direction === 'right') return 'right center';
  if (direction === 'top') return 'center top';
  if (direction === 'bottom') return 'center bottom';
  return 'left center';
};

export const getShapeDuration = (target: Element, maxDuration: number) =>
  Math.min(Number(target.getAttribute('data-shape-duration') ?? 0.4), maxDuration);

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
  startStop.setAttribute('stop-color', 'var(--color-background)');
  startStop.setAttribute('stop-opacity', '1');

  const midStop = document.createElementNS(SHAPE_OVERLAY_NAMESPACE, 'stop');
  midStop.setAttribute('offset', '58%');
  midStop.setAttribute('stop-color', 'var(--color-background)');
  midStop.setAttribute('stop-opacity', '1');

  const endStop = document.createElementNS(SHAPE_OVERLAY_NAMESPACE, 'stop');
  endStop.setAttribute('offset', '100%');
  endStop.setAttribute('stop-color', 'var(--color-background)');
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
      rect.dataset.shapeDirection = SHAPE_DIRECTIONS[Math.floor(Math.random() * SHAPE_DIRECTIONS.length)];
      rect.dataset.shapeDelay = `${Math.random() * 0.24}`;
      rect.dataset.shapeDuration = `${0.3 + Math.random() * 0.28}`;
      cellsGroup.appendChild(rect);
      shapeGridCells.push(rect);
    }
  }

  return shapeGridCells;
};
