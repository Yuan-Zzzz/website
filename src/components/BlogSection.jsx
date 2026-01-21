import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectCoverflow, Autoplay } from 'swiper/modules';
import Container from './ui/Container';
import Card from './ui/Card';
import { Link } from 'react-router-dom';

const BlogSection = () => {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        fetch('/posts/posts-index.json')
            .then(res => res.json())
            .then(data => {
                // Sort by date descending
                const sorted = data.sort((a, b) => new Date(b.date) - new Date(a.date));
                setPosts(sorted.slice(0, 5));
            })
            .catch(err => console.error('Error loading blog posts:', err));
    }, []);

    return (
        <section id="blog" style={{ padding: '60px 0' }}>
            <Container>
                <h2 className="section-title">博客</h2>

                <Swiper
                    modules={[Navigation, Pagination, EffectCoverflow, Autoplay]}
                    effect={'coverflow'}
                    grabCursor={true}
                    centeredSlides={true}
                    slidesPerView={'auto'}
                    coverflowEffect={{
                        rotate: 5,
                        stretch: 0,
                        depth: 100,
                        modifier: 1,
                        slideShadows: true,
                    }}
                    pagination={{ clickable: true }}
                    navigation={false}
                    autoplay={{
                        delay: 3500,
                        disableOnInteraction: false,
                        pauseOnMouseEnter: true,
                    }}
                    loop={false}
                    breakpoints={{
                        320: { slidesPerView: 1, spaceBetween: 20 },
                        768: { slidesPerView: 2, spaceBetween: 30 },
                        1024: { slidesPerView: 3, spaceBetween: 40 },
                    }}
                    className="blog-swiper"
                    style={{ paddingBottom: '50px' }}
                >
                    {posts.map(post => (
                        <SwiperSlide key={post.filename} style={{ width: '300px' }}>
                            <Link to={`/blog/${post.filename.replace('.md', '')}`} style={{ textDecoration: 'none' }}>
                                <Card className="blog-card" style={{ height: '100%', minHeight: '350px', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-secondary)' }}>
                                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <div className="blog-time-badge" style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '0.8rem',
                                            color: 'var(--primary-color)',
                                            marginBottom: '15px',
                                            padding: '5px 10px',
                                            backgroundColor: 'var(--bg-color)',
                                            border: '2px solid var(--primary-color)',
                                            fontFamily: 'var(--font-mono)',
                                            width: 'fit-content',
                                            boxShadow: '2px 2px 0px 0px var(--primary-color)',
                                            transition: 'all 0.2s ease'
                                        }}>
                                            <i className="fas fa-calendar-alt" style={{ fontSize: '0.7rem' }}></i>
                                            <span>{post.date}</span>
                                        </div>
                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: 'var(--text-color)' }}>{post.title}</h3>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', flex: 1 }}>{post.excerpt}</p>
                                        {post.tags && post.tags.length > 0 && (
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '15px', marginBottom: '10px' }}>
                                                {post.tags.map(tag => (
                                                    <span key={tag} style={{
                                                        fontSize: '0.75rem',
                                                        padding: '2px 8px',
                                                        border: '1px solid var(--secondary-color)',
                                                        color: 'var(--secondary-color)'
                                                    }}>
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <span style={{ color: 'var(--secondary-color)', marginTop: 'auto', display: 'inline-block' }}>阅读更多 →</span>
                                    </div>
                                </Card>
                            </Link>
                        </SwiperSlide>
                    ))}

                    <SwiperSlide style={{ width: '300px' }}>
                        <Link to="/blog" style={{ textDecoration: 'none' }}>
                            <Card className="blog-card" style={{ height: '100%', minHeight: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-secondary)' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '3rem', color: 'var(--secondary-color)', marginBottom: '20px' }}>
                                        <i className="fas fa-arrow-right"></i>
                                    </div>
                                    <h3>查看所有博客</h3>
                                </div>
                            </Card>
                        </Link>
                    </SwiperSlide>
                </Swiper>
            </Container>
        </section>
    );
};

export default BlogSection;
