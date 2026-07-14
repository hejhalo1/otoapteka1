import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

// Rewalidacja on-demand ISR. Woła ją backend (po publikacji komunikatu / synchronizacji)
// z sekretem REVALIDATE_SECRET. Bez ważnego sekretu → 401.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    secret?: string;
    tag?: string;
    path?: string;
  };

  if (!process.env.REVALIDATE_SECRET || body.secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Nieautoryzowane" }, { status: 401 });
  }

  if (body.tag) revalidateTag(body.tag, "max");
  if (body.path) revalidatePath(body.path);

  return NextResponse.json({ revalidated: true, tag: body.tag ?? null, path: body.path ?? null });
}
