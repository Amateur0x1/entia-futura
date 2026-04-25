import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  getShapeDelay,
  getShapeDuration,
  getShapeScaleX,
  getShapeScaleY,
  getShapeTransformOrigin,
} from './shapeOverlayGrid';

export const initResearchTrackEffects = (
  prefersReducedMotion: boolean,
  shapeOverlay: SVGSVGElement | null,
  shapeGridCells: SVGRectElement[],
) => {
  const TRANSITION_OVERLAY_FADE_AT = 0.78;
  const TRANSITION_COMMIT_AT = 0.98;

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
  if (shapeOverlay) {
    gsap.set(shapeOverlay, { autoAlpha: 0 });
  }
  gsap.set(shapeGridCells, {
    autoAlpha: 1,
    scaleX: (_index: number, target: Element) => getShapeScaleX(target),
    scaleY: (_index: number, target: Element) => getShapeScaleY(target),
    transformOrigin: (_index: number, target: Element) => getShapeTransformOrigin(target),
  });

  const handoffTimeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: track,
      start: 'top 98%',
      end: 'top top',
      scrub: true,
      onLeaveBack: () => {
        if (preResearchPreview) {
          gsap.set(preResearchPreview, { autoAlpha: 1, y: 0, visibility: 'visible' });
        }
        gsap.set(track, { autoAlpha: 0 });
      },
    },
  });

  if (shapeOverlay && shapeGridCells.length > 0) {
    handoffTimeline
      .set(
        shapeOverlay,
        {
          autoAlpha: 1,
          zIndex: 72,
          visibility: 'visible',
        },
        0,
      )
      .fromTo(
        shapeGridCells,
        {
          scaleX: (_index: number, target: Element) => getShapeScaleX(target),
          scaleY: (_index: number, target: Element) => getShapeScaleY(target),
        },
        {
          scaleX: 1,
          scaleY: 1.05,
          duration: (_index: number, target: Element) => getShapeDuration(target, 0.74),
          delay: (_index: number, target: Element) => getShapeDelay(target, 0.22),
          ease: 'power2.out',
        },
        0.04,
      )
      .to(
        shapeOverlay,
        {
          autoAlpha: 0,
          zIndex: 40,
          duration: 0.01,
          ease: 'none',
        },
        TRANSITION_OVERLAY_FADE_AT,
      );
  }

  handoffTimeline.to(
    track,
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.01,
    },
    TRANSITION_COMMIT_AT,
  );

  if (preResearchPreview) {
    handoffTimeline.to(
      preResearchPreview,
      {
        autoAlpha: 0,
        y: -28,
        duration: 0.01,
      },
      TRANSITION_COMMIT_AT,
    );
  }

  gsap.to(panels, {
    y: 0,
    ease: 'none',
    stagger: {
      each: 0.22,
    },
    scrollTrigger: {
      trigger: track,
      start: 'top top+=6%',
      end: '+=220%',
      scrub: true,
      invalidateOnRefresh: true,
    },
  });

  if (preResearchPreview) {
    ScrollTrigger.create({
      trigger: track,
      start: 'top 98%',
      end: 'top top',
      scrub: true,
      onUpdate: ({ progress }) => {
        gsap.set(preResearchPreview, { visibility: progress > TRANSITION_COMMIT_AT ? 'hidden' : 'visible' });
      },
    });
  }
};
