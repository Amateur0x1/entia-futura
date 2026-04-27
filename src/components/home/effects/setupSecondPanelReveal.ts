import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';

interface SetupSecondPanelRevealArgs {
  prefersReducedMotion: boolean;
  splitTextAvailable: boolean;
  secondPanel: Element | null;
  secondPanelLabel: Element | null | undefined;
  secondPanelHeading: Element | null | undefined;
  secondPanelDivider: Element | null | undefined;
  secondPanelBody: Element | null | undefined;
  secondPanelParagraphs: HTMLElement[];
  secondPanelKnowMore?: HTMLElement | null;
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
  secondPanelKnowMore,
  timeline,
  startAt = 0,
}: SetupSecondPanelRevealArgs) => {
  gsap.registerPlugin(TextPlugin);

  if (
    prefersReducedMotion ||
    !(secondPanel instanceof HTMLElement) ||
    !(secondPanelHeading instanceof HTMLElement) ||
    !(secondPanelDivider instanceof HTMLElement) ||
    !(secondPanelBody instanceof HTMLElement)
  ) {
    return;
  }

  // Label and heading are always visible — no fade-in, no typewriter.
  // Only the body paragraphs use typewriter reveal.
  const paragraphTexts = secondPanelParagraphs.map((p) => p.textContent ?? '');

  secondPanelParagraphs.forEach((p) => { p.textContent = ''; });

  // Hide only divider and body until reveal; label and heading stay visible.
  gsap.set(secondPanelBody, { autoAlpha: 0 });
  gsap.set(secondPanelDivider, { autoAlpha: 0, scaleX: 0, transformOrigin: 'left center' });

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

  // Show body container
  tl.to(
    secondPanelBody,
    { autoAlpha: 1, duration: 0.1, ease: 'none' },
    startAt + 0.16,
  );

  // Paragraphs typewriter — staggered one after another
  let paragraphOffset = startAt + 0.2;
  secondPanelParagraphs.forEach((p, i) => {
    const text = paragraphTexts[i] ?? '';
    if (!text) return;
    tl.to(
      p,
      {
        duration: text.length * 0.018,
        text: { value: text, delimiter: '' },
        ease: 'none',
      },
      paragraphOffset,
    );
    paragraphOffset += text.length * 0.018 + 0.12;
  });

  // Know More button — show immediately when panel slides in.
  if (secondPanelKnowMore instanceof HTMLElement) {
    tl.call(
      () => { secondPanelKnowMore.classList.add('is-visible'); },
      [],
      startAt,
    );
  }
};
