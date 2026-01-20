// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
    // 移动端汉堡菜单切换功能
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('header nav');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenuToggle.classList.toggle('active');
            nav.classList.toggle('active');
        });
        
        // 点击导航链接后关闭菜单
        const navLinks = document.querySelectorAll('header nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuToggle.classList.remove('active');
                nav.classList.remove('active');
            });
        });
        
        // 点击页面其他地方关闭菜单
        document.addEventListener('click', (e) => {
            if (!e.target.closest('header')) {
                mobileMenuToggle.classList.remove('active');
                nav.classList.remove('active');
            }
        });
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Fade-in sections on scroll
    const fadeInSections = document.querySelectorAll('.fade-in-section');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.6
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                entry.target.classList.remove('visible');
            }
        });
    }, observerOptions);

    fadeInSections.forEach(section => {
        observer.observe(section);
    });

    // Initialize Swiper and load game projects
    const swiperWrapper = document.querySelector('#game-projects .swiper-wrapper');

    fetch('game-projects.json')
        .then(response => response.json())
        .then(projects => {
            const projectsToShow = projects.slice(0, 5);
            projectsToShow.forEach(project => {
                const slide = document.createElement('div');
                slide.classList.add('swiper-slide');
                slide.innerHTML = `
                    <a href="${project.itchUrl}" target="_blank" class="game-project-card">
                        <div class="game-project-card__image-container">
                            <img src="${project.imageUrl}" alt="${project.title}">
                        </div>
                        <div class="game-project-card__content">
                            <h3>${project.title}</h3>
                            <p>${project.description}</p>
                        </div>
                    </a>
                `;
                swiperWrapper.appendChild(slide);
            });

            // Add "Show All" card
            const showAllSlide = document.createElement('div');
            showAllSlide.classList.add('swiper-slide');
            showAllSlide.innerHTML = `
                <a href="all-game-projects.html" class="game-project-card game-project-card--show-all">
                    <div class="game-project-card__image-container">
                        <i class="fas fa-arrow-right"></i>
                    </div>
                    <div class="game-project-card__content">
                        <h3>查看所有作品</h3>
                    </div>
                </a>
            `;
            swiperWrapper.appendChild(showAllSlide);

            // Initialize Swiper after content is loaded
            new Swiper('#game-projects .swiper', {
                slidesPerView: 1,
                spaceBetween: 20,
                loop: false,
                grabCursor: true,
                centeredSlides: true,
                slideToClickedSlide: true,
                effect: 'coverflow',
                coverflowEffect: {
                    rotate: 5,
                    stretch: -5,
                    depth: 200,
                    modifier: 1,
                    slideShadows: true,
                },
                autoplay: {
                    delay: 3000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                },
                pagination: {
                    el: '#game-projects .swiper-pagination',
                    clickable: true,
                    dynamicBullets: true,
                },
                navigation: {
                    nextEl: '#game-projects .swiper-button-next',
                    prevEl: '#game-projects .swiper-button-prev',
                },
                breakpoints: {
                    // 小手机 (< 480px)
                    320: {
                        slidesPerView: 1,
                        spaceBetween: 15,
                        effect: 'slide', // 移动端使用简单滑动效果
                        coverflowEffect: {
                            rotate: 0,
                            stretch: 0,
                            depth: 0,
                            modifier: 1,
                            slideShadows: false,
                        },
                    },
                    // 大手机和小平板 (480px - 768px)
                    480: {
                        slidesPerView: 1,
                        spaceBetween: 20,
                        effect: 'slide',
                        coverflowEffect: {
                            rotate: 0,
                            stretch: 0,
                            depth: 0,
                            modifier: 1,
                            slideShadows: false,
                        },
                    },
                    // 平板 (768px - 1024px)
                    768: {
                        slidesPerView: 2,
                        spaceBetween: 25,
                        effect: 'coverflow',
                    },
                    // 桌面 (> 1024px)
                    1024: {
                        slidesPerView: 3,
                        spaceBetween: 30,
                        effect: 'coverflow',
                    },
                },
                // 触摸优化
                touchRatio: 1,
                touchAngle: 45,
                threshold: 10,
                resistanceRatio: 0.85,
                // 性能优化
                observer: true,
                observeParents: true,
            });
        })
        .catch(error => console.error('Error loading game projects:', error));

    // Load and display blog posts
    const blogSwiperWrapper = document.querySelector('#blog-posts .swiper-wrapper');
    
    if (blogSwiperWrapper) {
        fetch('posts/posts-index.json')
            .then(response => response.json())
            .then(posts => {
                // Sort by date (newest first) and get top 5
                const sortedPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
                const postsToShow = sortedPosts.slice(0, 5);
                
                postsToShow.forEach(post => {
                    const slide = document.createElement('div');
                    slide.classList.add('swiper-slide');
                    
                    // Format date
                    const date = new Date(post.date);
                    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    
                    slide.innerHTML = `
                        <a href="/blog-post.html?post=${encodeURIComponent(post.filename)}" class="blog-post-card">
                            <div class="blog-post-card__image-container">
                                <div class="blog-post-card__image-content">
                                    <div class="blog-post-card__date">
                                        <i class="fas fa-calendar"></i> ${formattedDate}
                                    </div>
                                    <h3>${escapeHtml(post.title)}</h3>
                                </div>
                            </div>
                            <div class="blog-post-card__content">
                                <p class="blog-post-card__excerpt">${escapeHtml(post.excerpt)}</p>
                                <span class="blog-post-card__read-more">阅读更多 →</span>
                            </div>
                        </a>
                    `;
                    blogSwiperWrapper.appendChild(slide);
                });

                // Add "Show All" card
                const showAllSlide = document.createElement('div');
                showAllSlide.classList.add('swiper-slide');
                showAllSlide.innerHTML = `
                    <a href="/blog.html" class="blog-post-card blog-post-card--show-all">
                        <div class="blog-post-card__image-container">
                            <i class="fas fa-arrow-right"></i>
                        </div>
                        <div class="blog-post-card__content">
                            <h3>查看所有博客</h3>
                        </div>
                    </a>
                `;
                blogSwiperWrapper.appendChild(showAllSlide);

                // Initialize Blog Swiper after content is loaded
                new Swiper('#blog-posts .swiper', {
                    slidesPerView: 1,
                    spaceBetween: 20,
                    loop: false,
                    grabCursor: true,
                    centeredSlides: true,
                    slideToClickedSlide: true,
                    effect: 'coverflow',
                    coverflowEffect: {
                        rotate: 5,
                        stretch: -5,
                        depth: 200,
                        modifier: 1,
                        slideShadows: true,
                    },
                    autoplay: {
                        delay: 3500,
                        disableOnInteraction: false,
                        pauseOnMouseEnter: true,
                    },
                    pagination: {
                        el: '#blog-posts .swiper-pagination',
                        clickable: true,
                        dynamicBullets: true,
                    },
                    navigation: {
                        nextEl: '#blog-posts .swiper-button-next',
                        prevEl: '#blog-posts .swiper-button-prev',
                    },
                    breakpoints: {
                        // 小手机 (< 480px)
                        320: {
                            slidesPerView: 1,
                            spaceBetween: 15,
                            effect: 'slide', // 移动端使用简单滑动效果
                            coverflowEffect: {
                                rotate: 0,
                                stretch: 0,
                                depth: 0,
                                modifier: 1,
                                slideShadows: false,
                            },
                        },
                        // 大手机和小平板 (480px - 768px)
                        480: {
                            slidesPerView: 1,
                            spaceBetween: 20,
                            effect: 'slide',
                            coverflowEffect: {
                                rotate: 0,
                                stretch: 0,
                                depth: 0,
                                modifier: 1,
                                slideShadows: false,
                            },
                        },
                        // 平板 (768px - 1024px)
                        768: {
                            slidesPerView: 2,
                            spaceBetween: 25,
                            effect: 'coverflow',
                        },
                        // 桌面 (> 1024px)
                        1024: {
                            slidesPerView: 3,
                            spaceBetween: 30,
                            effect: 'coverflow',
                        },
                    },
                    // 触摸优化
                    touchRatio: 1,
                    touchAngle: 45,
                    threshold: 10,
                    resistanceRatio: 0.85,
                    // 性能优化
                    observer: true,
                    observeParents: true,
                });
            })
            .catch(error => console.error('Error loading blog posts:', error));
    }
    
    // 初始化 GitHub 贡献热力图
    const contributionGraphElement = document.getElementById('contribution-graph');
    if (contributionGraphElement) {
        // 使用配置文件中的设置
        const config = typeof GITHUB_CONFIG !== 'undefined' ? GITHUB_CONFIG : {
            username: 'Yuan-Zzzz',
            token: null,
            includePrivate: false
        };
        
        const githubContributions = new GitHubContributions(
            config.username, 
            'contribution-graph',
            {
                token: config.token,
                includePrivate: config.includePrivate
            }
        );
        githubContributions.init();
    }

    // 初始化开源项目展示
    const opensourceProjectsElement = document.getElementById('opensource-projects-grid');
    if (opensourceProjectsElement) {
        const opensourceProjects = new OpenSourceProjects(
            'opensource-projects-grid',
            '/js/opensource-projects.json'
        );
        opensourceProjects.init();
    }
    
});
