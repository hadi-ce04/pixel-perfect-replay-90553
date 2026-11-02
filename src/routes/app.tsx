import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DemoBadge, Wordmark } from "@/components/parallax/Brand";
import { EvidencePanel } from "@/components/parallax/EvidencePanel";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

const NAV = [
  { to: "/app", label: "Overview" },
  { to: "/app/discover", label: "Discover" },
  { to: "/app/story-dna", label: "Story DNA" },
  { to: "/app/saved", label: "Saved evidence" },
  { to: "/app/brief", label: "Editorial brief" },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { saved } = useStore();
  return (
    <nav aria-label="Workspace" className="flex flex-col gap-0.5">
      {NAV.map((n) => {
        const active = n.to === "/app" ? path === "/app" || path === "/app/" : path.startsWith(n.to);
        return (
          <Link
            key={n.to}
            to={n.to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors ${
              active ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            }`}
          >
            <span className={`h-4 w-0.5 ${active ? "bg-primary" : "bg-transparent"}`} aria-hidden />
            <span className="flex-1">{n.label}</span>
            {n.to === "/app/saved" && saved.length > 0 && (
              <span className="font-mono text-[11px] text-primary">{saved.length}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function AppLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-52 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <div className="px-2 py-2">
          <Wordmark to="/" />
          <p className="mt-3 text-xs text-muted-foreground">Research workspace</p>
        </div>
        <div className="mt-8 flex-1">
          <NavList />
        </div>
        <div className="space-y-2 border-t border-sidebar-border px-2 pt-4">
          <DemoBadge />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            45 fictional records. No live retrieval or analysis is connected.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
          <Wordmark to="/" />
          <div className="flex items-center gap-2">
            <DemoBadge />
            <Button variant="outline"
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label={open ? "Close navigation" : "Open navigation"}
              className="rounded-sm border border-border p-2"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </header>
        {open && (
          <div className="border-b border-border bg-sidebar p-3 lg:hidden">
            <NavList onNavigate={() => setOpen(false)} />
          </div>
        )}
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
      <EvidencePanel />
    </div>
  );
}
