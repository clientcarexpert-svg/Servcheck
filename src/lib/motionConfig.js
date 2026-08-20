import { useEffect, useState } from 'react';

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Motion configuration that respects user preferences
 * Use these instead of hardcoded animation values
 */
export const MOTION_CONFIG = {
  // Quick, subtle transitions
  quick: {
    duration: prefersReducedMotion() ? 0 : 0.15,
    ease: 'easeInOut',
  },
  // Standard transitions
  normal: {
    duration: prefersReducedMotion() ? 0 : 0.3,
    ease: 'easeInOut',
  },
  // Slower transitions for important elements
  slow: {
    duration: prefersReducedMotion() ? 0 : 0.5,
    ease: 'easeInOut',
  },
  // For spring animations
  spring: {
    type: 'spring',
    stiffness: 400,
    damping: 40,
    mass: 1.5,
  },
};

/**
 * Hook to respect reduced motion preferences
 */
export function useReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mediaQuery.matches);

    const handler = (e) => setPrefersReduced(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}

/**
 * Performance-optimized animation variants
 * Uses transform and opacity (GPU-accelerated) instead of position/size changes
 */
export const ANIMATION_VARIANTS = {
  // Fade in
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  // Slide from right (uses transform for performance)
  slideInRight: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
  },
  // Slide from left
  slideInLeft: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  },
  // Slide from top
  slideInUp: {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  },
  // Scale up subtly
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  },
  // Modal backdrop
  backdropFade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  },
};

/**
 * Get optimized animation config based on user preferences
 */
export function getMotionVariants(variant, reduced = false) {
  if (reduced || prefersReducedMotion()) {
    // Return instant animations (just show/hide)
    return {
      hidden: { ...ANIMATION_VARIANTS[variant]?.hidden, opacity: 0 },
      visible: { ...ANIMATION_VARIANTS[variant]?.visible, opacity: 1 },
      exit: { opacity: 0 },
    };
  }
  return ANIMATION_VARIANTS[variant];
}