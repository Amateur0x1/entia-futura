import gsap from 'gsap';

export const revealSection = (section: Element, index: number) => {
  const element = section;
  const heading = element.querySelector('.section-heading');
  const eyebrow = element.querySelector('.eyebrow');
  const title = element.querySelector('.section-heading h2, .section-heading h1');
  const subcopy = element.querySelector('.section-heading p:last-of-type');
  const cards = element.querySelectorAll('.field-card, .interface-card, .question-fragment');
  const buttons = element.querySelectorAll('.button');

  gsap.fromTo(
    element,
    {
      autoAlpha: 0,
    },
    {
      autoAlpha: 1,
      duration: 0.35,
      ease: 'none',
      delay: index === 0 ? 0.1 : 0,
      scrollTrigger: {
        trigger: element,
        start: 'top 88%',
        once: true,
      },
    },
  );

  if (heading) {
    gsap.fromTo(
      heading,
      {
        y: 72,
        clipPath: 'inset(0 0 100% 0)',
      },
      {
        y: 0,
        clipPath: 'inset(0 0 0% 0)',
        duration: 1.15,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 76%',
          once: true,
        },
      },
    );
  }

  if (eyebrow) {
    gsap.fromTo(
      eyebrow,
      {
        x: -24,
        autoAlpha: 0,
      },
      {
        x: 0,
        autoAlpha: 1,
        duration: 0.78,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 78%',
          once: true,
        },
      },
    );
  }

  if (title) {
    gsap.fromTo(
      title,
      {
        y: 44,
        autoAlpha: 0,
      },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.95,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 74%',
          once: true,
        },
      },
    );
  }

  if (subcopy) {
    gsap.fromTo(
      subcopy,
      {
        y: 28,
        autoAlpha: 0,
      },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.82,
        delay: 0.04,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 72%',
          once: true,
        },
      },
    );
  }

  if (cards.length > 0) {
    gsap.fromTo(
      cards,
      {
        autoAlpha: 0,
        y: 64,
      },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.95,
        stagger: 0.1,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 68%',
          once: true,
        },
      },
    );
  }

  if (buttons.length > 0) {
    gsap.fromTo(
      buttons,
      {
        autoAlpha: 0,
        y: 18,
      },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.75,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 66%',
          once: true,
        },
      },
    );
  }
};
