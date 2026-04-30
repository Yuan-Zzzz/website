import fs from "fs";
import path from "path";
import matter from "gray-matter";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27018/yuan-website";

// Connect to MongoDB
async function connectDB() {
  await mongoose.connect(MONGODB_URI);
  console.log("✓ Connected to MongoDB");
}

// Define schemas inline for migration
const ArticleSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  excerpt: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  tags: [String],
  categories: [String],
  published: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const GameSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  itchUrl: { type: String, required: true },
  tags: [String],
  order: { type: Number, default: 0 },
  published: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Article = mongoose.models.Article || mongoose.model("Article", ArticleSchema);
const Game = mongoose.models.Game || mongoose.model("Game", GameSchema);

function generateExcerpt(content: string): string {
  const plainText = content
    .replace(/#+\s/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/`/g, "")
    .trim();

  return plainText.length > 150
    ? plainText.substring(0, 150) + "..."
    : plainText;
}

function fixImagePaths(content: string): string {
  // Replace relative image paths with absolute paths
  // ./image.png -> /images/posts/image.png
  // image.png -> /images/posts/image.png
  return content.replace(
    /!\[([^\]]*)\]\((\.\/)?([^)]+)\)/g,
    (match, alt, _dotSlash, filename) => {
      // Skip if already absolute URL
      if (filename.startsWith("http") || filename.startsWith("/")) {
        return match;
      }
      return `![${alt}](/images/posts/${filename})`;
    }
  );
}

async function migrateArticles() {
  const postsDir = path.join(process.cwd(), "public/posts");
  const files = fs
    .readdirSync(postsDir)
    .filter((f) => f.endsWith(".md"));

  console.log(`Found ${files.length} markdown files`);

  // Clear existing articles
  await Article.deleteMany({});
  console.log("✓ Cleared existing articles");

  for (const filename of files) {
    const filePath = path.join(postsDir, filename);
    const rawContent = fs.readFileSync(filePath, "utf-8");
    const parsed = matter(rawContent);

    const slug = filename.replace(".md", "");
    const title = parsed.data.title || slug;
    const date = parsed.data.date
      ? new Date(parsed.data.date)
      : new Date();
    const excerpt =
      parsed.data.excerpt || generateExcerpt(parsed.content);
    const tags = Array.isArray(parsed.data.tags)
      ? parsed.data.tags
      : typeof parsed.data.tags === "string"
      ? parsed.data.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
      : [];
    const categories = Array.isArray(parsed.data.categories)
      ? parsed.data.categories
      : typeof parsed.data.categories === "string"
      ? parsed.data.categories.split(",").map((t: string) => t.trim()).filter(Boolean)
      : [];

    const content = fixImagePaths(parsed.content);

    await Article.create({
      slug,
      title,
      content,
      excerpt,
      date,
      tags,
      categories,
      published: true,
    });

    console.log(`  ✓ Migrated: ${title}`);
  }

  console.log(`✓ Migrated ${files.length} articles`);
}

async function migrateImages() {
  const postsDir = path.join(process.cwd(), "public/posts");
  const imagesDir = path.join(process.cwd(), "public/images/posts");

  // Ensure images directory exists
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  const files = fs.readdirSync(postsDir);
  const imageFiles = files.filter((f) =>
    /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f)
  );

  for (const filename of imageFiles) {
    const srcPath = path.join(postsDir, filename);
    const destPath = path.join(imagesDir, filename);
    fs.copyFileSync(srcPath, destPath);
    console.log(`  ✓ Copied image: ${filename}`);
  }

  console.log(`✓ Migrated ${imageFiles.length} images`);
}

async function migrateGames() {
  // Read existing game-projects.json
  const gameProjectsPath = path.join(process.cwd(), "public/game-projects.json");
  let games: any[] = [];

  if (fs.existsSync(gameProjectsPath)) {
    const data = JSON.parse(fs.readFileSync(gameProjectsPath, "utf-8"));
    games = Array.isArray(data) ? data : [];
  }

  // Clear existing games
  await Game.deleteMany({});
  console.log("✓ Cleared existing games");

  if (games.length === 0) {
    console.log("⚠ No games to migrate (game-projects.json is empty)");
    return;
  }

  for (const game of games) {
    await Game.create({
      title: game.title || "Untitled Game",
      description: game.description || "",
      imageUrl: game.imageUrl || "/images/projects/default.png",
      itchUrl: game.itchUrl || "#",
      tags: game.tags || [],
      order: game.order || 0,
      published: true,
    });
    console.log(`  ✓ Migrated game: ${game.title}`);
  }

  console.log(`✓ Migrated ${games.length} games`);
}

async function main() {
  try {
    await connectDB();
    await migrateArticles();
    await migrateImages();
    await migrateGames();
    console.log("\n🎉 Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
