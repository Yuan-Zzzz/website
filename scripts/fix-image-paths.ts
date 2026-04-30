import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27018/yuan-website";

async function connectDB() {
  await mongoose.connect(MONGODB_URI);
  console.log("✓ Connected to MongoDB");
}

const ArticleSchema = new mongoose.Schema({
  slug: String,
  title: String,
  content: String,
});

const Article = mongoose.models.Article || mongoose.model("Article", ArticleSchema);

function fixImagePaths(content: string): string {
  // Handle both ./filename.png and filename.png (no ./ prefix)
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

async function main() {
  try {
    await connectDB();
    const articles = await Article.find({});
    console.log(`Found ${articles.length} articles`);

    let fixed = 0;
    for (const article of articles) {
      const newContent = fixImagePaths(article.content);
      if (newContent !== article.content) {
        await Article.updateOne({ _id: article._id }, { content: newContent });
        console.log(`  ✓ Fixed images in: ${article.title}`);
        fixed++;
      }
    }

    console.log(`\n✓ Fixed ${fixed} articles`);
  } catch (error) {
    console.error("Fix failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
