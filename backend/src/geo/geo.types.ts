export interface GeoCoords {
  lat: number;
  lng: number;
}

// Bounding box Polski — odrzucamy wyniki spoza kraju (błędne geokodowanie).
export const POLAND_BBOX = {
  minLat: 49.0,
  maxLat: 54.9,
  minLng: 14.1,
  maxLng: 24.2,
};
