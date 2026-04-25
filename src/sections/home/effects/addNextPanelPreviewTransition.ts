import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

import type { HomeHeroElements } from './getHomeHeroElements';
import {
  getShapeDelay,
  getShapeDuration,
  getShapeScaleX,
  getShapeScaleY,
  getShapeTransformOrigin,
} from './shapeOverlayGrid';

interface AddNextPanelPreviewTransitionOptions {
  elements: HomeHeroElements;
  heroTimeline: gsap.core.Timeline;
  notes: HTMLElement[];
  previewStartAt: number;
  shapeGridCells: SVGRectElement[];
  splitTextAvailable: boolean;
}

export const addNextPanelPreviewTransition = ({
  elements,
  heroTimeline,
  notes,
  previewStartAt,
  shapeGridCells,
  splitTextAvailable,
}: AddNextPanelPreviewTransitionOptions) => {
  const {
    nextPreview,
    nextPreviewBody,
    nextPreviewDivider,
    nextPreviewHeading,
    nextPreviewInner,
    nextPreviewLabel,
    nextPreviewParagraphs,
    shapeOverlay,
  } = elements;

  if (!nextPreview || !nextPreviewInner || !shapeOverlay || shapeGridCells.length === 0) {
    return;
  }

  const previewHeadlineTargets = [nextPreviewHeading, nextPreviewDivider].filter(
    (node): node is HTMLElement => node instanceof HTMLElement,
  );
  const nextPreviewLabelSplit =
    splitTextAvailable && nextPreviewLabel
      ? SplitText.create(nextPreviewLabel, { type: 'words' })
      : null;
  const nextPreviewHeadingSplit =
    splitTextAvailable && nextPreviewHeading
      ? SplitText.create(nextPreviewHeading, { type: 'words' })
      : null;
  const nextPreviewParagraphSplits = splitTextAvailable
    ? nextPreviewParagraphs.map((paragraph) =>
        SplitText.create(paragraph, {
          type: 'words',
        }),
      )
    : [];
  const nextPreviewBodyWords = nextPreviewParagraphSplits.flatMap((split) => split.words);

  if (nextPreviewLabelSplit) {
    gsap.set(nextPreviewLabelSplit.words, { willChange: 'transform, opacity' });
  }

  if (nextPreviewHeadingSplit) {
    gsap.set(nextPreviewHeadingSplit.words, { willChange: 'transform, opacity' });
  }

  if (nextPreviewBodyWords.length > 0) {
    gsap.set(nextPreviewBodyWords, { willChange: 'transform, opacity' });
  }

  const curtainStart = previewStartAt;
  const curtainDuration = 1.12;
  const previewSwapStart = curtainStart + curtainDuration * 0.3;
  const previewRevealStart = curtainStart + curtainDuration * 0.42;

  gsap.set(shapeGridCells, {
    autoAlpha: 1,
    scaleX: (_index: number, target: Element) => getShapeScaleX(target),
    scaleY: (_index: number, target: Element) => getShapeScaleY(target),
    transformOrigin: (_index: number, target: Element) => getShapeTransformOrigin(target),
  });

  heroTimeline
    .set(
      shapeOverlay,
      {
        autoAlpha: 1,
      },
      curtainStart,
    )
    .set(
      nextPreview,
      {
        autoAlpha: 1,
      },
      previewSwapStart,
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
        duration: (_index: number, target: Element) =>
          getShapeDuration(target, curtainDuration * 0.72),
        delay: (_index: number, target: Element) => getShapeDelay(target, curtainDuration * 0.26),
        ease: 'power2.out',
      },
      curtainStart,
    )
    .to(
      shapeOverlay,
      {
        autoAlpha: 0,
        duration: 0.01,
        ease: 'none',
      },
      curtainStart + curtainDuration * 0.82,
    )
    .to(
      notes,
      {
        autoAlpha: 0,
        y: -58,
        duration: 0.34,
        stagger: 0.02,
      },
      curtainStart + 0.1,
    )
    .to(
      nextPreviewInner,
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.54,
        ease: 'power3.out',
      },
      previewRevealStart,
    )
    .fromTo(
      nextPreviewLabelSplit?.words ?? (nextPreviewLabel ?? previewHeadlineTargets),
      {
        immediateRender: false,
        autoAlpha: 0,
        xPercent: -20,
        yPercent: 24,
      },
      {
        autoAlpha: 1,
        xPercent: 0,
        yPercent: 0,
        duration: 0.44,
        stagger: 0.02,
        ease: 'power3.out',
      },
      previewRevealStart + 0.02,
    )
    .fromTo(
      nextPreviewHeadingSplit?.words ?? (nextPreviewHeading ?? previewHeadlineTargets),
      {
        immediateRender: false,
        autoAlpha: 0,
        xPercent: -30,
        yPercent: 36,
      },
      {
        autoAlpha: 1,
        xPercent: 0,
        yPercent: 0,
        duration: 0.5,
        stagger: 0.024,
        ease: 'power3.out',
      },
      previewRevealStart + 0.04,
    )
    .to(
      previewHeadlineTargets,
      {
        autoAlpha: 1,
        x: 0,
        y: 0,
        duration: 0.44,
        ease: 'power3.out',
      },
      previewRevealStart + 0.09,
    );

  if (nextPreviewDivider) {
    heroTimeline.fromTo(
      nextPreviewDivider,
      {
        scaleX: 0,
        transformOrigin: 'left center',
      },
      {
        scaleX: 1,
        duration: 0.48,
        ease: 'power2.out',
      },
      previewRevealStart + 0.12,
    );
  }

  if (nextPreviewParagraphs.length > 0) {
    heroTimeline.fromTo(
      nextPreviewBodyWords.length > 0 ? nextPreviewBodyWords : nextPreviewParagraphs,
      {
        immediateRender: false,
        autoAlpha: 0,
        xPercent: 12,
        yPercent: 54,
      },
      {
        autoAlpha: 1,
        xPercent: 0,
        yPercent: 0,
        duration: 0.44,
        stagger: 0.01,
        ease: 'power3.out',
      },
      previewRevealStart + 0.42,
    );
  }

  if (nextPreviewBody) {
    heroTimeline.to(
      nextPreviewBody,
      {
        autoAlpha: 1,
        x: 0,
        y: 0,
        duration: 0.01,
      },
      previewRevealStart + 0.96,
    );
  }
};
