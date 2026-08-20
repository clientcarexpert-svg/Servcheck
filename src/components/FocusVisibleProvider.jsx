import { useEffect } from 'react';

/**
 * Provider to apply visible focus indicators only when using keyboard
 * Removes focus ring on mouse interactions for better visual experience
 */
export function FocusVisibleProvider() {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Remove focus outline for mouse users */
      body.mouse-user *:focus {
        outline: none;
      }

      /* Show focus ring for keyboard users */
      body.keyboard-user *:focus-visible {
        outline: 2px solid hsl(var(--ring));
        outline-offset: 2px;
        border-radius: inherit;
      }

      /* Enhanced focus states for interactive elements */
      body.keyboard-user button:focus-visible,
      body.keyboard-user [role="button"]:focus-visible,
      body.keyboard-user input:focus-visible,
      body.keyboard-user textarea:focus-visible,
      body.keyboard-user select:focus-visible,
      body.keyboard-user a:focus-visible {
        box-shadow: 0 0 0 3px hsl(var(--ring) / 0.2), inset 0 0 0 2px hsl(var(--ring));
      }

      /* Screen reader only text */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }
    `;
    document.head.appendChild(style);

    // Track keyboard vs mouse usage
    const handleKeyDown = () => {
      document.body.classList.add('keyboard-user');
      document.body.classList.remove('mouse-user');
    };

    const handleMouseDown = () => {
      document.body.classList.add('mouse-user');
      document.body.classList.remove('keyboard-user');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      style.remove();
    };
  }, []);

  return null;
}