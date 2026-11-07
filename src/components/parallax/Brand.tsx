import { useSearchProvider } from "@/lib/provider-context";
import { Link } from "@tanstack/react-router";

export function BrandMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="none">
      <path
        d="M4 25V7h12l-5 7H4M13 25l13-18h-9M19 25h9V13"
        stroke="var(--primary)"
        strokeWidth="3.2"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
export function Wordmark({ to = "/" }: { to?: "/" | "/app" }) {
  return (
    <Link to={to} className="flex items-center gap-2.5" aria-label="PARALLAX home">
      <BrandMark />
      <span className="text-xl font-extrabold tracking-[-0.065em]">
        PARALLAX<span className="text-primary">.</span>
      </span>
    </Link>
  );
}
export function DemoBadge({ className = "" }: { className?: string }) {
  const live = useSearchProvider().mode === "live";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold tracking-wide text-muted-foreground ${className}`}
    >
      <span className="h-1 w-1 rounded-full bg-primary" />
      {live ? "Live Oriane" : "Demo data"}
    </span>
  );
}
