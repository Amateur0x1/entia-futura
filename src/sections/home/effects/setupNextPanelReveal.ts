import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

interface SetupNextPanelRevealArgs {
  prefersReducedMotion: boolean;
  splitTextAvailable: boolean;
  nextPanel: Element | null;
  nextPanelLabel: Element | null | undefined;
  nextPanelHeading: Element | null | undefined;
  nextPanelDivider: Element | null | undefined;
  nextPanelBody: Element | null | undefined;
  nextPanelParagraphs: HTMLElement[];
}

export const setupNextPanelReveal = ({
  prefersReducedMotion,
  splitTextAvailable,
  nextPanel,
  nextPanelLabel,
  nextPanelHeading,
  nextPanelDivider,
  nextPanelBody,
  nextPanelParagraphs,
}: SetupNextPanelRevealArgs) => {
  if (
    prefersReducedMotion ||
    !(nextPanel instanceof HTMLElement) ||
    !(nextPanelHeading instanceof HTMLElement) ||
    !(nextPanelDivider instanceof HTMLElement) ||
    !(nextPanelBody instanceof HTMLElement)
  ) {
    return;
  }

  const nextPanelLabelSplit =
    splitTextAvailable && nextPanelLabel instanceof HTMLElement ? SplitText.create(nextPanelLabel, { type: 'words' }) : null;
  const nextPanelHeadingSplit = splitTextAvailable ? SplitText.create(nextPanelHeading, { type: 'words' }) : null;
  const nextPanelParagraphSplits =
    splitTextAvailable
      ? nextPanelParagraphs.map((paragraph) =>
          SplitText.create(paragraph, {
            type: 'words',
          }),
        )
      : [];
  const nextPanelBodyWords = nextPanelParagraphSplits.flatMap((split) => split.words);

  if (nextPanelLabelSplit) {
    gsap.set(nextPanelLabelSplit.words, { willChange: 'transform, opacity' });
  }
  if (nextPanelHeadingSplit) {
    gsap.set(nextPanelHeadingSplit.words, { willChange: 'transform, opacity' });
  }
  gsap.set(nextPanelBodyWords, { willChange: 'transform, opacity' });

  const nextPanelTextTimeline = gsap.timeline({
    defaults: {
      ease: 'power3.out',
    },
    scrollTrigger: {
      trigger: nextPanel,
      start: 'top 72%',
      once: true,
    },
  });

  nextPanelTextTimeline
    .fromTo(
      nextPanelLabelSplit?.words ?? (nextPanelLabel ?? nextPanelHeading),
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
      },
      0,
    )
    .fromTo(
      nextPanelHeadingSplit?.words ?? nextPanelHeading,
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
      },
      0,
    )
    .to(
      nextPanelDivider,
      {
        autoAlpha: 1,
        x: 0,
        y: 0,
        duration: 0.5,
      },
      0.08,
    )
    .to(
      nextPanelDivider,
      {
        scaleX: 1,
        duration: 0.44,
        ease: 'power2.out',
      },
      0.08,
    )
    .to(
      nextPanelBody,
      {
        autoAlpha: 1,
        x: 0,
        y: 0,
        duration: 0.01,
      },
      0.95,
    );

  if (nextPanelParagraphs.length > 0) {
    nextPanelTextTimeline.fromTo(
      nextPanelBodyWords.length > 0 ? nextPanelBodyWords : nextPanelParagraphs,
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
      0.42,
    );
  }
};
