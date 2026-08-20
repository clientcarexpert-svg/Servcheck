export default function PrivacySection({ id, number, title, children }) {
  return (
    <section id={id} className="scroll-mt-24 pb-10 border-b border-border last:border-b-0">
      <h2 className="text-lg font-bold tracking-tight text-foreground mt-0 mb-4 flex items-baseline gap-2">
        <span className="text-muted-foreground/50 font-mono text-sm">{number}.</span>
        {title}
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-foreground/85">
        {children}
      </div>
    </section>
  );
}