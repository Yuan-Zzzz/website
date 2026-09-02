import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import {
  buildGitHubAuthUrl,
  getGitHubCallbackUrl,
  sanitizeReturnTo,
} from "@/lib/github-oauth";

export async function GET(request: NextRequest) {
  try {
    const returnTo = sanitizeReturnTo(request.nextUrl.searchParams.get("returnTo"));
    const state = randomBytes(16).toString("hex");
    const callbackUrl = getGitHubCallbackUrl(request);
    const authUrl = buildGitHubAuthUrl(state, callbackUrl);

    const response = NextResponse.redirect(authUrl);
    response.cookies.set("oauth-state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 5,
      path: "/",
    });
    response.cookies.set("oauth-return-to", returnTo, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 5,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "OAuth init failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
