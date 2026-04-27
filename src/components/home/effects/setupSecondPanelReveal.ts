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

  // Store original text content and clear elements for typewriter reveal.
  // The heading (core question) is kept as-is — it stays visible at all times
  // and fades in together with the panel rather than being typed out.
  const labelText = secondPanelLabel instanceof HTMLElement ? secondPanelLabel.textContent ?? '' : '';
  const paragraphTexts = secondPanelParagraphs.map((p) => p.textContent ?? '');

  if (secondPanelLabel instanceof HTMLElement) {
    secondPanelLabel.textContent = '';
  }
  secondPanelParagraphs.forEach((p) => { p.textContent = ''; });

  // Hide body container until typewriter starts
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

  // Label typewriter
  if (secondPanelLabel instanceof HTMLElement && labelText) {
    tl.to(
      secondPanelLabel,
      {
        duration: labelText.length * 0.028,
        text: { value: labelText, delimiter: '' },
        ease: 'none',
      },
      startAt,
    );
  }

  // Heading: always visible, no typewriter — just a quick fade in.
  tl.fromTo(
    secondPanelHeading,
    { autoAlpha: 0 },
    { autoAlpha: 1, duration: 0.32, ease: 'power2.out' },
    startAt + 0.08,
  );

  // Divider reveal
  tl.to(
    secondPanelDivider,
    { autoAlpha: 1, scaleX: 1, duration: 0.5, ease: 'power2.out' },
    startAt + 0.36,
  );

  // Show body container
  tl.to(
    secondPanelBody,
    { autoAlpha: 1, duration: 0.1, ease: 'none' },
    startAt + 0.52,
  );

  // Paragraphs typewriter — staggered one after another
  let paragraphOffset = startAt + 0.56;
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
};
