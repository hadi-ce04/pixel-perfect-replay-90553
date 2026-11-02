import { Link } from "@tanstack/react-router";

export function BrandMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="none">
      <rect x="3" y="7" width="17" height="17" stroke="var(--foreground)" strokeWidth="1.6" />
      <rect x="12" y="3" width="17" height="17" stroke="var(--signal)" strokeWidth="1.6" />
      <rect x="12" y="7" width="8" height="13" fill="var(--insight)" opacity="0.85" />
    </svg>
  );
}

export function Wordmark({ to = "/" }: { to?: "/" | "/app" }) {
  return (
    <Link to={to} className="flex items-center gap-2.5" aria-label="PARALLAX home">
      <BrandMark />
      <span className="text-sm font-semibold tracking-[0.28em]">PARALLAX</span>
    </Link>
  );
}

export function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-sm border border-insight/40 bg-insight/10 px-2 py-0.5 text-[11px] font-medium text-foreground ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-insight" aria-hidden />
      Demo data
    </span>
  );
}
