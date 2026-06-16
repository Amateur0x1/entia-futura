import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

interface SetupThirdPanelRevealArgs {
  prefersReducedMotion: boolean;
  thirdPanel: HTMLElement | null;
  timeline: gsap.core.Timeline;
  startAt: number;
}

export const setupThirdPanelReveal = ({
  prefersReducedMotion,
  thirdPanel,
  timeline,
  startAt,
}: SetupThirdPanelRevealArgs) => {
  if (!(thirdPanel instanceof HTMLElement)) return;

  gsap.registerPlugin(SplitText);

  const intro   = thirdPanel.querySelector<HTMLElement>('[data-tp-intro]');
  const divider = thirdPanel.querySelector<HTMLElement>('[data-tp-divider]');
  const cards   = Array.from(thirdPanel.querySelectorAll<HTMLElement>('[data-tp-card]'));

  if (!intro) return;

  if (prefersReducedMotion) {
    gsap.set([intro, divider, ...cards], { autoAlpha: 1, y: 0, scaleX: 1 });
    return;
  }

  // ── Split intro into lines with mask for the slide-up reveal ──
  const split = SplitText.create(intro, {
    type: 'lines',
    linesClass: 'split-line',
    mask: 'lines',
  });
  const introLines = split.lines;

  // ── Initial hidden state ──
  gsap.set(introLines, { yPercent: 100, opacity: 0 });
  gsap.set(intro, { autoAlpha: 1 });
  if (divider) gsap.set(divider, { autoAlpha: 0, scaleX: 0, transformOrigin: 'left center' });
  gsap.set(cards, { autoAlpha: 0, y: 20 });

  // ── Scrub-driven reveal (part of the timeline) ──
  // Divider
  if (divider) {
    timeline.to(
      divider,
      { autoAlpha: 1, scaleX: 1, duration: 0.5, ease: 'power2.out' },
      startAt,
    );
  }

  // Lines slide-up
  timeline.to(
    introLines,
    {
      yPercent: 0,
      opacity: 1,
      duration: 0.6,
      ease: 'expo.out',
      stagger: 0.1,
    },
    startAt + 0.2,
  );

  // Cards reveal after lines
  if (cards.length > 0) {
    const linesEnd = startAt + 0.2 + 0.6 + 0.1 * (introLines.length - 1);
    timeline.to(
      cards,
      { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.1 },
      linesEnd + 0.15,
    );
  }
};
