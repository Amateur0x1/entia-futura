export interface HomeHeroElements {
  heroTransitionRoot: HTMLElement | null;
  heroTransitionFrame: HTMLElement | null;
  heroVideoShell: HTMLElement | null;
  scrollVideo: HTMLVideoElement | null;
  loopVideo: HTMLVideoElement | null;
  heroVideoLoading: HTMLElement | null;
  portalShell: HTMLElement | null;
  signalCards: HTMLElement[];
  nextPanel: HTMLElement | null;
  nextPanelInner: HTMLElement | null;
  nextPanelLabel: HTMLElement | null;
  nextPanelHeading: HTMLElement | null;
  nextPanelDivider: HTMLElement | null;
  nextPanelBody: HTMLElement | null;
  nextPreview: HTMLElement | null;
  nextPreviewInner: HTMLElement | null;
  nextPreviewLabel: HTMLElement | null;
  nextPreviewHeading: HTMLElement | null;
  nextPreviewDivider: HTMLElement | null;
  nextPreviewBody: HTMLElement | null;
  nextPanelParagraphs: HTMLElement[];
  nextPreviewParagraphs: HTMLElement[];
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
  root ? Array.from(root.querySelectorAll<HTMLElement>('.landing-next-panel__paragraph')) : [];

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
  const nextPanel = getHTMLElement(document, '[data-next-panel]');
  const nextPanelInner = getHTMLElement(nextPanel, '[data-next-panel-inner]');
  const nextPanelLabel = getHTMLElement(nextPanel, '.landing-next-panel__label');
  const nextPanelHeading = getHTMLElement(nextPanel, '[data-next-panel-heading]');
  const nextPanelDivider = getHTMLElement(nextPanel, '[data-next-panel-divider]');
  const nextPanelBody = getHTMLElement(nextPanel, '[data-next-panel-body]');
  const nextPreview = getHTMLElement(document, '[data-next-preview]');
  const nextPreviewInner = getHTMLElement(nextPreview, '[data-next-preview-inner]');
  const nextPreviewLabel = getHTMLElement(nextPreview, '.landing-next-panel__label');
  const nextPreviewHeading = getHTMLElement(nextPreview, '[data-next-panel-heading]');
  const nextPreviewDivider = getHTMLElement(nextPreview, '[data-next-panel-divider]');
  const nextPreviewBody = getHTMLElement(nextPreview, '[data-next-panel-body]');
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
    nextPanel,
    nextPanelInner,
    nextPanelLabel,
    nextPanelHeading,
    nextPanelDivider,
    nextPanelBody,
    nextPreview,
    nextPreviewInner,
    nextPreviewLabel,
    nextPreviewHeading,
    nextPreviewDivider,
    nextPreviewBody,
    nextPanelParagraphs: getParagraphs(nextPanelBody),
    nextPreviewParagraphs: getParagraphs(nextPreviewBody),
    knowMoreButton: getHTMLElement(document, '[data-know-more-button]'),
    shapeOverlay,
    primaryVisual: portalShell ?? heroVideoShell,
  };
};
