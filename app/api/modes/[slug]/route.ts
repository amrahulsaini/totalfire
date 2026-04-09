import { NextResponse } from "next/server";
import { getModeCatalogBySlug } from "@/lib/mode-catalog";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const mode = await getModeCatalogBySlug(slug);

  if (!mode) {
    return NextResponse.json({ error: "Mode not found" }, { status: 404 });
  }

  return NextResponse.json({ mode });
}
