import { connectDB } from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";

export const DEFAULT_SITE_SETTINGS = {
  aboutTitle: "关于我",
  aboutBody:
    "Base 上海，兼职开发独立游戏，主要使用C#(Unity/Godot/MonoGame)，Steam新作火热开发中。你可以在本网站的游戏作品和博客中了解到我开发的游戏、技术或思考，我会在上面分享我的开发经验和一些不务正业的东西。如果你有任何想与我交流的内容，欢迎随时联系我！",
  aboutTags: ["Unity", "C#", "Graphics", "FNA", "MonoGame", "Game Design"],
};

export type SiteSettingsData = {
  aboutTitle: string;
  aboutBody: string;
  aboutTags: string[];
};

export async function getSiteSettings(): Promise<SiteSettingsData> {
  await connectDB();
  const doc = await SiteSettings.findOne({ key: "site" }).lean();
  if (!doc) {
    return { ...DEFAULT_SITE_SETTINGS };
  }

  return {
    aboutTitle: doc.aboutTitle || DEFAULT_SITE_SETTINGS.aboutTitle,
    aboutBody: doc.aboutBody || DEFAULT_SITE_SETTINGS.aboutBody,
    aboutTags:
      Array.isArray(doc.aboutTags) && doc.aboutTags.length > 0
        ? doc.aboutTags.map(String)
        : DEFAULT_SITE_SETTINGS.aboutTags,
  };
}

export async function upsertSiteSettings(
  input: Partial<SiteSettingsData>
): Promise<SiteSettingsData> {
  await connectDB();

  const aboutTitle =
    input.aboutTitle?.trim() || DEFAULT_SITE_SETTINGS.aboutTitle;
  const aboutBody =
    input.aboutBody?.trim() ?? DEFAULT_SITE_SETTINGS.aboutBody;
  const aboutTags = Array.isArray(input.aboutTags)
    ? input.aboutTags.map((t) => String(t).trim()).filter(Boolean)
    : DEFAULT_SITE_SETTINGS.aboutTags;

  const doc = await SiteSettings.findOneAndUpdate(
    { key: "site" },
    {
      key: "site",
      aboutTitle,
      aboutBody,
      aboutTags,
      updatedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return {
    aboutTitle: doc!.aboutTitle,
    aboutBody: doc!.aboutBody,
    aboutTags: doc!.aboutTags || [],
  };
}
