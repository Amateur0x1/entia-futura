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
      // Use opacity:0 only — never visibility:hidden — so the layer is always
      // part of the render tree. This prevents the one-frame colour flash that
      // happens when visibility jumps from hidden→visible on a scrub timeline.
      opacity: '0',
      pointerEvents: 'none',
    },
    styles,
  );

  if (!existingLayer) {
    document.body.appendChild(layer);
  }

  return layer;
};

/**
 * Creates a shade overlay that is positioned *inside* the given outgoingPanel
 * (position: absolute; inset: 0) so that it only darkens that panel's area.
 * This prevents the shade from covering the incoming panel as it slides up
 * from the bottom of the viewport.
 */
export const createTransitionShade = (attributeName: string, outgoingPanel: HTMLElement) => {
  // Ensure the outgoing panel establishes a stacking context so the absolutely-
  // positioned shade clips to its bounds.
  const currentPosition = window.getComputedStyle(outgoingPanel).position;
  if (currentPosition === 'static') {
    outgoingPanel.style.position = 'relative';
  }

  const existingLayer = outgoingPanel.querySelector<HTMLElement>(`[${attributeName}]`);
  const layer = existingLayer ?? document.createElement('div');

  layer.setAttribute(attributeName, '');
  layer.setAttribute('aria-hidden', 'true');
  Object.assign(layer.style, {
    position: 'absolute',
    inset: '0',
    opacity: '0',
    pointerEvents: 'none',
    zIndex: '9',
    background: '#000',
    // Inherit parent's border-radius so the shade follows the panel's rounded corners
    // during the push transition.
    borderRadius: 'inherit',
  });

  if (!existingLayer) {
    outgoingPanel.appendChild(layer);
  }

  return layer;
};

interface AddPanelPushTransitionSegmentOptions {
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

// Re-export createTransitionShade signature remains unchanged externally;
// callers must now pass the outgoingPanel as second argument.

export const setPanelTransitionInitialState = ({
  incomingPanel,
  outgoingPanel,
}: {
  incomingPanel: HTMLElement;
  outgoingPanel: HTMLElement;
}) => {
  gsap.set(outgoingPanel, {
    autoAlpha: 1,
    scale: 1,
    y: 0,
    yPercent: 0,
    filter: 'blur(0px)',
    transformOrigin: '50% 50%',
    zIndex: 36,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  });
  // Keep the incoming panel off-screen (yPercent:100) with opacity:0.
  // We do NOT use visibility:hidden here — the element must remain in the render
  // tree so there is no flash when it enters. Being below the viewport is enough
  // to keep it invisible without the jump-to-visible frame.
  gsap.set(incomingPanel, {
    opacity: 0,
    yPercent: 100,
    y: 0,
    filter: 'blur(0px)',
    transformOrigin: '50% 50%',
    visibility: 'visible',
    pointerEvents: 'none',
    zIndex: 38,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  });
};

export const addPanelPushTransitionSegment = ({
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
      incomingPanel,
      {
        opacity: 1,
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
        immediateRender: false,
        autoAlpha: 1,
        scale: 1,
        y: 0,
        filter: 'blur(0px)',
        transformOrigin: '50% 50%',
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      },
      {
        autoAlpha: 1,
        scale: outgoingScale,
        y: 0,
        filter: 'blur(0px)',
        transformOrigin: '50% 50%',
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
        opacity: 0,
      },
      {
        opacity: shadeOpacity,
        duration,
        ease: 'none',
      },
      startAt,
    )
    .fromTo(
      incomingPanel,
      {
        immediateRender: false,
        opacity: 1,
        yPercent: 100,
        visibility: 'visible',
        pointerEvents: 'none',
        borderTopLeftRadius: PANEL_TRANSITION_RADIUS,
        borderTopRightRadius: PANEL_TRANSITION_RADIUS,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      },
      {
        opacity: 1,
        yPercent: 0,
        duration,
        ease: 'none',
      },
      startAt,
    )
    .to(
      shade,
      {
        opacity: 0,
        duration: 0.08,
        ease: 'none',
      },
      startAt + duration,
    )
    .set(
      outgoingPanel,
      {
        autoAlpha: 0,
        visibility: 'hidden',
        pointerEvents: 'none',
        scale: 1,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
      },
      startAt + duration,
    )
    .set(
      incomingPanel,
      {
        autoAlpha: 1,
        visibility: 'visible',
        pointerEvents: 'auto',
        zIndex: 35,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
      },
      startAt + duration,
    );
};
