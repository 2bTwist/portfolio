"use client";

/* Hands the catalogue view to the shell. The root layout passes the posts and
   tags it read on the server; without it (tests, isolated renders) the view
   still holds every page and project. */

import { createContext, useContext, type ReactNode } from "react";
import { STATIC_ENTRIES, catalogueView, type CatalogueEntry, type CatalogueView } from "@/app/lib/catalogue-view";

const CatalogueContext = createContext<CatalogueView>(catalogueView(STATIC_ENTRIES));

export function CatalogueProvider({ entries, children }: { entries: CatalogueEntry[]; children: ReactNode }) {
  const view = catalogueView([...STATIC_ENTRIES, ...entries]);
  return <CatalogueContext.Provider value={view}>{children}</CatalogueContext.Provider>;
}

export function useCatalogue(): CatalogueView {
  return useContext(CatalogueContext);
}
