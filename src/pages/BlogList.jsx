import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Container from '../components/ui/Container';
import Card from '../components/ui/Card';

const BlogList = () => {
    const [posts, setPosts] = useState([]);
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [allTags, setAllTags] = useState([]);
    const [allCategories, setAllCategories] = useState([]);

    useEffect(() => {
        fetch('/posts/posts-index.json')
            .then(res => res.json())
            .then(data => {
                const sorted = data.sort((a, b) => new Date(b.date) - new Date(a.date));
                setPosts(sorted);
                setFilteredPosts(sorted);

                // Extract all unique tags
                const tagsSet = new Set();
                const categoriesSet = new Set();
                sorted.forEach(post => {
                    if (post.tags) {
                        post.tags.forEach(tag => tagsSet.add(tag));
                    }
                    if (post.categories) {
                        post.categories.forEach(cat => categoriesSet.add(cat));
                    }
                });
                setAllTags(Array.from(tagsSet).sort());
                setAllCategories(Array.from(categoriesSet).sort());
            })
            .catch(err => console.error('Error loading blog posts:', err));
    }, []);

    // Filter posts whenever search query, tags, or category changes
    useEffect(() => {
        let filtered = posts;

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(post =>
                post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by selected tags (posts must have ALL selected tags)
        if (selectedTags.length > 0) {
            filtered = filtered.filter(post =>
                selectedTags.every(tag => post.tags && post.tags.includes(tag))
            );
        }

        // Filter by selected category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(post =>
                post.categories && post.categories.includes(selectedCategory)
            );
        }

        setFilteredPosts(filtered);
    }, [searchQuery, selectedTags, selectedCategory, posts]);

    const toggleTag = (tag) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    return (
        <div className="blog-list-page">
            <div className="crt-overlay"></div>
            <Header />
            <main style={{ padding: '60px 0' }}>
                <Container>
                    <h1 className="section-title">所有文章</h1>

                    {/* Search and Filter Section */}
                    <Card style={{ padding: '30px', marginBottom: '40px', backgroundColor: 'var(--bg-secondary)' }}>
                        {/* Search Bar */}
                        <div style={{ marginBottom: '20px' }}>
                            <input
                                type="text"
                                placeholder="搜索文章标题或内容..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 15px',
                                    fontSize: '1rem',
                                    fontFamily: 'var(--font-mono)',
                                    backgroundColor: 'var(--bg-color)',
                                    color: 'var(--text-color)',
                                    border: '2px solid var(--border-color)',
                                    borderRadius: '0',
                                    outline: 'none',
                                    boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 0.3)',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                            />
                        </div>

                        {/* Category Filter */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                                分类筛选:
                            </label>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button
                                    className={`pixel-btn ${selectedCategory === 'all' ? '' : 'pixel-btn--secondary'}`}
                                    onClick={() => setSelectedCategory('all')}
                                    style={{
                                        backgroundColor: selectedCategory === 'all' ? 'var(--primary-color)' : 'var(--bg-secondary)',
                                        color: selectedCategory === 'all' ? 'var(--bg-color)' : 'var(--primary-color)'
                                    }}
                                >
                                    全部
                                </button>
                                {allCategories.map(category => (
                                    <button
                                        key={category}
                                        className={`pixel-btn ${selectedCategory === category ? '' : 'pixel-btn--secondary'}`}
                                        onClick={() => setSelectedCategory(category)}
                                        style={{
                                            backgroundColor: selectedCategory === category ? 'var(--primary-color)' : 'var(--bg-secondary)',
                                            color: selectedCategory === category ? 'var(--bg-color)' : 'var(--primary-color)'
                                        }}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tag Filter */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                                标签筛选 (可多选):
                            </label>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                {allTags.map(tag => (
                                    <button
                                        key={tag}
                                        className="pixel-btn pixel-btn--secondary"
                                        onClick={() => toggleTag(tag)}
                                        style={{
                                            backgroundColor: selectedTags.includes(tag) ? 'var(--secondary-color)' : 'var(--bg-secondary)',
                                            color: selectedTags.includes(tag) ? 'var(--bg-color)' : 'var(--secondary-color)'
                                        }}
                                    >
                                        #{tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Result count */}
                        <div style={{ marginTop: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                            找到 {filteredPosts.length} 篇文章
                        </div>
                    </Card>

                    {/* Blog Posts Grid */}
                    <div style={{ display: 'grid', gap: '30px' }}>
                        {filteredPosts.length > 0 ? (
                            filteredPosts.map(post => (
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
