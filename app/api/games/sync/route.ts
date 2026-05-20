import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import {
  buildSyncMessage,
  syncItchGamesToDb,
  type ItchGame,
} from "@/lib/sync-itch-games";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function fetchItchGames(apiKey: string): Promise<{
  games?: ItchGame[];
  errors?: string[];
  error?: string;
  status?: number;
}> {
  let res: Response;
  try {
    res = await fetch(`https://itch.io/api/1/${apiKey}/my-games`, {
      cache: "no-store",
    });
  } catch (fetchError) {
    const message =
      fetchError instanceof Error ? fetchError.message : "Network error";
    console.error("Itch.io fetch failed:", fetchError);
    return {
      error: `服务器无法访问 Itch.io（${message}）。请在本地浏览器获取游戏列表后导入，或配置代理。`,
    };
  }

  let data: { games?: ItchGame[]; errors?: string[] };
  try {
    data = await res.json();
  } catch {
    return { error: "Itch.io 返回了无效的 JSON" };
  }

  if (data.errors?.length) {
    return { errors: data.errors };
  }

  if (!res.ok) {
    return { error: `Itch.io API error: HTTP ${res.status}`, status: res.status };
  }

  return { games: data.games || [] };
}

export async function POST(request: NextRequest) {
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

    let body: { apiKey?: string; games?: ItchGame[] };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    let itchGames: ItchGame[] | undefined;

    if (Array.isArray(body.games)) {
      itchGames = body.games;
    } else {
      const apiKey = body.apiKey?.trim();
      if (!apiKey) {
        return NextResponse.json(
          {
            success: false,
            error: "需要 apiKey，或直接提交 games 数组（本地导入）",
          },
          { status: 400 }
        );
      }

      const itchResult = await fetchItchGames(apiKey);
      if (itchResult.errors?.length) {
        return NextResponse.json(
          { success: false, error: itchResult.errors.join("; ") },
          { status: 400 }
        );
      }
      if (itchResult.error) {
        return NextResponse.json(
          { success: false, error: itchResult.error },
          { status: 502 }
        );
      }
      itchGames = itchResult.games;
    }

    if (!itchGames || itchGames.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: "Itch.io 库中没有找到游戏",
          synced: 0,
          updated: 0,
          skipped: 0,
        },
        { status: 200 }
      );
    }

    try {
      await connectDB();
    } catch (dbError) {
      const message =
        dbError instanceof Error ? dbError.message : "Database connection failed";
      console.error("MongoDB connection failed:", dbError);
      return NextResponse.json(
        {
          success: false,
          error: `数据库连接失败：${message}。请检查 MONGODB_URI 配置。`,
        },
        { status: 503 }
      );
    }

    const result = await syncItchGamesToDb(itchGames);

    if (result.synced === 0 && result.updated === 0 && result.failures.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `全部 ${result.failures.length} 个游戏同步失败：${result.failures.slice(0, 3).join("; ")}`,
          failures: result.failures,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: buildSyncMessage(result),
      synced: result.synced,
      updated: result.updated,
      skipped: result.skipped,
      failed: result.failures.length,
      failures: result.failures.length > 0 ? result.failures : undefined,
      total: result.total,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    console.error("Sync error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
