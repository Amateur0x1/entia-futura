import gsap from 'gsap';

export const PANEL_TRANSITION_RADIUS = 'clamp(18px, 2.2vw, 32px)';

export const getPanelFakeScrollDistance = (panel: HTMLElement, panelInner: HTMLElement | null) => {
  if (!panelInner) {
    return 0;
  }

  const panelStyles = window.getComputedStyle(panel);
  const verticalPadding =
    Number.parseFloat(panelStyles.paddingTop || '0') + Number.parseFloat(panelStyles.paddingBottom || '0');
  const availableHeight = Math.max(panel.clientHeight - verticalPadding, 0);

  return Math.max(panelInner.scrollHeight - availableHeight, 0);
};

export const getOrCreateTransitionLayer = (attributeName: string, styles: Partial<CSSStyleDeclaration>) => {
  const existingLayer = document.querySelector<HTMLElement>(`[${attributeName}]`);
  const layer = existingLayer ?? document.createElement('div');

  layer.setAttribute(attributeName, '');
  layer.setAttribute('aria-hidden', 'true');
  Object.assign(
    layer.style,
    {
      position: 'fixed',
      inset: '0',
      opacity: '0',
      visibility: 'hidden',
      pointerEvents: 'none',
    },
    styles,
  );

  if (!existingLayer) {
    document.body.appendChild(layer);
  }

  return layer;
};

export const createTransitionShade = (attributeName: string) =>
  getOrCreateTransitionLayer(attributeName, {
    zIndex: '37',
    background: '#000',
  });

export const createTransitionBackplate = (attributeName: string) =>
  getOrCreateTransitionLayer(attributeName, {
    zIndex: '35',
    background: 'var(--color-secondary)',
  });

interface AddPanelPushTransitionSegmentOptions {
  backplate: HTMLElement;
  duration: number;
  incomingPanel: HTMLElement;
  liftDistance: () => number;
  outgoingPanel: HTMLElement;
  outgoingScale: number;
  shade: HTMLElement;
  shadeOpacity: number;
  startAt: number;
  timeline: gsap.core.Timeline;
}

export const setPanelTransitionInitialState = ({
  incomingPanel,
  outgoingPanel,
}: {
  incomingPanel: HTMLElement;
  outgoingPanel: HTMLElement;
}) => {
  gsap.set(outgoingPanel, {
    transformOrigin: '50% 0%',
    zIndex: 36,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  });
  gsap.set(incomingPanel, {
    autoAlpha: 0,
    yPercent: 100,
    y: 0,
    filter: 'blur(0px)',
    transformOrigin: '50% 50%',
    visibility: 'hidden',
    pointerEvents: 'none',
    zIndex: 38,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  });
};

export const addPanelPushTransitionSegment = ({
  backplate,
  duration,
  incomingPanel,
  liftDistance,
  outgoingPanel,
  outgoingScale,
  shade,
  shadeOpacity,
  startAt,
  timeline,
}: AddPanelPushTransitionSegmentOptions) => {
  timeline
    .set(
      backplate,
      {
        autoAlpha: 1,
        visibility: 'visible',
        zIndex: 35,
      },
      startAt,
    )
    .set(
      shade,
      {
        visibility: 'visible',
        zIndex: 37,
      },
      startAt,
    )
    .set(
      incomingPanel,
      {
        autoAlpha: 1,
        yPercent: 100,
        y: 0,
        filter: 'blur(0px)',
        visibility: 'visible',
        pointerEvents: 'none',
        zIndex: 38,
        borderTopLeftRadius: PANEL_TRANSITION_RADIUS,
        borderTopRightRadius: PANEL_TRANSITION_RADIUS,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      },
      startAt,
    )
    .fromTo(
      outgoingPanel,
      {
        autoAlpha: 1,
        scale: 1,
        y: 0,
        filter: 'blur(0px)',
        visibility: 'visible',
        transformOrigin: '50% 0%',
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      },
      {
        immediateRender: false,
        autoAlpha: 1,
        scale: outgoingScale,
        y: 0,
        filter: 'blur(0px)',
        transformOrigin: '50% 0%',
        borderTopLeftRadius: PANEL_TRANSITION_RADIUS,
        borderTopRightRadius: PANEL_TRANSITION_RADIUS,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        duration,
        ease: 'none',
      },
      startAt,
    )
    .fromTo(
      shade,
      {
        autoAlpha: 0,
        visibility: 'visible',
      },
      {
        autoAlpha: shadeOpacity,
        duration,
        ease: 'none',
      },
      startAt,
    )
    .fromTo(
      incomingPanel,
      {
        autoAlpha: 1,
        yPercent: 100,
        visibility: 'visible',
        pointerEvents: 'none',
        borderTopLeftRadius: PANEL_TRANSITION_RADIUS,
        borderTopRightRadius: PANEL_TRANSITION_RADIUS,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      },
      {
        autoAlpha: 1,
        yPercent: 0,
        duration,
        ease: 'none',
      },
      startAt,
    )
    .to(
      shade,
      {
        autoAlpha: 0,
        duration: 0.08,
        ease: 'none',
      },
      startAt + duration,
    )
    .set(
      backplate,
      {
        autoAlpha: 0,
        visibility: 'hidden',
      },
      startAt + duration,
    )
    .set(
      outgoingPanel,
      {
        visibility: 'hidden',
        pointerEvents: 'none',
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
      },
      startAt + duration,
    )
    .set(
      incomingPanel,
      {
        pointerEvents: 'auto',
        zIndex: 35,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
      },
      startAt + duration,
    )
    .set(
      shade,
      {
        visibility: 'hidden',
      },
      startAt + duration + 0.08,
    );
};
