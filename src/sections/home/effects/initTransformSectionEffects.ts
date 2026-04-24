import gsap from 'gsap';

export const initTransformSectionEffects = () => {
  const transformSection = document.querySelector('[data-transform-section]');
  const transformPin = transformSection?.querySelector('[data-transform-pin]');
  const transformViewport = transformSection?.querySelector('[data-transform-viewport]');
  const transformTrack = transformSection?.querySelector('[data-transform-track]');
  const transformPanels = transformSection?.querySelectorAll('[data-transform-panel]');
  const axisLine = transformSection?.querySelector('.transform-axis-line');
  const axisNodes = transformSection?.querySelectorAll('.transform-axis-node');

  if (
    !(transformSection instanceof HTMLElement) ||
    !(transformPin instanceof HTMLElement) ||
    !(transformViewport instanceof HTMLElement) ||
    !(transformTrack instanceof HTMLElement)
  ) {
    return;
  }

  const panels = transformPanels ? Array.from(transformPanels).filter((panel): panel is HTMLElement => panel instanceof HTMLElement) : [];
  const tokensByPanel = panels.map((panel) => Array.from(panel.querySelectorAll<HTMLElement>('.transform-token')));
  const nodes = axisNodes ? Array.from(axisNodes).filter((node): node is HTMLElement => node instanceof HTMLElement) : [];
  const transformationHeader = transformSection.querySelector('.transformation-header');

  if (transformationHeader) {
    gsap.fromTo(
      transformationHeader,
      {
        autoAlpha: 0,
        y: 34,
      },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.88,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: transformSection,
          start: 'top 72%',
          once: true,
        },
      },
    );
  }

  const media = gsap.matchMedia();

  media.add('(min-width: 721px)', () => {
    const totalShift = Math.max(transformTrack.scrollWidth - transformViewport.clientWidth, 0);

    if (totalShift <= 0) {
      return () => {};
    }

    if (axisLine instanceof HTMLElement) {
      gsap.set(axisLine, {
        scaleX: 0,
        transformOrigin: 'left center',
      });
    }

    gsap.set(nodes, {
      scale: 0.76,
      autoAlpha: 0.56,
    });

    tokensByPanel.forEach((tokens, index) => {
      gsap.set(tokens, {
        autoAlpha: index === 0 ? 1 : 0.36,
        y: index === 0 ? 0 : 24,
      });
    });

    const transformTimeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: transformSection,
        start: 'top top',
        end: `+=${totalShift + window.innerWidth * 1.2}`,
        scrub: 1,
        pin: transformPin,
        anticipatePin: 1,
      },
    });

    transformTimeline.to(
      transformTrack,
      {
        x: -totalShift,
        duration: 1,
      },
      0,
    );

    if (axisLine instanceof HTMLElement) {
      transformTimeline.to(
        axisLine,
        {
          scaleX: 1,
          duration: 1,
        },
        0,
      );
    }

    nodes.forEach((node, index) => {
      transformTimeline.to(
        node,
        {
          scale: 1.18,
          autoAlpha: 1,
          duration: 0.1,
        },
        index * 0.33,
      );
    });

    tokensByPanel.forEach((tokens, index) => {
      const start = index * 0.33;
      transformTimeline
        .to(
          tokens,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.14,
            stagger: 0.03,
          },
          start,
        )
        .to(
          tokens,
          {
            autoAlpha: index === tokensByPanel.length - 1 ? 1 : 0.42,
            y: index === tokensByPanel.length - 1 ? 0 : -12,
            duration: 0.14,
            stagger: 0.02,
          },
          Math.min(start + 0.22, 0.88),
        );
    });

    panels.forEach((panel, index) => {
      transformTimeline.fromTo(
        panel,
        {
          y: 26,
        },
        {
          y: 0,
          duration: 0.18,
        },
        index * 0.28,
      );
    });

    return () => {
      transformTimeline.kill();
    };
  });
};
