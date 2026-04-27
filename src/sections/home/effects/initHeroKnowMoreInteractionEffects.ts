import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface InitHeroKnowMoreInteractionEffectsOptions {
  knowMoreButton: HTMLElement | null;
  secondPanel: HTMLElement | null;
  heroTransitionRoot: HTMLElement | null;
}

export const initHeroKnowMoreInteractionEffects = ({
  knowMoreButton,
  secondPanel,
  heroTransitionRoot,
}: InitHeroKnowMoreInteractionEffectsOptions) => {
  if (!knowMoreButton || !secondPanel || !heroTransitionRoot) {
    return null;
  }

  gsap.set(knowMoreButton, {
    autoAlpha: 1,
    y: 0,
    pointerEvents: 'auto',
  });

  return ScrollTrigger.create({
    trigger: heroTransitionRoot,
    start: 'top top',
    end: 'bottom top',
    scrub: true,
    onUpdate: ({ progress }) => {
      const shouldHide = progress >= 0.62;
      gsap.to(knowMoreButton, {
        autoAlpha: shouldHide ? 0 : 1,
        y: shouldHide ? 10 : 0,
        duration: 0.24,
        ease: 'power2.out',
        pointerEvents: shouldHide ? 'none' : 'auto',
        overwrite: 'auto',
      });
    },
  });
};
