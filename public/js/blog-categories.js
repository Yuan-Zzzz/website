// 博客分类/标签浏览页面脚本

let allPosts = [];
let currentView = 'categories'; // 'categories' or 'tags'
let currentFilter = null; // 当前筛选的分类或标签

// 从 URL 参数获取筛选条件
function getFilterFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type'); // 'category' or 'tag'
    const value = urlParams.get('value');
    
    return { type, value };
}

// 更新 URL 参数
function updateUrl(type, value) {
    const url = new URL(window.location);
    if (type && value) {
        url.searchParams.set('type', type);
        url.searchParams.set('value', value);
    } else {
        url.searchParams.delete('type');
        url.searchParams.delete('value');
    }
    window.history.pushState({}, '', url);
}

// 加载文章列表
async function loadPosts() {
    try {
        const response = await fetch('/posts/posts-index.json');
        if (!response.ok) {
            throw new Error('无法加载文章列表');
        }
        allPosts = await response.json();
        
        // 按日期排序
        allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // 检查 URL 参数
        const { type, value } = getFilterFromUrl();
        
        if (type && value) {
            currentFilter = { type, value };
            if (type === 'category') {
                currentView = 'categories';
                showFilteredPosts('category', value);
            } else if (type === 'tag') {
                currentView = 'tags';
                showFilteredPosts('tag', value);
            }
        } else {
            // 默认显示分类云
            showTaxonomyCloud();
        }
        
        observeFadeInSections();
        
    } catch (error) {
        console.error('加载文章列表失败:', error);
        document.getElementById('taxonomy-cloud').innerHTML = 
            '<div class="error-message">加载失败，请稍后再试</div>';
    }
}

// 显示分类/标签云
function showTaxonomyCloud() {
    const cloud = document.getElementById('taxonomy-cloud');
    const postsContainer = document.getElementById('filtered-posts');
    const currentFilterDiv = document.getElementById('current-filter');
    const pageTitle = document.getElementById('page-title');
    
    cloud.style.display = 'block';
    postsContainer.style.display = 'none';
    currentFilterDiv.style.display = 'none';
    currentFilter = null;
    updateUrl(null, null);
    
    const taxonomy = {};
    
    allPosts.forEach(post => {
        const items = currentView === 'categories' ? post.categories : post.tags;
        if (items && items.length > 0) {
            items.forEach(item => {
                if (!taxonomy[item]) {
                    taxonomy[item] = 0;
                }
                taxonomy[item]++;
            });
        }
    });
    
    // 转换为数组并排序
    const sortedItems = Object.entries(taxonomy)
        .sort((a, b) => b[1] - a[1]);
    
    if (sortedItems.length === 0) {
        cloud.innerHTML = `<div class="empty-message">暂无${currentView === 'categories' ? '分类' : '标签'}</div>`;
        return;
    }
    
    pageTitle.textContent = currentView === 'categories' ? '分类浏览' : '标签浏览';
    
    // 计算字体大小（基于文章数量）
    const maxCount = Math.max(...sortedItems.map(item => item[1]));
    const minCount = Math.min(...sortedItems.map(item => item[1]));
    
    cloud.innerHTML = sortedItems.map(([name, count]) => {
        // 根据文章数量计算字体大小 (1em - 2em)
        const fontSize = minCount === maxCount ? 1.2 : 
            1 + (count - minCount) / (maxCount - minCount);
        
        const icon = currentView === 'categories' ? 'fa-folder' : 'fa-tag';
        
        return `
            <button class="taxonomy-item" 
                    data-type="${currentView === 'categories' ? 'category' : 'tag'}" 
                    data-value="${escapeHtml(name)}"
                    style="font-size: ${fontSize}em">
                <i class="fas ${icon}"></i>
                <span class="taxonomy-name">${escapeHtml(name)}</span>
                <span class="taxonomy-count">(${count})</span>
            </button>
        `;
    }).join('');
    
    // 添加点击事件
    cloud.querySelectorAll('.taxonomy-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const type = item.dataset.type;
            const value = item.dataset.value;
            showFilteredPosts(type, value);
        });
    });
}

// 显示筛选后的文章
function showFilteredPosts(type, value) {
    const cloud = document.getElementById('taxonomy-cloud');
    const postsContainer = document.getElementById('filtered-posts');
    const currentFilterDiv = document.getElementById('current-filter');
    const pageTitle = document.getElementById('page-title');
    
    cloud.style.display = 'none';
    postsContainer.style.display = 'grid';
    currentFilterDiv.style.display = 'block';
    
    currentFilter = { type, value };
    updateUrl(type, value);
    
    const icon = type === 'category' ? 'fa-folder' : 'fa-tag';
    const typeName = type === 'category' ? '分类' : '标签';
    
    pageTitle.textContent = `${typeName}: ${value}`;
    
    currentFilterDiv.innerHTML = `
        <div class="filter-info">
            <i class="fas ${icon}"></i>
            <span>当前${typeName}: <strong>${escapeHtml(value)}</strong></span>
            <button class="clear-filter" onclick="clearFilter()">
                <i class="fas fa-times"></i> 清除筛选
            </button>
        </div>
    `;
    
    // 筛选文章
    const filteredPosts = allPosts.filter(post => {
        const items = type === 'category' ? post.categories : post.tags;
        return items && items.includes(value);
    });
    
    if (filteredPosts.length === 0) {
        postsContainer.innerHTML = '<div class="empty-message">该分类下暂无文章</div>';
        return;
    }
    
    postsContainer.innerHTML = filteredPosts.map(post => {
        let tagsHtml = '';
        if (post.tags && post.tags.length > 0) {
            tagsHtml = post.tags.map(tag => 
                `<span class="tag clickable" data-type="tag" data-value="${escapeHtml(tag)}" onclick="event.preventDefault(); event.stopPropagation();">
                    <i class="fas fa-tag"></i> ${escapeHtml(tag)}
                </span>`
            ).join('');
        }
        
        let categoriesHtml = '';
        if (post.categories && post.categories.length > 0) {
            categoriesHtml = post.categories.map(cat => 
                `<span class="category clickable" data-type="category" data-value="${escapeHtml(cat)}" onclick="event.preventDefault(); event.stopPropagation();">
                    <i class="fas fa-folder"></i> ${escapeHtml(cat)}
                </span>`
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
    postsContainer.querySelectorAll('.tag.clickable, .category.clickable').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const type = item.dataset.type;
            const value = item.dataset.value;
            showFilteredPosts(type, value);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// 清除筛选
function clearFilter() {
    showTaxonomyCloud();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 切换视图
function switchView(view) {
    if (currentView === view) return;
    
    currentView = view;
    const categoriesBtn = document.getElementById('categoriesBtn');
    const tagsBtn = document.getElementById('tagsBtn');
    
    if (view === 'categories') {
        categoriesBtn.classList.add('active');
        tagsBtn.classList.remove('active');
    } else {
        tagsBtn.classList.add('active');
        categoriesBtn.classList.remove('active');
    }
    
    showTaxonomyCloud();
}

// 工具函数
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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

// 初始化
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
    
    // 检查 URL 参数来确定初始视图
    const { type } = getFilterFromUrl();
    if (type === 'tag') {
        currentView = 'tags';
        document.getElementById('tagsBtn').classList.add('active');
        document.getElementById('categoriesBtn').classList.remove('active');
    }
    
    loadPosts();
    
    // 添加按钮事件
    document.getElementById('categoriesBtn').addEventListener('click', () => switchView('categories'));
    document.getElementById('tagsBtn').addEventListener('click', () => switchView('tags'));
});
