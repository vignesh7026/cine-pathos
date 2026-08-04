import { NextRequest, NextResponse } from "next/server";
import { getStreamingAvailability } from "@/lib/tmdb";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const movieId = Number(params.id);
  if (!Number.isFinite(movieId)) {
    return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  }

  const region = req.nextUrl.searchParams.get("region") ?? "US";

  try {
    const availability = await getStreamingAvailability(movieId, region);
    return NextResponse.json(availability);
  } catch (err) {
    console.error(`[/api/movie/${params.id}/providers]`, err);
    return NextResponse.json(
      { error: "Couldn't fetch streaming availability for this movie." },
      { status: 500 }
    );
  }
}
