import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { runAgentLoop } from "@/lib/agentLoop";
import { addMoodToHistory } from "@/lib/profileStore";
import type { ConversationTurn } from "@/types/movie";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message: unknown = body?.message;
    const conversationHistory: unknown = body?.conversationHistory;

    if (typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "`message` is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    const history: ConversationTurn[] = Array.isArray(conversationHistory)
      ? conversationHistory
      : [];

    // Log this mood submission against the active profile, if any. This is
    // best-effort â€” a logging failure should never break recommendations.
    const activeProfileId = cookies().get("activeProfileId")?.value;
    if (activeProfileId) {
      addMoodToHistory(activeProfileId, message).catch((err) => {
        console.error("[/api/recommend] failed to log mood history", err);
      });
    }

    const result = await runAgentLoop(message, history);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/recommend]", err);
    return NextResponse.json(
      { error: "Something went wrong generating recommendations." },
      { status: 500 }
    );
  }
}
