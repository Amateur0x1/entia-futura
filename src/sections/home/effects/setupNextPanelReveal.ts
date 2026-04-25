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
  timeline?: gsap.core.Timeline;
  startAt?: number;
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
  timeline,
  startAt = 0,
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
    gsap.set(nextPanelLabelSplit.words, {
      willChange: 'transform, opacity',
      autoAlpha: 0,
      xPercent: -20,
      yPercent: 24,
    });
  }
  if (nextPanelHeadingSplit) {
    gsap.set(nextPanelHeadingSplit.words, {
      willChange: 'transform, opacity',
      autoAlpha: 0,
      xPercent: -30,
      yPercent: 36,
    });
  }
  if (!nextPanelLabelSplit && nextPanelLabel instanceof HTMLElement) {
    gsap.set(nextPanelLabel, {
      autoAlpha: 0,
      xPercent: -20,
      yPercent: 24,
    });
  }
  if (!nextPanelHeadingSplit) {
    gsap.set(nextPanelHeading, {
      autoAlpha: 0,
      xPercent: -30,
      yPercent: 36,
    });
  }
  gsap.set(nextPanelBodyWords, {
    willChange: 'transform, opacity',
    autoAlpha: 0,
    xPercent: 12,
    yPercent: 54,
  });
  if (nextPanelBodyWords.length === 0 && nextPanelParagraphs.length > 0) {
    gsap.set(nextPanelParagraphs, {
      autoAlpha: 0,
      xPercent: 12,
      yPercent: 54,
    });
  }
  gsap.set(nextPanelBody, {
    autoAlpha: 0,
  });

  const nextPanelTextTimeline =
    timeline ??
    gsap.timeline({
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
        duration: 0.74,
        stagger: 0.02,
        ease: 'power2.out',
      },
      startAt,
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
        duration: 0.82,
        stagger: 0.022,
        ease: 'power2.out',
      },
      startAt + 0.06,
    )
    .to(
      nextPanelDivider,
      {
        autoAlpha: 1,
        x: 0,
        y: 0,
        duration: 0.54,
        ease: 'power2.out',
      },
      startAt + 0.1,
    )
    .to(
      nextPanelDivider,
      {
        scaleX: 1,
        duration: 0.52,
        ease: 'power2.out',
      },
      startAt + 0.1,
    )
    .to(
      nextPanelBody,
      {
        autoAlpha: 1,
        x: 0,
        y: 0,
        duration: 0.12,
        ease: 'none',
      },
      startAt + 0.62,
    );

  if (nextPanelParagraphs.length > 0) {
    nextPanelTextTimeline.fromTo(
      nextPanelBodyWords.length > 0 ? nextPanelBodyWords : nextPanelParagraphs,
      {
        immediateRender: false,
        autoAlpha: 0,
        xPercent: 8,
        yPercent: 30,
      },
      {
        autoAlpha: 1,
        xPercent: 0,
        yPercent: 0,
        duration: 0.82,
        stagger: 0.014,
        ease: 'power2.out',
      },
      startAt + 0.36,
    );
  }
};
