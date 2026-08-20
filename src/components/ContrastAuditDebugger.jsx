import { useEffect, useState } from 'react';
import { auditPageContrast } from '@/lib/contrastChecker';

/**
 * Development-only component to highlight contrast issues
 * Remove from production or wrap with environment check
 */
export function ContrastAuditDebugger({ enabled = false }) {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    if (!enabled || import.meta.env.MODE === 'production') return;

    // Run audit after a brief delay to ensure DOM is ready
    const timeout = setTimeout(() => {
      const foundIssues = auditPageContrast('AA');
      setIssues(foundIssues);

      // Highlight problem elements
      foundIssues.forEach(issue => {
        issue.element.style.outline = '2px dashed #ff0000';
        issue.element.title = `Contrast: ${issue.contrastRatio}:1 (need ${issue.required}:1)`;
      });
    }, 500);

    return () => clearTimeout(timeout);
  }, [enabled]);

  if (!enabled || issues.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-red-50 border-2 border-red-500 rounded-lg p-4 max-w-sm z-[999]">
      <p className="font-bold text-red-700 mb-2">⚠ Contrast Issues Found: {issues.length}</p>
      <ul className="text-xs text-red-600 space-y-1 max-h-40 overflow-y-auto">
        {issues.map((issue, i) => (
          <li key={i} className="font-mono">
            {issue.textColor} on {issue.bgColor}: {issue.contrastRatio}:1 (need {issue.required}:1)
          </li>
        ))}
      </ul>
    </div>
  );
}