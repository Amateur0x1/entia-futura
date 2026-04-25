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
  const TRANSITION_SWAP_START = 0.3;
  const TRANSITION_SWAP_END = 0.82;
  const TRANSITION_COMMIT_AT = 0.98;

  const track = document.querySelector<HTMLElement>('[data-research-track]');
  const rail = track?.querySelector<HTMLElement>('[data-research-rail]');
  const panels = rail ? Array.from(rail.querySelectorAll<HTMLElement>('[data-research-panel]')) : [];
  const nextPreview = document.querySelector<HTMLElement>('[data-next-preview]');
  const researchPreview = document.querySelector<HTMLElement>('[data-research-preview]');
  const researchPreviewInner = researchPreview?.querySelector<HTMLElement>('[data-research-preview-inner]') ?? null;
  const researchPreviewPanels = researchPreview
    ? Array.from(researchPreview.querySelectorAll<HTMLElement>('.landing-research-panel'))
    : [];

  if (!track || !rail || panels.length === 0) {
    return;
  }

  if (prefersReducedMotion) {
    gsap.set([track, ...panels], { clearProps: 'all' });
    return;
  }

  gsap.set(track, { autoAlpha: 0 });
  gsap.set(panels, { y: 36 });
  gsap.set(researchPreviewPanels, { y: 36 });
  if (researchPreview) {
    gsap.set(researchPreview, { autoAlpha: 0 });
  }
  if (researchPreviewInner) {
    gsap.set(researchPreviewInner, { autoAlpha: 0, y: 42 });
  }
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
        if (!nextPreview) return;
        gsap.set(nextPreview, { autoAlpha: 1, y: 0, visibility: 'visible' });
        if (researchPreview) {
          gsap.set(researchPreview, { autoAlpha: 0, visibility: 'hidden' });
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
        0.78,
      );
  }

  if (nextPreview) {
    handoffTimeline.to(
      nextPreview,
      {
        autoAlpha: 0,
        y: -28,
        duration: TRANSITION_SWAP_END - TRANSITION_SWAP_START,
      },
      TRANSITION_SWAP_START,
    );
  }

  if (researchPreview) {
    handoffTimeline.set(
      researchPreview,
      {
        autoAlpha: 1,
        visibility: 'visible',
      },
      TRANSITION_SWAP_START,
    );
  }

  if (researchPreviewInner) {
    handoffTimeline.to(
      researchPreviewInner,
      {
        autoAlpha: 1,
        y: 0,
        duration: TRANSITION_SWAP_END - TRANSITION_SWAP_START,
        ease: 'power3.out',
      },
      TRANSITION_SWAP_START,
    );
  }
  if (researchPreviewPanels.length > 0) {
    handoffTimeline.to(
      researchPreviewPanels,
      {
        y: 0,
        duration: TRANSITION_SWAP_END - TRANSITION_SWAP_START,
        ease: 'none',
      },
      TRANSITION_SWAP_START,
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

  if (researchPreview) {
    handoffTimeline.to(
      researchPreview,
      {
        autoAlpha: 0,
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

  ScrollTrigger.create({
    trigger: track,
    start: 'top 98%',
    end: 'top top',
    scrub: true,
    onUpdate: ({ progress }) => {
      if (!nextPreview) return;
      gsap.set(nextPreview, { visibility: progress > TRANSITION_COMMIT_AT ? 'hidden' : 'visible' });
    },
  });
};
