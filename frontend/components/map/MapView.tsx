"use client";

import dynamic from "next/dynamic";
import type { MapProps } from "./MapLibreMap";

// MapLibre GL dotyka window/WebGL → ładowany wyłącznie po stronie klienta (ssr:false),
// co jest dozwolone tylko wewnątrz Client Component.
const MapLibreMap = dynamic(() => import("./MapLibreMap"), {
  ssr: false,
  loading: () => <div className="skeleton h-full w-full rounded-2xl" />,
});

export function MapView(props: MapProps) {
  return <MapLibreMap {...props} />;
}
