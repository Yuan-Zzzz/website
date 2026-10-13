import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getSiteSettings, upsertSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getSiteSettings();
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("admin-token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const tags = Array.isArray(body.aboutTags)
      ? body.aboutTags
      : String(body.aboutTags || "")
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean);

    const data = await upsertSiteSettings({
      aboutTitle: body.aboutTitle,
      aboutBody: body.aboutBody,
      aboutTags: tags,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
