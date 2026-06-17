// ---------------------------------------------------------------------------
// Directions carousel — scrub-driven card flythrough with category switching
//
// Uses the same seamless-loop animation as the Members carousel
// (initMembersCarousel.ts): cards fly across from right to left, peaking at
// full scale/opacity mid-flight with multiple cards visible simultaneously.
//
// Extended with three category groups — the currently centred card's group
// determines which category label is shown at the top.
// ---------------------------------------------------------------------------

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// ── helpers ────────────────────────────────────────────────────────────────

/**
 * Build a seamless card-loop timeline (identical to Members carousel).
 *
 * Each card flies across (xPercent 400 → -400) and peaks at scale 1 /
 * opacity 1 mid-flight.  Stagger creates overlap so 3-5 cards are visible
 * simultaneously.  The centre card (at peak) is largest; neighbours on each
 * side are progressively smaller and more transparent.
 */
function buildSeamlessLoop(
  items: HTMLElement[],
  spacing: number,
): gsap.core.Timeline {
  const rawSequence = gsap.timeline({ paused: true });

  items.forEach((el, i) => {
    const startPos = i * spacing;

    // Scale/opacity: ramp up 0→1 in first half, ramp down 1→0 in second half
    rawSequence
      .fromTo(
        el,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          zIndex: 100,
          duration: 0.5,
          yoyo: true,
          repeat: 1,
          ease: 'power1.in',
          immediateRender: false,
        },
        startPos,
      )
      .fromTo(
        el,
        { xPercent: 400 },
        {
          xPercent: -400,
          duration: 1,
          ease: 'none',
          immediateRender: false,
        },
        startPos,
      );
  });

  return rawSequence;
}

/**
 * Work out which group index is "active" at a given progress through the
 * card sequence.  Each card reaches centre-stage (peak scale/opacity) at
 * the midpoint of its individual 1-unit animation, i.e. at
 *   peakTime = cardIndex * spacing + 0.5
 *
 * We find the card whose peak is closest to `currentTime` and return its
 * group attribute.
 */
function getActiveGroup(
  cards: HTMLElement[],
  spacing: number,
  currentTime: number,
): number {
  let bestIdx = 0;
  let bestDist = Infinity;
  cards.forEach((card, i) => {
    const peak = i * spacing + 0.5;
    const d = Math.abs(currentTime - peak);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  });
  const groupAttr = cards[bestIdx]?.getAttribute('data-card-group');
  return groupAttr ? parseInt(groupAttr, 10) : 0;
}

// ── public entry ───────────────────────────────────────────────────────────

export function initDirectionsCarousel(panel: HTMLElement) {
  const cards = gsap.utils.toArray<HTMLElement>(
    '[data-directions-card]',
    panel,
  );
  if (!cards.length) return;

  const sticky = panel.querySelector<HTMLElement>('[data-directions-sticky]');
  if (!sticky) return;

  // Category labels & dots
  const categoryEls = gsap.utils.toArray<HTMLElement>(
    '[data-directions-category]',
    panel,
  );
  const dotEls = gsap.utils.toArray<HTMLElement>(
    '[data-directions-dot]',
    panel,
  );

  // ── Initial state (identical to Members) ──
  gsap.set(cards, { xPercent: 400, opacity: 0, scale: 0 });

  // Hide all categories except first
  categoryEls.forEach((el, i) => {
    if (i === 0) {
      gsap.set(el, { autoAlpha: 1, y: 0 });
    } else {
      gsap.set(el, { autoAlpha: 0, y: 12 });
    }
  });

  // Same spacing & scroll distance as Members
  const spacing = 0.1;
  const seamlessLoop = buildSeamlessLoop(cards, spacing);
  const totalDuration = seamlessLoop.duration();
  const scrollDistance = Math.round(cards.length * 350);

  // Track current active group for category switching
  let currentGroup = 0;

  // ── ScrollTrigger ──
  const scrubTl = gsap.timeline({
    scrollTrigger: {
      trigger: sticky,
      start: 'top top',
      end: `+=${scrollDistance}`,
      pin: true,
      pinSpacing: true,
      scrub: 0.4,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // Determine which group is currently centred
        const currentTime = self.progress * totalDuration;
        const newGroup = getActiveGroup(cards, spacing, currentTime);

        if (newGroup !== currentGroup) {
          // Animate category switch
          const outEl = categoryEls[currentGroup];
          const inEl = categoryEls[newGroup];

          if (outEl) {
            gsap.to(outEl, {
              autoAlpha: 0,
              y: -12,
              duration: 0.3,
              ease: 'power2.in',
              overwrite: true,
            });
          }
          if (inEl) {
            gsap.fromTo(
              inEl,
              { autoAlpha: 0, y: 12 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.35,
                ease: 'power2.out',
                overwrite: true,
              },
            );
          }

          // Update dots
          dotEls.forEach((dot, i) => {
            if (i === newGroup) {
              dot.classList.add('directions-progress__dot--active');
            } else {
              dot.classList.remove('directions-progress__dot--active');
            }
          });

          currentGroup = newGroup;
        }
      },
    },
  });

  // Drive the seamless loop with scroll
  scrubTl.to(
    seamlessLoop,
    {
      time: totalDuration,
      duration: 1,
      ease: 'none',
    },
    0,
  );
}
