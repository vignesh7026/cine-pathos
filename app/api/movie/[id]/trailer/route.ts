import { NextRequest, NextResponse } from "next/server";
import { getTrailer } from "@/lib/tmdb";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await params;
  const movieId = Number(resolvedParams.id);
  if (!Number.isFinite(movieId)) {
    return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  }

  try {
    const trailer = await getTrailer(movieId);
    return NextResponse.json({ trailer });
  } catch (err) {
    console.error(`[/api/movie/${resolvedParams.id}/trailer]`, err);
    return NextResponse.json(
      { error: "Couldn't fetch the trailer for this movie." },
      { status: 500 }
    );
  }
}
