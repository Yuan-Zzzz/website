// 博客列表页面脚本

// 全局变量
let blogSearch = null;
let allPosts = [];

// 扫描 posts 文件夹中的所有 markdown 文件
async function loadPostsList() {
    const postsContainer = document.getElementById('posts-container');
    
    try {
        // 获取 posts 目录下的所有 .md 文件
        const response = await fetch('/posts/posts-index.json');
        
        if (!response.ok) {
            throw new Error('无法加载文章列表');
        }
        
        const posts = await response.json();
        
        if (posts.length === 0) {
            postsContainer.innerHTML = '<div class="error-message">暂无文章</div>';
            return;
        }
        
        // 按日期排序（最新的在前面）
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // 保存所有文章到全局变量
        allPosts = posts;
        
        // 初始化搜索功能
        if (blogSearch) {
            await blogSearch.loadPosts(posts);
        }        // 渲染文章列表
        renderPostsList(posts);
        
        // 添加淡入动画
        observeFadeInSections();
        
    } catch (error) {
        console.error('加载文章列表失败:', error);
        postsContainer.innerHTML = '<div class="error-message">加载文章列表失败，请稍后再试</div>';
    }
}

// 渲染文章列表的独立函数
function renderPostsList(posts) {
    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer) return;
    
    if (posts.length === 0) {
        postsContainer.innerHTML = '<div class="error-message">暂无文章</div>';
        return;
    }
    
    // 渲染文章卡片
    postsContainer.innerHTML = posts.map(post => {
                    // 构建 tags 和 categories HTML
                    let tagsHtml = '';
                    if (post.tags && post.tags.length > 0) {
                        tagsHtml = post.tags.map(tag => 
                            `<span class="tag clickable" data-type="tag" data-value="${escapeHtml(tag)}"><i class="fas fa-tag"></i> ${escapeHtml(tag)}</span>`
                        ).join('');
                    }
                    
                    let categoriesHtml = '';
                    if (post.categories && post.categories.length > 0) {
                        categoriesHtml = post.categories.map(cat => 
                            `<span class="category clickable" data-type="category" data-value="${escapeHtml(cat)}"><i class="fas fa-folder"></i> ${escapeHtml(cat)}</span>`
                        ).join('');
                    }
                    
                    return `
                        <div class="post-card-wrapper">
                            <a href="/blog-post.html?post=${encodeURIComponent(post.filename)}" class="post-card">
                                <h2>${escapeHtml(post.title)}</h2>
                                <div class="post-meta">
                                    <span><i class="fas fa-calendar"></i> ${formatDate(post.date)}</span>
                                </div>
                                ${categoriesHtml || tagsHtml ? `<div class="post-tags">${categoriesHtml}${tagsHtml}</div>` : ''}
                                <div class="post-excerpt">${escapeHtml(post.excerpt)}</div>
                                <span class="read-more">阅读全文 →</span>
                            </a>
                        </div>
                    `;
    }).join('');
    
    // 为标签和分类添加点击事件
    bindTagCategoryEvents();
}

// 绑定标签和分类点击事件的函数
function bindTagCategoryEvents() {
    const postsContainer = document.getElementById('posts-container');
    postsContainer?.querySelectorAll('.tag.clickable, .category.clickable').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const type = item.dataset.type;
            const value = item.dataset.value;
            window.location.href = `/blog-categories.html?type=${type}&value=${encodeURIComponent(value)}`;
        });
    });
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 淡入动画观察器
function observeFadeInSections() {
    const sections = document.querySelectorAll('.fade-in-section');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });
    
    sections.forEach(section => observer.observe(section));
}

// 页面加载时执行
document.addEventListener('DOMContentLoaded', async () => {
    // 初始化搜索功能
    blogSearch = new BlogSearch();
    
    // 重写搜索类的showAllPosts方法
    blogSearch.showAllPosts = () => {
        renderPostsList(allPosts);
        observeFadeInSections();
    };
    
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
    
    // 加载文章列表
    await loadPostsList();
});
