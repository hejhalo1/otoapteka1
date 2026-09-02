import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { fetchPharmacyBySlug } from "@/lib/api";
import { pharmacyPath } from "@/lib/slug";

// Stary adres wizytówki /apteka/<slug> → kanoniczny /apteki/<woj>/<miasto>/<slug>.
// Zachowany jako przekierowanie: istniejące linki (mapy, panel, zakładki, Google)
// dalej działają. Docelowo można zmienić na permanentRedirect (308) na produkcji.
export const revalidate = 3600;

const getPharmacy = cache(fetchPharmacyBySlug);

export default async function LegacyPharmacyRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getPharmacy(slug);
  if (!p) notFound();
  redirect(pharmacyPath(p.address.voivodeship, p.address.city, p.slug));
}
