/**
 * WCAG Color Contrast Checker
 * Ensures color combinations meet WCAG AA and AAA standards
 */

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

/**
 * Calculate relative luminance (WCAG formula)
 */
function getLuminance(rgb) {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 * Returns ratio from 1:1 (no contrast) to 21:1 (max contrast)
 */
export function getContrastRatio(color1, color2) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return null;

  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standard
 * AA: 4.5:1 for normal text, 3:1 for large text (18pt+)
 */
export function meetsWCAG_AA(contrastRatio, isLargeText = false) {
  const minRatio = isLargeText ? 3 : 4.5;
  return contrastRatio >= minRatio;
}

/**
 * Check if contrast ratio meets WCAG AAA standard
 * AAA: 7:1 for normal text, 4.5:1 for large text
 */
export function meetsWCAG_AAA(contrastRatio, isLargeText = false) {
  const minRatio = isLargeText ? 4.5 : 7;
  return contrastRatio >= minRatio;
}

/**
 * Audit text on page for contrast issues
 * Returns array of elements with poor contrast
 */
export function auditPageContrast(minStandard = 'AA') {
  const issues = [];
  const elements = document.querySelectorAll('p, span, button, a, label, h1, h2, h3, h4, h5, h6');

  elements.forEach(el => {
    const computed = window.getComputedStyle(el);
    const textColor = computed.color;
    const bgColor = computed.backgroundColor;

    // Skip transparent backgrounds
    if (bgColor === 'rgba(0, 0, 0, 0)') return;

    // Convert RGB to hex
    const rgbToHex = (rgb) => {
      const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
      if (!match) return null;
      return '#' + [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
    };

    const textHex = rgbToHex(textColor);
    const bgHex = rgbToHex(bgColor);

    if (!textHex || !bgHex) return;

    const ratio = getContrastRatio(textHex, bgHex);
    const fontSize = parseInt(computed.fontSize);
    const isLarge = fontSize >= 18;

    const meetsStandard = minStandard === 'AAA'
      ? meetsWCAG_AAA(ratio, isLarge)
      : meetsWCAG_AA(ratio, isLarge);

    if (!meetsStandard) {
      issues.push({
        element: el,
        textColor: textHex,
        bgColor: bgHex,
        contrastRatio: ratio.toFixed(2),
        required: minStandard === 'AAA' ? (isLarge ? 4.5 : 7) : (isLarge ? 3 : 4.5),
        status: 'FAIL',
        fontSize,
      });
    }
  });

  return issues;
}

/**
 * Console report of contrast issues (for development)
 */
export function reportContrastIssues() {
  const issues = auditPageContrast('AA');
  if (issues.length === 0) {
    console.log('✓ All text meets WCAG AA contrast standards');
    return;
  }

  console.warn(`⚠ Found ${issues.length} contrast issues:`);
  issues.forEach(issue => {
    console.warn(
      `Text: ${issue.textColor} on ${issue.bgColor} (${issue.contrastRatio}:1, need ${issue.required}:1)`,
      issue.element
    );
  });
}