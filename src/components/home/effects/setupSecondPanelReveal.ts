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
  secondPanelCards?: HTMLElement[];
  timeline?: gsap.core.Timeline;
  startAt?: number;
}

export const setupSecondPanelReveal = ({
  prefersReducedMotion,
  secondPanel,
  secondPanelLabel,
  secondPanelHeading,
  secondPanelDivider,
  secondPanelBody,
  secondPanelParagraphs,
  secondPanelCards = [],
  timeline,
  startAt = 0,
}: SetupSecondPanelRevealArgs) => {
  gsap.registerPlugin(SplitText);

  if (
    prefersReducedMotion ||
    !(secondPanel instanceof HTMLElement) ||
    !(secondPanelHeading instanceof HTMLElement) ||
    !(secondPanelDivider instanceof HTMLElement) ||
    !(secondPanelBody instanceof HTMLElement)
  ) {
    return;
  }

  // Hide only divider and body until reveal; label and heading stay visible.
  gsap.set(secondPanelBody, { autoAlpha: 1 });
  gsap.set(secondPanelDivider, { autoAlpha: 0, scaleX: 0, transformOrigin: 'left center' });

  // Split each paragraph into lines with mask for the slide-up reveal.
  const allSplitLines: Element[] = [];
  secondPanelParagraphs.forEach((p) => {
    const split = SplitText.create(p, {
      type: 'lines',
      linesClass: 'split-line',
      mask: 'lines',
    });
    allSplitLines.push(...split.lines);
  });

  // Set initial state: lines hidden below their mask.
  gsap.set(allSplitLines, { yPercent: 100, opacity: 0 });

  // Cards start hidden + slightly below; revealed one-by-one AFTER the body text.
  if (secondPanelCards.length > 0) {
    gsap.set(secondPanelCards, { autoAlpha: 0, y: 28 });
  }

  const tl =
    timeline ??
    gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: secondPanel,
        start: 'top 72%',
        once: true,
      },
    });

  // Divider reveal
  tl.to(
    secondPanelDivider,
    { autoAlpha: 1, scaleX: 1, duration: 0.5, ease: 'power2.out' },
    startAt,
  );

  // Lines slide-up reveal (scrub-driven, part of the timeline)
  tl.to(
    allSplitLines,
    {
      yPercent: 0,
      opacity: 1,
      duration: 0.6,
      ease: 'expo.out',
      stagger: 0.1,
    },
    startAt + 0.2,
  );

  // Cards reveal — after lines finish
  const linesEnd = startAt + 0.2 + 0.6 + 0.1 * (allSplitLines.length - 1);
  if (secondPanelCards.length > 0) {
    tl.to(
      secondPanelCards,
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.5,
        ease: 'power3.out',
        stagger: { each: 0.12, from: 'start' },
      },
      linesEnd + 0.18,
    );
  }

};
