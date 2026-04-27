import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';

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

  gsap.registerPlugin(TextPlugin);

  const intro   = thirdPanel.querySelector<HTMLElement>('[data-tp-intro]');
  const divider = thirdPanel.querySelector<HTMLElement>('[data-tp-divider]');
  const cards   = Array.from(thirdPanel.querySelectorAll<HTMLElement>('[data-tp-card]'));

  if (!intro) return;

  const introText = intro.textContent ?? '';
  const isEn = thirdPanel.classList.contains('landing-third-panel--en');

  if (prefersReducedMotion) {
    gsap.set([intro, divider, ...cards], { autoAlpha: 1, y: 0, scaleX: 1 });
    return;
  }

  // ── Initial hidden state ──
  // Clear text so typewriter can write it back char-by-char (both EN and ZH).
  intro.textContent = '';
  gsap.set(intro, { autoAlpha: 0 });
  if (divider) gsap.set(divider, { autoAlpha: 0, scaleX: 0, transformOrigin: 'left center' });
  gsap.set(cards, { autoAlpha: 0, y: 20 });

  // ── Typewriter for both EN and ZH ──
  // Match second-panel speed: 0.018s per character.
  const charDuration = 0.018;
  const typewriterDuration = introText.length * charDuration;

  // Show container first, then start typing.
  timeline.to(
    intro,
    { autoAlpha: 1, duration: 0.1, ease: 'none' },
    startAt,
  );

  timeline.to(
    intro,
    {
      duration: typewriterDuration,
      text: { value: introText, delimiter: '' },
      ease: 'none',
    },
    startAt + 0.1,
  );

  const afterIntro = startAt + 0.1 + typewriterDuration + 0.2;

  if (divider) {
    timeline.to(
      divider,
      { autoAlpha: 1, scaleX: 1, duration: 0.5, ease: 'power2.out' },
      afterIntro,
    );
  }

  timeline.to(
    cards,
    { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.1 },
    afterIntro + 0.15,
  );
};
