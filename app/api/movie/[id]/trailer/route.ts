import { NextRequest, NextResponse } from "next/server";
import { getTrailer } from "@/lib/tmdb";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const movieId = Number(params.id);
  if (!Number.isFinite(movieId)) {
    return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  }

  try {
    const trailer = await getTrailer(movieId);
    return NextResponse.json({ trailer });
  } catch (err) {
    console.error(`[/api/movie/${params.id}/trailer]`, err);
    return NextResponse.json(
      { error: "Couldn't fetch the trailer for this movie." },
      { status: 500 }
    );
  }
}
