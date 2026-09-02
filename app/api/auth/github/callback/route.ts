import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { createToken } from "@/lib/auth";
import User from "@/models/User";
import {
  exchangeCodeForToken,
  fetchGitHubUser,
  getGitHubCallbackUrl,
  sanitizeReturnTo,
} from "@/lib/github-oauth";

export async function GET(request: NextRequest) {
  const returnTo = sanitizeReturnTo(
    request.cookies.get("oauth-return-to")?.value || "/"
  );
  const errorRedirect = (error: string) => {
    const url = new URL(returnTo, request.url);
    url.searchParams.set("error", error);
    return NextResponse.redirect(url);
  };

  try {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const savedState = request.cookies.get("oauth-state")?.value;

    if (!code || !state || !savedState || state !== savedState) {
      return errorRedirect("auth_failed");
    }

    const callbackUrl = getGitHubCallbackUrl(request);
    const accessToken = await exchangeCodeForToken(code, callbackUrl);
    const githubUser = await fetchGitHubUser(accessToken);

    await connectDB();
    const githubId = String(githubUser.id);
    const user = await User.findOneAndUpdate(
      { githubId },
      {
        githubId,
        username: githubUser.login,
        displayName: githubUser.name || githubUser.login,
        avatarUrl: githubUser.avatar_url,
        updatedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const token = await createToken({
      userId: user._id.toString(),
      githubId,
      role: "user",
    });

    const response = NextResponse.redirect(new URL(returnTo, request.url));
    response.cookies.set("user-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    response.cookies.delete("oauth-state");
    response.cookies.delete("oauth-return-to");

    return response;
  } catch {
    return errorRedirect("auth_failed");
  }
}
