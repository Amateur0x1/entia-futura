import gsap from 'gsap';

export const initLandingHeroInteractions = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sheenButtons = Array.from(document.querySelectorAll('.floating-sheen-button')).filter(
    (button) => button instanceof HTMLElement,
  );

  const resetSheen = (button: HTMLElement) => {
    button.classList.remove('is-sheen-entering', 'is-sheen-leaving');
  };

  const restartSheen = (button: HTMLElement, className: string) => {
    resetSheen(button);
    void button.offsetWidth;
    button.classList.add(className);
  };

  sheenButtons.forEach((button) => {
    button.addEventListener('animationend', (event) => {
      if (!(event.target instanceof HTMLElement)) {
        return;
      }

      if (event.animationName === 'floating-nameplate-sheen-enter') {
        button.classList.remove('is-sheen-entering');
      }

      if (event.animationName === 'floating-nameplate-sheen-leave') {
        button.classList.remove('is-sheen-leaving');
      }
    });
  });

  const getAnimatedTextNodes = (button: Element) =>
    Array.from(button.querySelectorAll('[data-brand-animated-text]')).filter((node) => node instanceof HTMLElement);

  if (!prefersReducedMotion) {
    const brandCluster = document.querySelector('[data-brand-cluster]');
    const logoButton =
      brandCluster instanceof HTMLElement
        ? brandCluster.querySelector('[data-brand-logo-button]')
        : null;
    const moreButton =
      brandCluster instanceof HTMLElement
        ? brandCluster.querySelector('[data-brand-more-button]')
        : null;
    const moreFill =
      moreButton instanceof HTMLElement
        ? moreButton.querySelector('[data-more-fill]')
        : null;
    const contactButton = document.querySelector('[data-brand-contact-button]');
    const contactFill =
      contactButton instanceof HTMLElement
        ? contactButton.querySelector('[data-contact-fill]')
        : null;
    const logoTextNodes = logoButton instanceof HTMLElement ? getAnimatedTextNodes(logoButton) : [];
    const standaloneButtons = sheenButtons.filter((button) => !button.hasAttribute('data-brand-cluster-button'));

    const playTextRotate = (elements: HTMLElement[], delay = 0) => {
      if (elements.length === 0) {
        return;
      }

      gsap.killTweensOf(elements);
      gsap.set(elements, {
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        yPercent: 0,
        textShadow: '0 0 0 rgba(185, 202, 208, 0)',
      });

      gsap
        .timeline({ delay })
        .to(elements, {
          rotationX: -72,
          rotationY: 10,
          rotationZ: -4,
          yPercent: -18,
          textShadow: '0 6px 18px rgba(185, 202, 208, 0.22)',
          duration: 0.18,
          ease: 'power2.in',
          stagger: 0.06,
        })
        .to(elements, {
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0,
          yPercent: 0,
          textShadow: '0 0 0 rgba(185, 202, 208, 0)',
          duration: 0.58,
          ease: 'back.out(1.7)',
          stagger: 0.06,
        });
    };

    const triggerLogoTextMotion = () => {
      playTextRotate(logoTextNodes);
    };

    const getMoreFillMetrics = (button: HTMLElement, originX: number, originY: number) => {
      const { width, height } = button.getBoundingClientRect();
      const maxX = Math.max(originX, width - originX);
      const maxY = Math.max(originY, height - originY);
      const radius = Math.hypot(maxX, maxY);

      return {
        diameter: radius * 2,
        x: originX - radius,
        y: originY - radius,
      };
    };
    const moreFillStartScale = 0.016;

    const setMoreFilled = (filled: boolean) => {
      if (moreButton instanceof HTMLElement) {
        moreButton.classList.toggle('is-more-filled', filled);
      }
    };

    const expandMoreFill = (originX: number, originY: number) => {
      if (!(moreButton instanceof HTMLElement) || !(moreFill instanceof HTMLElement)) {
        return;
      }

      const { diameter, x, y } = getMoreFillMetrics(moreButton, originX, originY);

      gsap.killTweensOf(moreFill);
      gsap.set(moreFill, {
        width: diameter,
        height: diameter,
        x,
        y,
        scale: moreFillStartScale,
        opacity: 1,
      });
      setMoreFilled(true);

      gsap.to(moreFill, {
        scale: 1,
        duration: 0.6,
        ease: 'power2.out',
      });
    };

    const collapseMoreFill = () => {
      if (!(moreButton instanceof HTMLElement) || !(moreFill instanceof HTMLElement)) {
        return;
      }

      gsap.killTweensOf(moreFill);
      gsap.to(moreFill, {
        scale: moreFillStartScale,
        opacity: 0,
        duration: 0.28,
        ease: 'power2.in',
        onComplete: () => {
          setMoreFilled(false);
        },
      });
    };

    const setContactFilled = (filled: boolean) => {
      if (contactButton instanceof HTMLElement) {
        contactButton.classList.toggle('is-more-filled', filled);
      }
    };

    const expandContactFill = (originX: number, originY: number) => {
      if (!(contactButton instanceof HTMLElement) || !(contactFill instanceof HTMLElement)) {
        return;
      }

      const { diameter, x, y } = getMoreFillMetrics(contactButton, originX, originY);

      gsap.killTweensOf(contactFill);
      gsap.set(contactFill, {
        width: diameter,
        height: diameter,
        x,
        y,
        scale: moreFillStartScale,
        opacity: 1,
      });
      setContactFilled(true);

      gsap.to(contactFill, {
        scale: 1,
        duration: 0.6,
        ease: 'power2.out',
      });
    };

    const collapseContactFill = () => {
      if (!(contactButton instanceof HTMLElement) || !(contactFill instanceof HTMLElement)) {
        return;
      }

      gsap.killTweensOf(contactFill);
      gsap.to(contactFill, {
        scale: moreFillStartScale,
        opacity: 0,
        duration: 0.28,
        ease: 'power2.in',
        onComplete: () => {
          setContactFilled(false);
        },
      });
    };

    standaloneButtons.forEach((button) => {
      button.addEventListener('pointerenter', () => {
        restartSheen(button, 'is-sheen-entering');
      });

      button.addEventListener('pointerleave', () => {
        restartSheen(button, 'is-sheen-leaving');
      });

      button.addEventListener('focus', () => {
        restartSheen(button, 'is-sheen-entering');
      });

      button.addEventListener('blur', () => {
        restartSheen(button, 'is-sheen-leaving');
      });
    });

    if (brandCluster instanceof HTMLElement) {
      const setClusterActive = (active: boolean) => {
        brandCluster.classList.toggle('is-cluster-active', active);
      };

      brandCluster.addEventListener('pointerenter', () => {
        setClusterActive(true);
      });

      brandCluster.addEventListener('pointerleave', () => {
        setClusterActive(false);
      });

      brandCluster.addEventListener('focusin', () => {
        if (!brandCluster.classList.contains('is-cluster-active')) {
          setClusterActive(true);
        }
      });

      brandCluster.addEventListener('focusout', (event) => {
        const nextTarget = event.relatedTarget;

        if (nextTarget instanceof Node && brandCluster.contains(nextTarget)) {
          return;
        }

        setClusterActive(false);
      });
    }

    if (logoButton instanceof HTMLElement) {
      logoButton.addEventListener('pointerenter', triggerLogoTextMotion);
      logoButton.addEventListener('focus', triggerLogoTextMotion);
    }

    if (moreButton instanceof HTMLElement) {
      moreButton.addEventListener('pointerenter', (event) => {
        const rect = moreButton.getBoundingClientRect();
        expandMoreFill(event.clientX - rect.left, event.clientY - rect.top);
      });

      moreButton.addEventListener('pointerleave', () => {
        collapseMoreFill();
      });

      moreButton.addEventListener('focus', () => {
        const rect = moreButton.getBoundingClientRect();
        expandMoreFill(rect.width / 2, rect.height / 2);
      });

      moreButton.addEventListener('blur', () => {
        collapseMoreFill();
      });
    }

    if (contactButton instanceof HTMLElement) {
      contactButton.addEventListener('pointerenter', (event) => {
        const rect = contactButton.getBoundingClientRect();
        expandContactFill(event.clientX - rect.left, event.clientY - rect.top);
      });

      contactButton.addEventListener('pointerleave', () => {
        collapseContactFill();
      });

      contactButton.addEventListener('focus', () => {
        const rect = contactButton.getBoundingClientRect();
        expandContactFill(rect.width / 2, rect.height / 2);
      });

      contactButton.addEventListener('blur', () => {
        collapseContactFill();
      });
    }

    const localeDropdownRoot = document.querySelector('[data-locale-dropdown]');
    const localeTrigger =
      localeDropdownRoot instanceof HTMLElement ? localeDropdownRoot.querySelector('[data-locale-trigger]') : null;
    const localeFill =
      localeTrigger instanceof HTMLElement ? localeTrigger.querySelector('[data-locale-fill]') : null;

    const setLocaleFilled = (filled: boolean) => {
      if (localeTrigger instanceof HTMLElement) {
        localeTrigger.classList.toggle('is-more-filled', filled);
      }
    };

    const expandLocaleFill = (originX: number, originY: number) => {
      if (!(localeTrigger instanceof HTMLElement) || !(localeFill instanceof HTMLElement)) {
        return;
      }

      const { diameter, x, y } = getMoreFillMetrics(localeTrigger, originX, originY);

      gsap.killTweensOf(localeFill);
      gsap.set(localeFill, {
        width: diameter,
        height: diameter,
        x,
        y,
        scale: moreFillStartScale,
        opacity: 1,
      });
      setLocaleFilled(true);

      gsap.to(localeFill, {
        scale: 1,
        duration: 0.6,
        ease: 'power2.out',
      });
    };

    const collapseLocaleFill = () => {
      if (!(localeTrigger instanceof HTMLElement) || !(localeFill instanceof HTMLElement)) {
        return;
      }

      gsap.killTweensOf(localeFill);
      gsap.to(localeFill, {
        scale: moreFillStartScale,
        opacity: 0,
        duration: 0.28,
        ease: 'power2.in',
        onComplete: () => {
          setLocaleFilled(false);
        },
      });
    };

    if (
      localeDropdownRoot instanceof HTMLElement &&
      localeTrigger instanceof HTMLElement &&
      localeFill instanceof HTMLElement
    ) {
      const originForPointerEnter = (event: PointerEvent) => {
        const rect = localeTrigger.getBoundingClientRect();
        const inTrigger =
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom;

        if (inTrigger) {
          return {
            x: Math.min(Math.max(event.clientX - rect.left, 0), rect.width),
            y: Math.min(Math.max(event.clientY - rect.top, 0), rect.height),
          };
        }

        return { x: rect.width / 2, y: rect.height / 2 };
      };

      localeDropdownRoot.addEventListener('pointerenter', (event) => {
        const o = originForPointerEnter(event as PointerEvent);
        expandLocaleFill(o.x, o.y);
      });

      localeDropdownRoot.addEventListener('pointerleave', () => {
        collapseLocaleFill();
      });

      localeTrigger.addEventListener('focus', () => {
        const rect = localeTrigger.getBoundingClientRect();
        expandLocaleFill(rect.width / 2, rect.height / 2);
      });

      localeTrigger.addEventListener('blur', (event) => {
        const nextTarget = event.relatedTarget;

        if (nextTarget instanceof Node && localeDropdownRoot.contains(nextTarget)) {
          return;
        }

        collapseLocaleFill();
      });
    }

  }

  const localeDropdownRoot = document.querySelector('[data-locale-dropdown]');
  const localeTrigger =
    localeDropdownRoot instanceof HTMLElement ? localeDropdownRoot.querySelector('[data-locale-trigger]') : null;

  if (localeDropdownRoot instanceof HTMLElement && localeTrigger instanceof HTMLElement) {
    const setLocaleExpanded = (open: boolean) => {
      localeTrigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    const finePointerHover = window.matchMedia('(hover: hover) and (pointer: fine)');

    localeDropdownRoot.addEventListener('pointerenter', () => {
      setLocaleExpanded(true);
    });

    localeDropdownRoot.addEventListener('pointerleave', () => {
      if (!localeDropdownRoot.classList.contains('is-locale-open')) {
        setLocaleExpanded(false);
      }
    });

    localeTrigger.addEventListener('click', (event) => {
      if (finePointerHover.matches) {
        return;
      }

      event.preventDefault();
      localeDropdownRoot.classList.toggle('is-locale-open');
      setLocaleExpanded(localeDropdownRoot.classList.contains('is-locale-open'));
    });

    document.addEventListener('click', (event) => {
      if (!localeDropdownRoot.classList.contains('is-locale-open')) {
        return;
      }

      const target = event.target;

      if (target instanceof Node && localeDropdownRoot.contains(target)) {
        return;
      }

      localeDropdownRoot.classList.remove('is-locale-open');
      setLocaleExpanded(false);
    });

    localeDropdownRoot.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') {
        return;
      }

      localeDropdownRoot.classList.remove('is-locale-open');
      setLocaleExpanded(false);
      localeTrigger.blur();
    });
  }
};
