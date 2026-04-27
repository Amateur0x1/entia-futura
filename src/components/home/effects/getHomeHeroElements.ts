export interface HomeHeroElements {
  heroTransitionRoot: HTMLElement | null;
  heroTransitionFrame: HTMLElement | null;
  heroVideoShell: HTMLElement | null;
  scrollVideo: HTMLVideoElement | null;
  loopVideo: HTMLVideoElement | null;
  heroVideoLoading: HTMLElement | null;
  portalShell: HTMLElement | null;
  signalCards: HTMLElement[];
  secondPanel: HTMLElement | null;
  secondPanelInner: HTMLElement | null;
  secondPanelLabel: HTMLElement | null;
  secondPanelHeading: HTMLElement | null;
  secondPanelDivider: HTMLElement | null;
  secondPanelBody: HTMLElement | null;
  secondPanelParagraphs: HTMLElement[];
  knowMoreButton: HTMLElement | null;
  shapeOverlay: SVGSVGElement | null;
  primaryVisual: HTMLElement | null;
}

const getHTMLElement = (root: ParentNode | null, selector: string) => {
  const element = root?.querySelector(selector);
  return element instanceof HTMLElement ? element : null;
};

const getVideoElement = (root: ParentNode | null, selector: string) => {
  const element = root?.querySelector(selector);
  return element instanceof HTMLVideoElement ? element : null;
};

const getSVGElement = (root: ParentNode | null, selector: string) => {
  const element = root?.querySelector(selector);
  return element instanceof SVGSVGElement ? element : null;
};

const getParagraphs = (root: HTMLElement | null) =>
  root ? Array.from(root.querySelectorAll<HTMLElement>('.landing-second-panel__paragraph')) : [];

export const getHomeHeroElements = (): HomeHeroElements => {
  const heroTransitionRoot = getHTMLElement(document, '[data-hero-transition-root]');
  const heroTransitionFrame = getHTMLElement(heroTransitionRoot, '[data-orbit-frame]');
  const heroVideoShell = getHTMLElement(heroTransitionRoot, '[data-hero-video-shell]');
  const scrollVideo = getVideoElement(heroTransitionRoot, '[data-scroll-video]');
  const loopVideo = getVideoElement(heroTransitionRoot, '[data-loop-video]');
  const heroVideoLoading = getHTMLElement(heroTransitionRoot, '[data-hero-video-loading]');
  const portalShell = getHTMLElement(heroTransitionRoot, '[data-future-portal-shell]');
  const signalCards = heroTransitionRoot
    ? Array.from(heroTransitionRoot.querySelectorAll<HTMLElement>('[data-signal-note]'))
    : [];
  const secondPanel = getHTMLElement(document, '[data-second-panel]');
  const secondPanelInner = getHTMLElement(secondPanel, '[data-second-panel-inner]');
  const secondPanelLabel = getHTMLElement(secondPanel, '.landing-second-panel__label');
  const secondPanelHeading = getHTMLElement(secondPanel, '[data-second-panel-heading]');
  const secondPanelDivider = getHTMLElement(secondPanel, '[data-second-panel-divider]');
  const secondPanelBody = getHTMLElement(secondPanel, '[data-second-panel-body]');
  const shapeOverlay = getSVGElement(document, '[data-shape-overlay]');

  return {
    heroTransitionRoot,
    heroTransitionFrame,
    heroVideoShell,
    scrollVideo,
    loopVideo,
    heroVideoLoading,
    portalShell,
    signalCards,
    secondPanel,
    secondPanelInner,
    secondPanelLabel,
    secondPanelHeading,
    secondPanelDivider,
    secondPanelBody,
    secondPanelParagraphs: getParagraphs(secondPanelBody),
    knowMoreButton: getHTMLElement(document, '[data-know-more-button]'),
    shapeOverlay,
    primaryVisual: portalShell ?? heroVideoShell,
  };
};
