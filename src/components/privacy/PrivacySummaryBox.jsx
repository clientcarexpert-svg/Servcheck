export default function PrivacySummaryBox({ children }) {
  return (
    <div className="mt-4 mb-2 rounded-lg border border-border bg-secondary/40 px-4 py-3">
      <p className="text-xs leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground/70">Summary — </span>
        {children}
      </p>
    </div>
  );
}