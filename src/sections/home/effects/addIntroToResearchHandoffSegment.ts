import gsap from 'gsap';

import {
  getShapeDelay,
  getShapeDuration,
  getShapeScaleX,
  getShapeScaleY,
  getShapeTransformOrigin,
} from './shapeOverlayGrid';

interface AddIntroToResearchHandoffSegmentOptions {
  introToResearchTimeline: gsap.core.Timeline;
  track: HTMLElement;
  nextPanel: HTMLElement;
  shapeOverlay: SVGSVGElement | null;
  shapeGridCells: SVGRectElement[];
  overlayFadeAt: number;
  commitAt: number;
}

export const addIntroToResearchHandoffSegment = ({
  introToResearchTimeline,
  track,
  nextPanel,
  shapeOverlay,
  shapeGridCells,
  overlayFadeAt,
  commitAt,
}: AddIntroToResearchHandoffSegmentOptions) => {
  if (shapeOverlay) {
    gsap.set(shapeOverlay, { autoAlpha: 0 });
  }
  gsap.set(shapeGridCells, {
    autoAlpha: 1,
    scaleX: (_index: number, target: Element) => getShapeScaleX(target),
    scaleY: (_index: number, target: Element) => getShapeScaleY(target),
    transformOrigin: (_index: number, target: Element) => getShapeTransformOrigin(target),
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
        overlayFadeAt,
      );
  }

  introToResearchTimeline.to(
    track,
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.01,
    },
    commitAt,
  );

  introToResearchTimeline
    .set(
      nextPanel,
      {
        visibility: 'visible',
      },
      0,
    )
    .set(
      nextPanel,
      {
        autoAlpha: 0,
        y: -28,
        visibility: 'hidden',
      },
      commitAt,
    );
};
