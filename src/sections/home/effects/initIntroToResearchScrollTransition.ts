import gsap from 'gsap';
import { addIntroToResearchHandoffSegment } from './addIntroToResearchHandoffSegment';
import { addResearchTrackPanelMotion } from './addResearchTrackPanelMotion';

interface InitIntroToResearchScrollTransitionOptions {
  prefersReducedMotion: boolean;
  shapeOverlay: SVGSVGElement | null;
  shapeGridCells: SVGRectElement[];
}

export const INTRO_TO_RESEARCH_TIMING = {
  overlayFadeAt: 0.78,
  commitAt: 0.98,
} as const;

export const initIntroToResearchScrollTransition = ({
  prefersReducedMotion,
  shapeOverlay,
  shapeGridCells,
}: InitIntroToResearchScrollTransitionOptions) => {
  const nextPanel = document.querySelector<HTMLElement>('[data-next-panel]');
  const track = document.querySelector<HTMLElement>('[data-research-track]');
  const rail = track?.querySelector<HTMLElement>('[data-research-rail]');
  const panels = rail ? Array.from(rail.querySelectorAll<HTMLElement>('[data-research-panel]')) : [];

  if (!nextPanel || !track || !rail || panels.length === 0) {
    return;
  }

  if (prefersReducedMotion) {
    gsap.set([track, ...panels], { clearProps: 'all' });
    return;
  }

  let initialized = false;

  const createScrollTimeline = () => {
    if (initialized) {
      return;
    }

    initialized = true;

    gsap.set(track, { autoAlpha: 0 });
    gsap.set(panels, { y: 36 });

    const introToResearchTimeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: nextPanel,
        start: 'top 98%',
        end: 'bottom top',
        scrub: true,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onLeaveBack: () => {
          gsap.set(nextPanel, { autoAlpha: 1, y: 0, visibility: 'visible' });
          gsap.set(track, { autoAlpha: 0 });
        },
      },
    });

    addIntroToResearchHandoffSegment({
      introToResearchTimeline,
      track,
      nextPanel,
      shapeOverlay,
      shapeGridCells,
      overlayFadeAt: INTRO_TO_RESEARCH_TIMING.overlayFadeAt,
      commitAt: INTRO_TO_RESEARCH_TIMING.commitAt,
    });
  };

  createScrollTimeline();

  addResearchTrackPanelMotion({
    track,
    panels,
  });
};
