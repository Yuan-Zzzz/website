import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Container from '../components/ui/Container';
import Card from '../components/ui/Card';
import 'highlight.js/styles/atom-one-dark.css'; // Import highlight.js style

const BlogPost = () => {
    const { slug } = useParams();
    const [content, setContent] = useState('');
    const [metadata, setMetadata] = useState(null);

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
            <main style={{ padding: '60px 0' }}>
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

                        <div className="markdown-content" style={{ lineHeight: '1.8', fontSize: '1.1rem' }}>
                            <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeHighlight]}>
                                {content}
                            </ReactMarkdown>
                        </div>
                    </Card>
                </Container>
            </main>
            <Footer />

            <style>{`
        .markdown-content h1, .markdown-content h2, .markdown-content h3 {
          margin-top: 1.5em;
          color: var(--primary-color);
        }
        .markdown-content p {
          margin-bottom: 1em;
        }
        .markdown-content a {
          color: var(--secondary-color);
        }
        .markdown-content pre {
          background-color: #16171d;
          padding: 15px;
          border-radius: 0;
          overflow-x: auto;
          border: 2px solid var(--border-color);
          box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 0.3);
        }
        .markdown-content code {
          font-family: 'Consolas', 'Courier New', monospace;
          background-color: rgba(22, 23, 29, 0.5);
          padding: 2px 6px;
          border-radius: 0;
        }
        .markdown-content pre code {
          background-color: transparent;
          padding: 0;
        }
        .markdown-content img {
          max-width: 100%;
          border: 2px solid var(--border-color);
          box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 0.3);
        }
        .markdown-content blockquote {
          border-left: 4px solid var(--primary-color);
          margin: 0;
          padding-left: 20px;
          color: var(--text-dim);
        }
      `}</style>
        </div>
    );
};

export default BlogPost;
