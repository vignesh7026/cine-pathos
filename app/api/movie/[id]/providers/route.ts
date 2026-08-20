import { NextRequest, NextResponse } from "next/server";
import { getStreamingAvailability } from "@/lib/tmdb";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await params;
  const movieId = Number(resolvedParams.id);
  if (!Number.isFinite(movieId)) {
    return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  }

  const region = req.nextUrl.searchParams.get("region") ?? "US";

  try {
    const availability = await getStreamingAvailability(movieId, region);
    return NextResponse.json(availability);
  } catch (err) {
    console.error(`[/api/movie/${resolvedParams.id}/providers]`, err);
    return NextResponse.json(
      { error: "Couldn't fetch streaming availability for this movie." },
      { status: 500 }
    );
  }
}
