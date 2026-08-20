/**
 * Image optimization utilities for lazy loading and responsive images
 */

/**
 * Generate Unsplash URL with lazy-loading parameters
 * @param {string} imageId - Unsplash image ID
 * @param {number} width - Desired width in pixels
 * @returns {string} Optimized Unsplash URL
 */
export function getOptimizedImageUrl(imageId, width = 800) {
  return `https://images.unsplash.com/photo-${imageId}?w=${width}&q=80&auto=format`;
}

/**
 * Create responsive image srcset for lazy-loaded images
 * @param {string} imageId - Unsplash image ID
 * @returns {string} srcset string for <img>
 */
export function getResponsiveImageSrcset(imageId) {
  return `
    ${getOptimizedImageUrl(imageId, 100)} 100w,
    ${getOptimizedImageUrl(imageId, 200)} 200w,
    ${getOptimizedImageUrl(imageId, 400)} 400w
  `.trim();
}

/**
 * IntersectionObserver hook for lazy loading
 * Usage: const { ref, isVisible } = useLazyLoad();
 */
import { useState, useRef, useEffect } from 'react';

export function useLazyLoad() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return { ref, isVisible };
}

/**
 * Lazy Image Component
 */
export function LazyImage({ src, alt, srcSet, className, ...props }) {
  const { ref, isVisible } = useLazyLoad();

  return (
    <img
      ref={ref}
      src={isVisible ? src : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3C/svg%3E'}
      srcSet={isVisible ? srcSet : undefined}
      alt={alt}
      loading="lazy"
      className={className}
      {...props}
    />
  );
}