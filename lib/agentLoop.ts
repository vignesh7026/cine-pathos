import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import { getGroqClient, groqTools, SYSTEM_INSTRUCTION, GROQ_MODEL } from "@/lib/groq";
import { executeTool } from "@/lib/tools";
import type {
  ConversationTurn,
  Movie,
  RecommendResponse,
  ToolName,
} from "@/types/movie";

const MAX_TOOL_ROUNDS = 4;

/**
 * Groq occasionally has the model emit a malformed pseudo-function-call as
 * plain text (e.g. `<function=search_movies(...)>`) instead of a proper
 * structured tool call — the server rejects this itself with a 400
 * `tool_use_failed` before we ever see a response. It's model flakiness,
 * not a bug in our request, and a bare retry with the same messages
 * usually succeeds on the next attempt.
 *
 * Separately, the free tier has a fairly low tokens-per-minute cap
 * (8,000 for openai/gpt-oss-120b), which a system prompt + tool schemas +
 * conversation history can burn through quickly under repeated testing.
 * Groq returns a 429 with a `retry-after` header telling us exactly how
 * long to wait — so on a 429 we actually wait that long (capped, so a
 * request never hangs indefinitely) and retry once, instead of failing
 * the whole recommendation outright.
 */
async function createCompletionWithRetry(
  client: ReturnType<typeof getGroqClient>,
  messages: ChatCompletionMessageParam[],
  attempt = 0
): ReturnType<typeof client.chat.completions.create> {
  try {
    return await client.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      tools: groqTools,
      tool_choice: "auto",
    });
  } catch (err) {
    const status =
      err && typeof err === "object" && "status" in err
        ? (err as { status?: number }).status
        : undefined;
    const code =
      err && typeof err === "object" && "code" in err
        ? (err as { code?: string }).code
        : undefined;

    if (code === "tool_use_failed" && attempt < 1) {
      console.warn(
        "[agentLoop] tool_use_failed from Groq, retrying once…",
        err
      );
      return createCompletionWithRetry(client, messages, attempt + 1);
    }

    if (status === 429 && attempt < 1) {
      const headers =
        err && typeof err === "object" && "headers" in err
          ? (err as { headers?: Headers }).headers
          : undefined;
      const retryAfterSeconds = Number(headers?.get?.("retry-after") ?? "5");
      const waitMs = Math.min(
        Math.max(retryAfterSeconds, 1) * 1000,
        20000 // never wait more than 20s — fail fast beyond that
      );
      console.warn(
        `[agentLoop] rate limited by Groq, waiting ${waitMs}ms and retrying once…`
      );
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      return createCompletionWithRetry(client, messages, attempt + 1);
    }

    throw err;
  }
}

/**
 * Runs the agentic loop for one user message:
 *  1. Send the message (+ history) to Groq with tool definitions attached.
 *  2. If the model responds with tool call(s), execute them and feed the
 *     results back in as "tool" role messages.
 *  3. Repeat until the model stops calling tools or ask_clarifying_question
 *     fires, then shape a RecommendResponse for the client.
 *
 * Unlike Gemini's chat-session object (which tracks history internally),
 * Groq's OpenAI-compatible API is stateless per request — we own the
 * `messages` array and grow it ourselves each round.
 */
export async function runAgentLoop(
  message: string,
  history: ConversationTurn[] = []
): Promise<RecommendResponse> {
  const client = getGroqClient();

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_INSTRUCTION },
    ...history.map(
      (turn): ChatCompletionMessageParam => ({
        role: turn.role === "user" ? "user" : "assistant",
        content: turn.content,
      })
    ),
    { role: "user", content: message },
  ];

  let lastMovies: Movie[] = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const completion = await createCompletionWithRetry(client, messages);

    const assistantMessage = completion.choices[0].message;
    const toolCalls = assistantMessage.tool_calls;

    if (!toolCalls || toolCalls.length === 0) {
      // Model produced a plain text final answer with no further tool use.
      const text = assistantMessage.content ?? "";
      return {
        type: "results",
        movies: lastMovies,
        agentNote: text || "Here's what I found for that mood.",
      };
    }

    // Record the assistant's tool-call turn before appending tool results,
    // matching the OpenAI-style message sequence Groq expects.
    messages.push(assistantMessage as ChatCompletionMessageParam);

    for (const call of toolCalls) {
      const toolName = call.function.name as ToolName;
      const args = JSON.parse(call.function.arguments || "{}") as Record<
        string,
        unknown
      >;

      if (toolName === "ask_clarifying_question") {
        const question =
          (args as { question?: string })?.question ??
          "Can you tell me a bit more about what you're in the mood for?";
        return { type: "clarifying_question", question };
      }

      let toolResult: unknown;
      try {
        const result = await executeTool(toolName, args);
        toolResult = result.output;

        if (toolName === "search_movies") {
          lastMovies = (result.output as { movies: Movie[] }).movies;
        }
      } catch (err) {
        toolResult = {
          error: err instanceof Error ? err.message : "Tool execution failed",
        };
      }

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(toolResult),
      });
    }
  }

  // Safety net: if the model is still calling tools after MAX_TOOL_ROUNDS,
  // return whatever movies we last found rather than looping forever.
  return {
    type: "results",
    movies: lastMovies,
    agentNote:
      lastMovies.length > 0
        ? "Here's what I found so far for that mood."
        : "I wasn't able to find a good match — try describing your mood a little differently.",
  };
}