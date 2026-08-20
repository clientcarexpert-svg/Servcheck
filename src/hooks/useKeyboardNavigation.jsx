import { useEffect, useRef } from 'react';

/**
 * Hook for managing keyboard navigation within a container
 * Automatically handles Tab cycling, arrow key navigation, and Enter/Space for buttons
 */
export function useKeyboardNavigation(containerRef, options = {}) {
  const { 
    onEscape = null,
    cycleTab = true,
    arrowKeyNavigation = false 
  } = options;

  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    const handleKeyDown = (e) => {
      // Handle Escape key
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }

      // Get all focusable elements
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const focusedElement = document.activeElement;
      const focusedIndex = Array.from(focusableElements).indexOf(focusedElement);

      // Handle Tab cycling
      if (e.key === 'Tab' && cycleTab) {
        if (e.shiftKey) {
          // Shift+Tab - move backwards
          if (focusedIndex === 0) {
            e.preventDefault();
            focusableElements[focusableElements.length - 1].focus();
          }
        } else {
          // Tab - move forwards
          if (focusedIndex === focusableElements.length - 1) {
            e.preventDefault();
            focusableElements[0].focus();
          }
        }
      }

      // Handle arrow key navigation for custom implementations
      if (arrowKeyNavigation && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const isVertical = ['ArrowUp', 'ArrowDown'].includes(e.key);
        const isForward = ['ArrowRight', 'ArrowDown'].includes(e.key);
        const nextIndex = isForward ? focusedIndex + 1 : focusedIndex - 1;

        if (nextIndex >= 0 && nextIndex < focusableElements.length) {
          e.preventDefault();
          focusableElements[nextIndex].focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, onEscape, cycleTab, arrowKeyNavigation]);
}

/**
 * Hook to manage focus restoration (useful for modals)
 */
export function useFocusRestore(shouldRestore = true) {
  const previousFocusRef = useRef();

  useEffect(() => {
    if (shouldRestore) {
      previousFocusRef.current = document.activeElement;
    }

    return () => {
      if (shouldRestore && previousFocusRef.current && document.body.contains(previousFocusRef.current)) {
        previousFocusRef.current.focus();
      }
    };
  }, [shouldRestore]);

  return previousFocusRef;
}

/**
 * Hook to auto-focus an element on mount
 */
export function useAutoFocus(ref, shouldFocus = true) {
  useEffect(() => {
    if (shouldFocus && ref?.current) {
      // Delay slightly to ensure DOM is ready
      const timeout = setTimeout(() => {
        ref.current?.focus();
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [ref, shouldFocus]);
}

/**
 * Hook to announce focus changes to screen readers
 */
export function useAnnounceScreenReader(message, delay = 100) {
  useEffect(() => {
    const timeout = setTimeout(() => {
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = message;
      document.body.appendChild(announcement);

      setTimeout(() => announcement.remove(), 1000);
    }, delay);

    return () => clearTimeout(timeout);
  }, [message, delay]);
}

/**
 * Hook to trap focus within a container (for modals, popovers)
 */
export function useFocusTrap(containerRef, isActive = true) {
  useEffect(() => {
    const container = containerRef?.current;
    if (!container || !isActive) return;

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (e.shiftKey) {
        if (activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, isActive]);
}