import gsap from 'gsap';
import { initResearchTrackSectionEffects } from './initResearchTrackSectionEffects';
import { initResearchTrackTransitionEffects } from './initResearchTrackTransitionEffects';

export const initResearchTrackEffects = (
  prefersReducedMotion: boolean,
  shapeOverlay: SVGSVGElement | null,
  shapeGridCells: SVGRectElement[],
) => {
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
  initResearchTrackTransitionEffects({
    track,
    preResearchPreview,
    shapeOverlay,
    shapeGridCells,
  });

  initResearchTrackSectionEffects({
    track,
    panels,
  });
};
