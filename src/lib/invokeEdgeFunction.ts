import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/integrations/supabase/client";

export async function invokeEdgeFunction<T>(functionName: string, body: unknown): Promise<T> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const rawText = await response.text();
  let data: unknown = null;

  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = rawText;
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "message" in data && typeof (data as { message?: unknown }).message === "string"
        ? (data as { message: string }).message
        : typeof data === "object" && data !== null && "description" in data && typeof (data as { description?: unknown }).description === "string"
          ? (data as { description: string }).description
          : rawText || `Request failed with status ${response.status}`;

    throw new Error(`Edge function returned ${response.status}: ${message}`);
  }

  return data as T;
}
