import { NextResponse } from "next/server";
import { BestNineError } from "../bestNineTopics";

export const bestNineApi = async (action: () => Promise<NextResponse>) => {
  try {
    const response = await action();
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    const known = error instanceof BestNineError;
    const response = NextResponse.json(
      { error: known ? error.code : "SERVICE_UNAVAILABLE" },
      { status: known ? error.status : 503 },
    );
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
};

export const readBestNineJson = async (request: Request) => {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new BestNineError("INVALID_RESPONSE", 400);
  const text = await request.text();
  if (text.length > 16000) throw new BestNineError("INVALID_RESPONSE", 400);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new BestNineError("INVALID_RESPONSE", 400);
  }
};
