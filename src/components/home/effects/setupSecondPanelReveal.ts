import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

interface SetupSecondPanelRevealArgs {
  prefersReducedMotion: boolean;
  splitTextAvailable: boolean;
  secondPanel: Element | null;
  secondPanelLabel: Element | null | undefined;
  secondPanelHeading: Element | null | undefined;
  secondPanelDivider: Element | null | undefined;
  secondPanelBody: Element | null | undefined;
  secondPanelParagraphs: HTMLElement[];
  timeline?: gsap.core.Timeline;
  startAt?: number;
}

export const setupSecondPanelReveal = ({
  prefersReducedMotion,
  splitTextAvailable,
  secondPanel,
  secondPanelLabel,
  secondPanelHeading,
  secondPanelDivider,
  secondPanelBody,
  secondPanelParagraphs,
  timeline,
  startAt = 0,
}: SetupSecondPanelRevealArgs) => {
  if (
    prefersReducedMotion ||
    !(secondPanel instanceof HTMLElement) ||
    !(secondPanelHeading instanceof HTMLElement) ||
    !(secondPanelDivider instanceof HTMLElement) ||
    !(secondPanelBody instanceof HTMLElement)
  ) {
    return;
  }

  const secondPanelLabelSplit =
    splitTextAvailable && secondPanelLabel instanceof HTMLElement ? SplitText.create(secondPanelLabel, { type: 'words' }) : null;
  const secondPanelHeadingSplit = splitTextAvailable ? SplitText.create(secondPanelHeading, { type: 'words' }) : null;
  const secondPanelParagraphSplits =
    splitTextAvailable
      ? secondPanelParagraphs.map((paragraph) =>
          SplitText.create(paragraph, {
            type: 'words',
          }),
        )
      : [];
  const secondPanelBodyWords = secondPanelParagraphSplits.flatMap((split) => split.words);

  if (secondPanelLabelSplit) {
    gsap.set(secondPanelLabelSplit.words, {
      willChange: 'transform, opacity',
      autoAlpha: 0,
      xPercent: -42,
      yPercent: 42,
    });
  }
  if (secondPanelHeadingSplit) {
    gsap.set(secondPanelHeadingSplit.words, {
      willChange: 'transform, opacity',
      autoAlpha: 0,
      xPercent: -56,
      yPercent: 58,
    });
  }
  if (!secondPanelLabelSplit && secondPanelLabel instanceof HTMLElement) {
    gsap.set(secondPanelLabel, {
      autoAlpha: 0,
      xPercent: -42,
      yPercent: 42,
    });
  }
  if (!secondPanelHeadingSplit) {
    gsap.set(secondPanelHeading, {
      autoAlpha: 0,
      xPercent: -56,
      yPercent: 58,
    });
  }
  gsap.set(secondPanelBodyWords, {
    willChange: 'transform, opacity',
    autoAlpha: 0,
    xPercent: 26,
    yPercent: 90,
  });
  if (secondPanelBodyWords.length === 0 && secondPanelParagraphs.length > 0) {
    gsap.set(secondPanelParagraphs, {
      autoAlpha: 0,
      xPercent: 26,
      yPercent: 90,
    });
  }
  gsap.set(secondPanelBody, {
    autoAlpha: 0,
  });

  const secondPanelTextTimeline =
    timeline ??
    gsap.timeline({
      defaults: {
        ease: 'power3.out',
      },
      scrollTrigger: {
        trigger: secondPanel,
        start: 'top 72%',
        once: true,
      },
    });

  secondPanelTextTimeline
    .fromTo(
      secondPanelLabelSplit?.words ?? (secondPanelLabel ?? secondPanelHeading),
      {
        immediateRender: false,
        autoAlpha: 0,
        xPercent: -42,
        yPercent: 42,
      },
      {
        autoAlpha: 1,
        xPercent: 0,
        yPercent: 0,
        duration: 0.82,
        stagger: 0.022,
        ease: 'power2.out',
      },
      startAt,
    )
    .fromTo(
      secondPanelHeadingSplit?.words ?? secondPanelHeading,
      {
        immediateRender: false,
        autoAlpha: 0,
        xPercent: -56,
        yPercent: 58,
      },
      {
        autoAlpha: 1,
        xPercent: 0,
        yPercent: 0,
        duration: 0.92,
        stagger: 0.026,
        ease: 'power2.out',
      },
      startAt + 0.08,
    )
    .to(
      secondPanelDivider,
      {
        autoAlpha: 1,
        x: 0,
        y: 0,
        duration: 0.58,
        ease: 'power2.out',
      },
      startAt + 0.12,
    )
    .to(
      secondPanelDivider,
      {
        scaleX: 1,
        duration: 0.6,
        ease: 'power2.out',
      },
      startAt + 0.12,
    )
    .to(
      secondPanelBody,
      {
        autoAlpha: 1,
        x: 0,
        y: 0,
        duration: 0.14,
        ease: 'none',
      },
      startAt + 0.74,
    );

  if (secondPanelParagraphs.length > 0) {
    secondPanelTextTimeline.fromTo(
      secondPanelBodyWords.length > 0 ? secondPanelBodyWords : secondPanelParagraphs,
      {
        immediateRender: false,
        autoAlpha: 0,
        xPercent: 24,
        yPercent: 66,
      },
      {
        autoAlpha: 1,
        xPercent: 0,
        yPercent: 0,
        duration: 1.34,
        stagger: 0.022,
        ease: 'power2.out',
      },
      startAt + 0.44,
    );
  }
};
