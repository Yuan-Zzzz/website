import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import hljs from 'highlight.js';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Container from '../components/ui/Container';
import Card from '../components/ui/Card';
import TOC from '../components/TOC';
import ImageViewer from '../components/ImageViewer';
import 'highlight.js/styles/github.css'; // Import highlight.js style for white background

// 确保 hljs 在全局可用
if (typeof window !== 'undefined') {
    window.hljs = hljs;
}

const BlogPost = () => {
    const { slug } = useParams();
    const [content, setContent] = useState('');
    const [metadata, setMetadata] = useState(null);
    const contentRef = useRef(null);

    useEffect(() => {
        // Fetch the markdown file
        fetch(`/posts/${slug}.md`)
            .then(res => res.text())
            .then(text => {
                // Simple frontmatter parsing (since we don't have a backend parser at runtime)
                // This assumes the markdown starts with --- ... ---
                const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
                const match = text.match(frontMatterRegex);

                if (match) {
                    const frontMatter = match[1];
                    const body = match[2];

                    const meta = {};
                    frontMatter.split('\n').forEach(line => {
                        const colonIndex = line.indexOf(':');
                        if (colonIndex > 0) {
                            const key = line.substring(0, colonIndex).trim();
                            const value = line.substring(colonIndex + 1).trim();
                            meta[key] = value;
                        }
                    });

                    setMetadata(meta);
                    setContent(body);
                } else {
                    setContent(text);
                }
            })
            .catch(err => console.error('Error loading blog post:', err));
    }, [slug]);

    // 确保代码高亮在内容渲染后应用
    useEffect(() => {
        if (content && contentRef.current) {
            // 等待DOM更新和ReactMarkdown渲染完成
            const timer = setTimeout(() => {
                const codeBlocks = contentRef.current.querySelectorAll('pre code');
                codeBlocks.forEach(block => {
                    // 如果已经高亮过，跳过
                    if (block.classList.contains('hljs')) {
                        return;
                    }
                    
                    // 保存原始文本内容
                    const textContent = block.textContent || '';
                    
                    // 尝试从类名中提取语言
                    const classList = Array.from(block.classList);
                    let language = null;
                    
                    // 查找 language-xxx 类
                    for (const cls of classList) {
                        if (cls.startsWith('language-')) {
                            language = cls.replace('language-', '');
                            break;
                        }
                    }
                    
                    // 处理语言别名
                    if (language === 'cs' || language === 'c#') {
                        language = 'csharp';
                    } else if (language === 'js') {
                        language = 'javascript';
                    } else if (language === 'ts') {
                        language = 'typescript';
                    } else if (language === 'py') {
                        language = 'python';
                    } else if (language === 'sh' || language === 'bash') {
                        language = 'bash';
                    }
                    
                    // 进行高亮
                    try {
                        if (language && hljs.getLanguage(language)) {
                            const result = hljs.highlight(textContent, { language });
                            block.innerHTML = result.value;
                            block.classList.add('hljs');
                            block.classList.add(`language-${language}`);
                        } else if (language) {
                            // 如果语言不支持，尝试自动检测
                            const result = hljs.highlightAuto(textContent);
                            block.innerHTML = result.value;
                            block.classList.add('hljs');
                            if (result.language) {
                                block.classList.add(`language-${result.language}`);
                            }
                        } else {
                            // 没有指定语言，自动检测
                            const result = hljs.highlightAuto(textContent);
                            block.innerHTML = result.value;
                            block.classList.add('hljs');
                            if (result.language) {
                                block.classList.add(`language-${result.language}`);
                            }
                        }
                    } catch (e) {
                        console.warn('Failed to highlight code block:', e, language);
                        // 如果高亮失败，至少保持原始内容
                        block.textContent = textContent;
                    }
                });
            }, 100);
            
            return () => clearTimeout(timer);
        }
    }, [content]);

    if (!content) {
        return (
            <div className="blog-post-page">
                <Header />
                <Container style={{ padding: '100px 0', textAlign: 'center' }}>
                    <p>Loading...</p>
                </Container>
                <Footer />
            </div>
        );
    }

    return (
        <div className="blog-post-page">
            <div className="crt-overlay"></div>
            <Header />
            <ImageViewer />
            <main 
                style={{ 
                    padding: '60px 0'
                }}
                className="blog-main"
            >
                <div className="blog-content-wrapper">
                    <TOC contentRef={contentRef} />
                    <div className="blog-article-container">
                        <Container>
                            <Card style={{ padding: '40px', backgroundColor: 'var(--bg-secondary)' }}>
                                {metadata && (
                                    <div style={{ marginBottom: '30px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
                                        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{metadata.title}</h1>
                                        <div style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                                            <span>{metadata.date}</span>
                                            {metadata.categories && <span style={{ marginLeft: '20px' }}>Category: {metadata.categories}</span>}
                                        </div>
                                    </div>
                                )}

                                <div 
                                    ref={contentRef}
                                    className="markdown-content" 
                                    style={{ lineHeight: '1.8', fontSize: '1.1rem' }}
                                >
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeRaw]}
                                        components={{
                                            img: ({ src, alt, ...props }) => {
                                                // 处理相对路径，转换为 /posts/ 路径
                                                let imageSrc = src;
                                                if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('/')) {
                                                    imageSrc = `/posts/${src}`;
                                                }
                                                return <img src={imageSrc} alt={alt} {...props} />;
                                            }
                                        }}
                                    >
                                        {content}
                                    </ReactMarkdown>
                                </div>
                            </Card>
                        </Container>
                    </div>
                </div>
            </main>
            <Footer />

            <style>{`
        .blog-post-page .blog-main {
          width: 100%;
        }
        
        .blog-content-wrapper {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          gap: 20px;
          position: relative;
        }
        
        .blog-article-container {
          flex: 1;
          min-width: 0;
        }
        
        .blog-article-container .container {
          max-width: 100%;
          padding: 0;
        }
        
        @media (max-width: 992px) {
          .blog-content-wrapper {
            flex-direction: column;
            padding: 0 20px;
          }
        }
        
        /* 确保Card内的文本可见 - 使用黑色 */
        .blog-post-page .pixel-border {
          color: #000 !important;
        }
        
        .blog-post-page .pixel-border * {
          color: inherit;
        }
        
        .markdown-content {
          color: #000 !important;
          line-height: 1.8;
          font-size: 1.05em;
        }
        
        /* 确保所有文本元素都有正确的颜色 */
        .markdown-content p,
        .markdown-content li,
        .markdown-content td,
        .markdown-content th,
        .markdown-content strong,
        .markdown-content em,
        .markdown-content span,
        .markdown-content div {
          color: #000 !important;
        }
        
        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3,
        .markdown-content h4,
        .markdown-content h5,
        .markdown-content h6 {
          color: #000 !important;
          margin-top: 30px;
          margin-bottom: 15px;
          font-weight: 600;
          scroll-margin-top: 110px;
        }
        
        .markdown-content h1 { font-size: 2em; }
        .markdown-content h2 { font-size: 1.7em; }
        .markdown-content h3 { font-size: 1.4em; }
        .markdown-content h4 { font-size: 1.2em; }
        
        .markdown-content p {
          margin-bottom: 20px;
          color: #000 !important;
        }
        
        .markdown-content a {
          color: #4a9eff;
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color 0.3s;
        }
        
        .markdown-content a:hover {
          border-bottom-color: #4a9eff;
        }
        
        .markdown-content code {
          background: rgba(0, 0, 0, 0.05);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 0.9em;
          color: #000;
        }
        
        .markdown-content pre {
          background: #fff !important;
          padding: 20px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 20px 0;
          border: 1px solid rgba(0, 0, 0, 0.1);
          position: relative;
        }
        
        .markdown-content pre code {
          background: transparent !important;
          padding: 0 !important;
          font-size: 0.95em;
          color: #000;
          display: block;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          line-height: 1.5;
        }
        
        /* 确保highlight.js样式在白色背景上正确显示 */
        .markdown-content pre code.hljs {
          background: #fff !important;
          padding: 0 !important;
          display: block;
          overflow-x: auto;
        }
        
        /* 确保highlight.js的github主题样式正确应用 */
        .markdown-content pre .hljs {
          background: #fff !important;
          display: block;
          overflow-x: auto;
        }
        
        /* 确保代码块有正确的类名和样式 */
        .markdown-content pre code {
          background: transparent !important;
          display: block;
          overflow-x: auto;
        }
        
        /* highlight.js 语法高亮颜色 */
        .markdown-content pre code.hljs .hljs-keyword,
        .markdown-content pre code.hljs .hljs-selector-tag,
        .markdown-content pre code.hljs .hljs-literal,
        .markdown-content pre code.hljs .hljs-title,
        .markdown-content pre code.hljs .hljs-section,
        .markdown-content pre code.hljs .hljs-doctag,
        .markdown-content pre code.hljs .hljs-type,
        .markdown-content pre code.hljs .hljs-name,
        .markdown-content pre code.hljs .hljs-strong {
          font-weight: bold;
        }
        
        /* 确保代码高亮颜色可见 */
        .markdown-content pre code.hljs {
          color: #24292e;
        }
        
        .markdown-content blockquote {
          border-left: 4px solid #4a9eff;
          padding-left: 20px;
          margin: 20px 0;
          color: #000 !important;
          font-style: italic;
        }
        
        .markdown-content blockquote p {
          color: #000 !important;
        }
        
        .markdown-content ul,
        .markdown-content ol {
          margin-bottom: 20px;
          padding-left: 30px;
        }
        
        .markdown-content li {
          margin-bottom: 8px;
        }
        
        .markdown-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 20px auto;
          display: block;
          cursor: zoom-in;
          transition: all 0.3s ease;
        }
        
        .markdown-content img:hover {
          transform: scale(1.02);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
        }
        
        .markdown-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        
        .markdown-content th,
        .markdown-content td {
          border: 1px solid rgba(0, 0, 0, 0.2);
          padding: 12px;
          text-align: left;
          color: #000 !important;
        }
        
        .markdown-content th {
          background: rgba(0, 0, 0, 0.05);
          font-weight: 600;
          color: #000 !important;
        }
        
        .markdown-content hr {
          border: none;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          margin: 40px 0;
        }
      `}</style>
        </div>
    );
};

export default BlogPost;
