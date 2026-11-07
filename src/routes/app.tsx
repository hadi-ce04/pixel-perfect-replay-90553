import { useSearchProvider } from "@/lib/provider-context";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { DemoBadge, ThemeToggle, Wordmark } from "@/components/parallax/Brand";
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

function NavList({
  layout,
  onNavigate,
}: {
  layout: "bar" | "menu";
  onNavigate?: () => void;
}) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { saved } = useStore();
  return (
    <nav
      aria-label="Workspace"
      className={layout === "bar" ? "workspace-tabs" : "flex flex-col gap-0.5"}
    >
      {NAV.map((n) => {
        const active =
          n.to === "/app" ? path === "/app" || path === "/app/" : path.startsWith(n.to);
        return (
          <Link
            key={n.to}
            to={n.to}
            activeOptions={{ exact: n.to === "/app", includeSearch: false }}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={
              layout === "bar"
                ? "workspace-tab"
                : `flex items-center justify-between rounded-sm px-3 py-2.5 text-sm ${
                    active
                      ? "bg-secondary font-semibold text-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`
            }
          >
            {n.label}
            {n.to === "/app/saved" && saved.length > 0 && (
              <span className="workspace-count" aria-label={`${saved.length} saved`}>
                {saved.length}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function AppLayout() {
  const live = useSearchProvider().mode === "live";
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="workspace-bar">
        <div className="workspace-bar-inner">
          <Wordmark to="/" />
          <div className="hidden min-w-0 flex-1 justify-center lg:flex">
            <NavList layout="bar" />
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <DemoBadge className="hidden sm:inline-flex" />
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="workspace-menu"
              aria-label={open ? "Close navigation" : "Open navigation"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border text-foreground lg:hidden"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {open && (
          <div id="workspace-menu" className="border-t border-border px-4 py-3 lg:hidden">
            <NavList layout="menu" onNavigate={() => setOpen(false)} />
          </div>
        )}
      </header>
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
      <footer className="workspace-footer">
        <p>
          {live
            ? "Source videos from Oriane, on any topic. Themes are terms found in source passages; speaker perspectives are not classified."
            : "45 fictional records. No live retrieval is connected."}
        </p>
        <DemoBadge className="sm:hidden" />
      </footer>
      <EvidencePanel />
    </div>
  );
}
