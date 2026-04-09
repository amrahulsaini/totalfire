import { NextResponse } from "next/server";
import { getModeCatalog } from "@/lib/mode-catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const modes = await getModeCatalog();
  return NextResponse.json({ modes });
}
