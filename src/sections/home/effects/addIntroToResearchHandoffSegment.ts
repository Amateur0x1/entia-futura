import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import {
  getShapeDelay,
  getShapeDuration,
  getShapeScaleX,
  getShapeScaleY,
  getShapeTransformOrigin,
} from './shapeOverlayGrid';

interface AddIntroToResearchHandoffSegmentOptions {
  track: HTMLElement;
  preResearchPreview: HTMLElement | null;
  shapeOverlay: SVGSVGElement | null;
  shapeGridCells: SVGRectElement[];
}

export const addIntroToResearchHandoffSegment = ({
  track,
  preResearchPreview,
  shapeOverlay,
  shapeGridCells,
}: AddIntroToResearchHandoffSegmentOptions) => {
  const TRANSITION_OVERLAY_FADE_AT = 0.78;
  const TRANSITION_COMMIT_AT = 0.98;

  if (shapeOverlay) {
    gsap.set(shapeOverlay, { autoAlpha: 0 });
  }
  gsap.set(shapeGridCells, {
    autoAlpha: 1,
    scaleX: (_index: number, target: Element) => getShapeScaleX(target),
    scaleY: (_index: number, target: Element) => getShapeScaleY(target),
    transformOrigin: (_index: number, target: Element) => getShapeTransformOrigin(target),
  });

  const introToResearchTimeline = gsap.timeline({
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
    introToResearchTimeline
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

  introToResearchTimeline.to(
    track,
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.01,
    },
    TRANSITION_COMMIT_AT,
  );

  if (preResearchPreview) {
    introToResearchTimeline.to(
      preResearchPreview,
      {
        autoAlpha: 0,
        y: -28,
        duration: 0.01,
      },
      TRANSITION_COMMIT_AT,
    );

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
