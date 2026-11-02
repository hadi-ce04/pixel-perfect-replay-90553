import { Link } from "@tanstack/react-router";

export function BrandMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="none">
      <path d="M20 8H4v20h20V12" stroke="var(--foreground)" strokeWidth="1.6" />
      <path d="M12 20H28V4H12V20Z" stroke="var(--primary)" strokeWidth="1.6" />
    </svg>
  );
}

export function Wordmark({ to = "/" }: { to?: "/" | "/app" }) {
  return (
    <Link to={to} className="flex items-center gap-2.5" aria-label="PARALLAX home">
      <BrandMark />
      <span className="font-display text-2xl font-medium">PARALLAX</span>
    </Link>
  );
}

export function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground ${className}`}>
      Demo data
    </span>
  );
}
