const fs = require('fs');
const path = require('path');

// 扫描 posts 文件夹并生成索引
function generatePostsIndex() {
    const postsDir = path.join(__dirname, '../public/posts');
    const indexFile = path.join(postsDir, 'posts-index.json');
    
    // 确保 posts 目录存在
    if (!fs.existsSync(postsDir)) {
        fs.mkdirSync(postsDir, { recursive: true });
    }
    
    // 读取所有 .md 文件
    const files = fs.readdirSync(postsDir).filter(file => 
        file.endsWith('.md') && file !== 'posts-index.json'
    );
    
    const posts = files.map(filename => {
        const filePath = path.join(postsDir, filename);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // 解析前置元数据
        const metadata = parseFrontMatter(content);
        
        // 解析 categories 和 tags（可能是数组格式）
        let categories = [];
        let tags = [];
        
        if (metadata.categories) {
            categories = parseArrayField(metadata.categories);
        }
        
        if (metadata.tags) {
            tags = parseArrayField(metadata.tags);
        }
        
        return {
            filename: filename,
            title: metadata.title || filename.replace('.md', ''),
            date: metadata.date || new Date().toISOString().split('T')[0],
            excerpt: metadata.excerpt || generateExcerpt(metadata.content),
            categories: categories,
            tags: tags
        };
    });
    
    // 写入索引文件
    fs.writeFileSync(indexFile, JSON.stringify(posts, null, 2));
    console.log(`✓ 已生成博客索引，共 ${posts.length} 篇文章`);
}

// 解析 Front Matter
function parseFrontMatter(content) {
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontMatterRegex);
    
    if (match) {
        const metadata = {};
        const frontMatterContent = match[1];
        const bodyContent = match[2];
        
        const lines = frontMatterContent.split('\n');
        let i = 0;
        
        while (i < lines.length) {
            const line = lines[i];
            const colonIndex = line.indexOf(':');
            
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim();
                const value = line.substring(colonIndex + 1).trim();
                
                // 检查是否是数组字段（tags 或 categories），且值为空（表示是YAML数组格式）
                if ((key === 'tags' || key === 'categories') && value === '') {
                    // 处理 YAML 数组格式
                    const arrayItems = [];
                    i++; // 移动到下一行
                    
                    // 读取数组项（以 - 开头，可能有缩进）
                    while (i < lines.length) {
                        const nextLine = lines[i];
                        const trimmedLine = nextLine.trim();
                        
                        // 如果下一行是空行，跳过
                        if (trimmedLine === '') {
                            i++;
                            continue;
                        }
                        
                        // 如果下一行是另一个键（包含冒号且不是数组项），停止
                        const nextColonIndex = trimmedLine.indexOf(':');
                        if (nextColonIndex > 0 && !trimmedLine.startsWith('-')) {
                            // 检查是否在引号内（简单检查）
                            const beforeColon = trimmedLine.substring(0, nextColonIndex);
                            if (!beforeColon.includes('"') && !beforeColon.includes("'")) {
                                break;
                            }
                        }
                        
                        // 提取数组项（移除 - 和空格）
                        if (trimmedLine.startsWith('-')) {
                            const item = trimmedLine.substring(1).trim();
                            if (item) {
                                arrayItems.push(item);
                            }
                            i++;
                        } else {
                            // 如果不是以-开头，可能是缩进问题，尝试检查是否有缩进
                            // 如果这行有内容但不是数组项，停止
                            if (trimmedLine.length > 0) {
                                break;
                            }
                            i++;
                        }
                    }
                    
                    metadata[key] = arrayItems;
                    continue; // 已经处理了，不需要 i++
                } else {
                    metadata[key] = value;
                }
            }
            
            i++;
        }
        
        metadata.content = bodyContent;
        return metadata;
    }
    
    return { content };
}

// 解析数组字段（支持 YAML 数组格式）
function parseArrayField(field) {
    if (!field) return [];
    
    // 如果是字符串格式 "[item1, item2]"
    if (typeof field === 'string') {
        // 移除方括号和引号
        const cleaned = field.replace(/[\[\]"']/g, '').trim();
        if (cleaned === '') return [];
        
        // 按逗号分割
        return cleaned.split(',').map(item => item.trim()).filter(item => item !== '');
    }
    
    // 如果已经是数组
    if (Array.isArray(field)) {
        return field;
    }
    
    return [];
}

// 生成摘要（取前 150 个字符）
function generateExcerpt(content) {
    if (!content) return '';
    
    // 移除 markdown 标记
    const plainText = content
        .replace(/#+\s/g, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
        .replace(/`/g, '')
        .trim();
    
    // 取前 150 个字符
    return plainText.length > 150 
        ? plainText.substring(0, 150) + '...' 
        : plainText;
}

// 执行
generatePostsIndex();
