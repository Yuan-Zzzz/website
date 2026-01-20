import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectCoverflow, Autoplay } from 'swiper/modules';
import Container from './ui/Container';
import Card from './ui/Card';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

const GameProjects = () => {
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        fetch('/game-projects.json')
            .then(res => res.json())
            .then(data => setProjects(data.slice(0, 5)))
            .catch(err => console.error('Error loading game projects:', err));
    }, []);

    return (
        <section id="projects" style={{ padding: '60px 0', backgroundColor: 'var(--bg-secondary)' }}>
            <Container>
                <h2 className="section-title">游戏作品</h2>

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
                        delay: 3000,
                        disableOnInteraction: false,
                        pauseOnMouseEnter: true,
                    }}
                    loop={false}
                    breakpoints={{
                        320: { slidesPerView: 1, spaceBetween: 20 },
                        768: { slidesPerView: 2, spaceBetween: 30 },
                        1024: { slidesPerView: 3, spaceBetween: 40 },
                    }}
                    className="game-swiper"
                    style={{ paddingBottom: '50px' }}
                >
                    {projects.map(project => (
                        <SwiperSlide key={project.id} style={{ width: '300px' }}>
                            <a href={project.itchUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                <Card className="project-card" style={{ height: '100%', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ height: '200px', overflow: 'hidden', borderBottom: '2px solid var(--border-color)' }}>
                                        <img
                                            src={project.imageUrl}
                                            alt={project.title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                    <div style={{ padding: '20px', flex: 1, backgroundColor: 'var(--bg-color)' }}>
                                        <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}>{project.title}</h3>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>{project.description}</p>
                                    </div>
                                </Card>
                            </a>
                        </SwiperSlide>
                    ))}

                    <SwiperSlide style={{ width: '300px' }}>
                        <a href="/projects" style={{ textDecoration: 'none' }}>
                            <Card className="project-card" style={{ height: '100%', minHeight: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '3rem', color: 'var(--primary-color)', marginBottom: '20px' }}>
                                        <i className="fas fa-arrow-right"></i>
                                    </div>
                                    <h3>查看所有作品</h3>
                                </div>
                            </Card>
                        </a>
                    </SwiperSlide>
                </Swiper>
            </Container>
        </section>
    );
};

export default GameProjects;
