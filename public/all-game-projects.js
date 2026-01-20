document.addEventListener('DOMContentLoaded', () => {
    // 移动端汉堡菜单功能
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('header nav');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenuToggle.classList.toggle('active');
            nav.classList.toggle('active');
        });
        
        // 点击页面其他地方关闭菜单
        document.addEventListener('click', (e) => {
            if (!e.target.closest('header')) {
                mobileMenuToggle.classList.remove('active');
                nav.classList.remove('active');
            }
        });
    }
    
    // 加载游戏项目
    fetch('game-projects.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(projects => {
            const grid = document.querySelector('.all-game-projects-grid');
            if (grid) {
                projects.forEach((project, index) => {
                    const card = document.createElement('a');
                    card.href = project.link;
                    card.target = '_blank'; // Open in a new tab
                    card.className = 'game-project-card';
                    // Apply animation delay for staggered effect
                    card.style.animationDelay = `${index * 100}ms`;

                    card.innerHTML = `
                        <div class="game-project-card__image-container">
                            <img src="${project.imageUrl}" alt="${project.title}">
                        </div>
                        <div class="game-project-card__content">
                            <h3>${project.title}</h3>
                            <p>${project.description}</p>
                        </div>
                    `;
                    grid.appendChild(card);
                });
            }
        })
        .catch(error => console.error('Error loading projects:', error));
});