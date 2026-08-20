import { useReducedMotion } from '@/lib/motionConfig';

/**
 * Hook to get animation duration based on user preferences
 * Returns 0 if user prefers reduced motion, otherwise returns the requested duration
 */
export function useAnimationDuration(durationMs = 300) {
  const prefersReduced = useReducedMotion();
  return prefersReduced ? 0 : durationMs;
}

/**
 * Hook to get animation config that respects user preferences
 * Useful for inline styles or as config for animation libraries
 */
export function useOptimizedAnimation(config = {}) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return { duration: 0, delay: 0 };
  }

  return {
    duration: config.duration || 300,
    delay: config.delay || 0,
    easing: config.easing || 'ease-in-out',
  };
}

/**
 * Hook to get transition CSS string for inline styles
 */
export function useTransitionCSS(properties = ['all'], durationMs = 300) {
  const prefersReduced = useReducedMotion();
  const duration = prefersReduced ? '0ms' : `${durationMs}ms`;
  return properties.map(prop => `${prop} ${duration} ease-in-out`).join(', ');
}