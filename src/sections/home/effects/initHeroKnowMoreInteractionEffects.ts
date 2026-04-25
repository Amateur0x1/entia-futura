import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface InitHeroKnowMoreInteractionEffectsOptions {
  knowMoreButton: HTMLElement | null;
  nextPanel: HTMLElement | null;
}

export const initHeroKnowMoreInteractionEffects = ({
  knowMoreButton,
  nextPanel,
}: InitHeroKnowMoreInteractionEffectsOptions) => {
  if (!knowMoreButton || !nextPanel) {
    return null;
  }

  return ScrollTrigger.create({
    trigger: nextPanel,
    start: 'top 92%',
    end: 'bottom top',
    onEnter: () => {
      gsap.to(knowMoreButton, {
        autoAlpha: 0,
        y: 10,
        duration: 0.24,
        ease: 'power2.out',
        pointerEvents: 'none',
      });
    },
    onLeaveBack: () => {
      gsap.to(knowMoreButton, {
        autoAlpha: 1,
        y: 0,
        duration: 0.24,
        ease: 'power2.out',
        pointerEvents: 'auto',
      });
    },
  });
};
