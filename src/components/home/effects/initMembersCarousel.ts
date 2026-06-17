// ---------------------------------------------------------------------------
// Members carousel — Flip-based stacked card deck with synced info panel
//
// Adapted from the GreenSock Flip Cards demo (codepen.io/GreenSock/pen/Yzdzxem).
// Cards are stacked like a deck; as the user scrolls, the top card flips away
// and the remaining cards shift up.  The right-side info panel updates in sync
// to show the bio of the currently-front card.
//
// The members-sticky container is pinned with ScrollTrigger for enough scroll
// distance to cycle through all cards.
// ---------------------------------------------------------------------------

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(ScrollTrigger, Flip);

// ── public entry ───────────────────────────────────────────────────────────

export function initMembersCarousel(membersPanel: HTMLElement) {
  const deck = membersPanel.querySelector<HTMLElement>('[data-members-deck]');
  if (!deck) return;

  const stickyContainer = membersPanel.querySelector<HTMLElement>('.members-sticky');
  if (!stickyContainer) return;

  const cards = gsap.utils.toArray<HTMLElement>('[data-members-flip-card]', deck);
  if (!cards.length) return;

  const infoItems = gsap.utils.toArray<HTMLElement>('[data-members-info-item]', membersPanel);
  // Total number of unique members
  const totalMembers = cards.length;

  // Track which member is currently shown (front card index)
  // Cards are rendered bottom-to-top: index 0 is at the back, last is on top.
  // The "front" card (top of deck) is cards[cards.length - 1].
  // After a flip, the front card leaves and the new front is the next one down.
  let currentMemberIndex = 0;

  // Scroll distance: enough for all card flips
  const scrollPerFlip = 800;
  const scrollDistance = totalMembers * scrollPerFlip;

  // ── Helper: update info panel ──
  function showMemberInfo(index: number) {
    const safeIndex = ((index % totalMembers) + totalMembers) % totalMembers;

    infoItems.forEach((item, i) => {
      if (i === safeIndex) {
        gsap.to(item, {
          autoAlpha: 1,
          y: 0,
          duration: 0.4,
          ease: 'power2.out',
          overwrite: true,
        });
      } else {
        gsap.to(item, {
          autoAlpha: 0,
          y: 16,
          duration: 0.25,
          ease: 'power2.in',
          overwrite: true,
        });
      }
    });
  }

  // ── Helper: perform a single Flip card transition ──
  function flipTopCard() {
    // Get the current top card (last child in DOM)
    const topCard = deck.querySelector<HTMLElement>('[data-members-flip-card]:last-child');
    if (!topCard) return;

    // Capture state before DOM change
    const state = Flip.getState('[data-members-flip-card]', { props: 'opacity' });

    // Move the top card to be hidden (move to start of deck = behind)
    topCard.style.display = 'none';

    // Create a clone and prepend it (so it goes to the back of the stack)
    const clone = topCard.cloneNode(true) as HTMLElement;
    clone.style.display = '';
    deck.insertBefore(clone, deck.firstChild);

    // Remove the old hidden card
    deck.removeChild(topCard);

    // Animate with Flip
    Flip.from(state, {
      targets: '[data-members-flip-card]',
      duration: 0.6,
      ease: 'sine.inOut',
      absolute: true,
      onEnter: (elements) => {
        return gsap.from(elements, {
          duration: 0.35,
          yPercent: 20,
          opacity: 0,
          ease: 'expo.out',
        });
      },
      onLeave: (elements) => {
        return gsap.to(elements, {
          duration: 0.35,
          yPercent: 5,
          xPercent: -8,
          transformOrigin: 'bottom left',
          opacity: 0,
          ease: 'expo.out',
        });
      },
    });

    // Update member index and info
    currentMemberIndex = (currentMemberIndex + 1) % totalMembers;
    showMemberInfo(currentMemberIndex);
  }

  // ── Pinned ScrollTrigger that triggers flips at even intervals ──
  gsap.timeline({
    scrollTrigger: {
      trigger: stickyContainer,
      start: 'top top',
      end: `+=${scrollDistance}`,
      pin: true,
      pinSpacing: true,
      scrub: false,       // NOT scrub — we use onUpdate thresholds
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // Determine which card should be on top based on scroll progress
        const targetIndex = Math.min(
          Math.floor(self.progress * totalMembers),
          totalMembers - 1,
        );

        // Only flip when we cross a threshold going forward
        while (currentMemberIndex < targetIndex) {
          flipTopCard();
        }

        // Handle scrolling back: reset to original state
        if (targetIndex < currentMemberIndex) {
          // Reset the deck to its original order
          resetDeck(targetIndex);
        }
      },
    },
  });

  // ── Reset deck to a specific member index (for scroll-back) ──
  function resetDeck(targetIndex: number) {
    // Re-order cards in DOM to match the target state
    const allCards = gsap.utils.toArray<HTMLElement>('[data-members-flip-card]', deck);

    // Clear and re-insert in correct order for targetIndex
    // The "front" (top/last-child) card should correspond to targetIndex
    const reordered: HTMLElement[] = [];
    for (let i = 0; i < totalMembers; i++) {
      const cardIndex = (targetIndex + totalMembers - i) % totalMembers;
      // Find the card with this member index
      const card = allCards.find(
        c => parseInt(c.getAttribute('data-member-index') || '0', 10) === cardIndex,
      );
      if (card) reordered.push(card);
    }

    // Re-insert: first in array = last child (front of deck)
    // We want reordered[0] to be the front (last child)
    // So insert in reverse order
    reordered.reverse().forEach(card => {
      deck.appendChild(card);
    });

    currentMemberIndex = targetIndex;
    showMemberInfo(currentMemberIndex);
  }

  // Show initial member info
  showMemberInfo(0);
}
