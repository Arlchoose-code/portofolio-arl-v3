import gsap from 'gsap';

export function configureGSAP() {
  if (typeof window !== 'undefined') {
    gsap.defaults({
      ease: 'power3.out',
      duration: 0.6,
    });
  }
}

export { gsap };
