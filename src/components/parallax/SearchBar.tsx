import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

export function SearchBar({ size = "lg", navigateTo }: { size?: "lg" | "md"; navigateTo?: "/app/discover" }) {
  const { query, runSearch } = useStore();
  const [value, setValue] = useState(query);
  const navigate = useNavigate();
  useEffect(() => setValue(query), [query]);
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        runSearch(value);
        if (navigateTo) navigate({ to: navigateTo });
      }}
      className={`flex items-center gap-2 border border-input bg-card focus-within:border-primary ${size === "lg" ? "p-2 pl-4" : "p-1.5 pl-3"}`}
    >
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <label htmlFor={`q-${size}`} className="sr-only">
        Research question
      </label>
      <input
        id={`q-${size}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask a research question…"
        className={`min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground ${size === "lg" ? "py-2 text-base" : "py-1 text-sm"}`}
      />
      <button
        type="submit"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        <span className="hidden sm:inline">Investigate</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
