"use client";

import dynamic from "next/dynamic";
import type { LeafletMapProps } from "./LeafletMap";

// Leaflet dotyka window → ładowany wyłącznie po stronie klienta (ssr:false),
// co jest dozwolone tylko wewnątrz Client Component.
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div className="skeleton h-full w-full rounded-2xl" />,
});

export function MapView(props: LeafletMapProps) {
  return <LeafletMap {...props} />;
}
