import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Container from '../components/ui/Container';
import Card from '../components/ui/Card';

const BlogList = () => {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        fetch('/posts/posts-index.json')
            .then(res => res.json())
            .then(data => {
                const sorted = data.sort((a, b) => new Date(b.date) - new Date(a.date));
                setPosts(sorted);
            })
            .catch(err => console.error('Error loading blog posts:', err));
    }, []);

    return (
        <div className="blog-list-page">
            <div className="crt-overlay"></div>
            <Header />
            <main style={{ padding: '60px 0' }}>
                <Container>
                    <h1 className="section-title">所有文章</h1>

                    {/* Blog Posts Grid */}
                    <div style={{ display: 'grid', gap: '30px' }}>
                        {posts.length > 0 ? (
                            posts.map(post => (
                                <Link key={post.filename} to={`/blog/${post.filename.replace('.md', '')}`} style={{ textDecoration: 'none' }}>
                                    <Card className="blog-list-card" variant="default" style={{ transition: 'transform 0.2s', cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-color)' }}>{post.title}</h2>
                                            <span style={{ color: 'var(--primary-color)', fontFamily: 'var(--font-mono)' }}>{post.date}</span>
                                        </div>
                                        <p style={{ color: 'var(--text-dim)', marginBottom: '20px' }}>{post.excerpt}</p>
                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                            {post.tags && post.tags.map(tag => (
                                                <span key={tag} style={{
                                                    fontSize: '0.8rem',
                                                    padding: '2px 8px',
                                                    border: '1px solid var(--secondary-color)',
                                                    color: 'var(--secondary-color)'
                                                }}>
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </Card>
                                </Link>
                            ))
                        ) : (
                            <Card style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-secondary)' }}>
                                <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem' }}>没有找到匹配的文章</p>
                            </Card>
                        )}
                    </div>
                </Container>
            </main>
            <Footer />
        </div>
    );
};

export default BlogList;
