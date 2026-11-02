import { createContext, useContext, type ReactNode } from "react";
import { provider, type SearchProvider } from "./provider";

const ProviderContext = createContext<SearchProvider>(provider);
const identities = new WeakMap<SearchProvider, number>();
let nextIdentity = 0;

/** Install an adapter once above the workspace; every data consumer uses it. */
export function SearchProviderBoundary({
  source,
  children,
}: {
  source: SearchProvider;
  children: ReactNode;
}) {
  return <ProviderContext.Provider value={source}>{children}</ProviderContext.Provider>;
}

export function useSearchProvider() {
  return useContext(ProviderContext);
}

/** Keep cached evidence isolated when switching adapters, including same-mode adapters. */
export function providerIdentity(source: SearchProvider) {
  if (!identities.has(source)) identities.set(source, ++nextIdentity);
  return identities.get(source)!;
}
