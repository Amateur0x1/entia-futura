import gsap from 'gsap';
import { addIntroToResearchHandoffSegment } from './addIntroToResearchHandoffSegment';
import { addResearchTrackPanelMotion } from './addResearchTrackPanelMotion';

interface InitIntroToResearchScrollTransitionOptions {
  prefersReducedMotion: boolean;
  shapeOverlay: SVGSVGElement | null;
  shapeGridCells: SVGRectElement[];
}

export const initIntroToResearchScrollTransition = ({
  prefersReducedMotion,
  shapeOverlay,
  shapeGridCells,
}: InitIntroToResearchScrollTransitionOptions) => {
  const track = document.querySelector<HTMLElement>('[data-research-track]');
  const rail = track?.querySelector<HTMLElement>('[data-research-rail]');
  const panels = rail ? Array.from(rail.querySelectorAll<HTMLElement>('[data-research-panel]')) : [];
  const preResearchPreview = document.querySelector<HTMLElement>('[data-next-preview]');

  if (!track || !rail || panels.length === 0) {
    return;
  }

  if (prefersReducedMotion) {
    gsap.set([track, ...panels], { clearProps: 'all' });
    return;
  }

  gsap.set(track, { autoAlpha: 0 });
  gsap.set(panels, { y: 36 });
  addIntroToResearchHandoffSegment({
    track,
    preResearchPreview,
    shapeOverlay,
    shapeGridCells,
  });

  addResearchTrackPanelMotion({
    track,
    panels,
  });
};
