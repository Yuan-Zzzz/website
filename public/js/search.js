// 搜索功能模块

class BlogSearch {
    constructor() {
        this.posts = [];
        this.postsContent = new Map(); // 存储文章内容
        this.filteredPosts = [];
        this.currentFilter = 'all';
        this.currentQuery = '';
        
        this.initializeElements();
        this.bindEvents();
        this.initializeKeyboardShortcuts();
        this.initializeSuggestions();
    }
    
    initializeElements() {
        this.searchInput = document.getElementById('search-input');
        this.searchBtn = document.getElementById('search-btn');
        this.clearBtn = document.getElementById('clear-search');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.resultsInfo = document.getElementById('search-results-info');
        this.postsContainer = document.getElementById('posts-container');
    }
    
    bindEvents() {
        // 搜索按钮点击事件
        this.searchBtn?.addEventListener('click', () => this.performSearch());
        
        // 回车键搜索
        this.searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });
        
        // 实时搜索（输入时延迟搜索）
        let searchTimeout;
        this.searchInput?.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.performSearch();
            }, 300);
        });
        
        // 清除搜索
        this.clearBtn?.addEventListener('click', () => this.clearSearch());
        
        // 过滤器切换
        this.filterBtns?.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setActiveFilter(btn.dataset.filter);
                this.performSearch();
            });
        });
    }
    
    setActiveFilter(filter) {
        this.currentFilter = filter;
        this.filterBtns?.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
    }
    
    async loadPosts(posts) {
        this.posts = posts;
        // 预加载所有文章内容用于搜索
        await this.preloadPostsContent();
    }
    
    async preloadPostsContent() {
        const loadPromises = this.posts.map(async (post) => {
            try {
                const response = await fetch(`/posts/${post.filename}`);
                if (response.ok) {
                    const content = await response.text();
                    // 移除 frontmatter 和 markdown 标记，只保留纯文本内容
                    const cleanContent = this.extractTextContent(content);
                    this.postsContent.set(post.filename, cleanContent);
                }
            } catch (error) {
                console.warn(`无法加载文章内容: ${post.filename}`, error);
                this.postsContent.set(post.filename, '');
            }
        });
        
        await Promise.all(loadPromises);
    }
    
    extractTextContent(markdown) {
        // 移除 frontmatter
        let content = markdown.replace(/^---[\s\S]*?---\n/, '');
        
        // 移除 markdown 语法
        content = content
            .replace(/```[\s\S]*?```/g, '') // 代码块
            .replace(/`[^`]+`/g, '') // 行内代码
            .replace(/!\[.*?\]\(.*?\)/g, '') // 图片
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 链接
            .replace(/#{1,6}\s/g, '') // 标题
            .replace(/\*\*(.*?)\*\*/g, '$1') // 粗体
            .replace(/\*(.*?)\*/g, '$1') // 斜体
            .replace(/^\s*[-*+]\s/gm, '') // 列表项
            .replace(/^\s*\d+\.\s/gm, '') // 有序列表
            .replace(/^\s*>\s/gm, '') // 引用
            .replace(/\n{2,}/g, '\n') // 多个换行符
            .trim();
            
        return content;
    }
    
    performSearch() {
        const query = this.searchInput?.value?.trim() || '';
        this.currentQuery = query;
        
        if (query === '') {
            this.showAllPosts();
            return;
        }
        
        const results = this.searchPosts(query, this.currentFilter);
        this.displaySearchResults(results, query);
        this.updateSearchInfo(results.length, query);
        
        // 显示清除按钮
        if (this.clearBtn) {
            this.clearBtn.style.display = query ? 'flex' : 'none';
        }
    }
    
    searchPosts(query, filter) {
        const queryLower = query.toLowerCase();
        const results = [];
        
        for (const post of this.posts) {
            const matches = this.checkPostMatch(post, queryLower, filter);
            if (matches.isMatch) {
                results.push({
                    post: post,
                    matches: matches,
                    relevanceScore: this.calculateRelevanceScore(post, matches, queryLower)
                });
            }
        }
        
        // 按相关性排序
        return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    
    checkPostMatch(post, queryLower, filter) {
        const matches = {
            isMatch: false,
            title: false,
            content: false,
            tags: [],
            categories: [],
            excerpt: false
        };
        
        // 标题匹配
        if ((filter === 'all' || filter === 'title') && 
            post.title.toLowerCase().includes(queryLower)) {
            matches.title = true;
            matches.isMatch = true;
        }
        
        // 摘要匹配
        if ((filter === 'all' || filter === 'content') && 
            post.excerpt && post.excerpt.toLowerCase().includes(queryLower)) {
            matches.excerpt = true;
            matches.isMatch = true;
        }
        
        // 内容匹配
        if ((filter === 'all' || filter === 'content')) {
            const content = this.postsContent.get(post.filename) || '';
            if (content.toLowerCase().includes(queryLower)) {
                matches.content = true;
                matches.isMatch = true;
            }
        }
        
        // 标签匹配
        if ((filter === 'all' || filter === 'tag') && post.tags) {
            const matchingTags = post.tags.filter(tag => 
                tag.toLowerCase().includes(queryLower)
            );
            if (matchingTags.length > 0) {
                matches.tags = matchingTags;
                matches.isMatch = true;
            }
        }
        
        // 分类匹配
        if ((filter === 'all' || filter === 'category') && post.categories) {
            const matchingCategories = post.categories.filter(category => 
                category.toLowerCase().includes(queryLower)
            );
            if (matchingCategories.length > 0) {
                matches.categories = matchingCategories;
                matches.isMatch = true;
            }
        }
        
        return matches;
    }
    
    calculateRelevanceScore(post, matches, query) {
        let score = 0;
        
        // 标题匹配权重最高
        if (matches.title) {
            score += 100;
            // 完全匹配额外加分
            if (post.title.toLowerCase() === query) {
                score += 50;
            }
        }
        
        // 标签匹配
        if (matches.tags.length > 0) {
            score += matches.tags.length * 30;
            // 完全匹配的标签额外加分
            matches.tags.forEach(tag => {
                if (tag.toLowerCase() === query) {
                    score += 20;
                }
            });
        }
        
        // 分类匹配
        if (matches.categories.length > 0) {
            score += matches.categories.length * 25;
        }
        
        // 摘要匹配
        if (matches.excerpt) {
            score += 15;
        }
        
        // 内容匹配
        if (matches.content) {
            score += 10;
        }
        
        // 根据日期给予轻微的新鲜度加分
        const postDate = new Date(post.date);
        const daysSincePost = (Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSincePost < 30) {
            score += 5; // 最近30天的文章
        }
        
        return score;
    }
    
    highlightText(text, query) {
        if (!query || !text) return text;
        
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }
    
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    displaySearchResults(results, query) {
        if (!this.postsContainer) return;
        
        if (results.length === 0) {
            this.postsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search" style="font-size: 3em; color: rgba(255,255,255,0.3); margin-bottom: 20px;"></i>
                    <h3>未找到相关文章</h3>
                    <p>尝试使用其他关键词或调整搜索过滤器</p>
                </div>
            `;
            return;
        }
        
        this.postsContainer.innerHTML = results.map(result => {
            const post = result.post;
            const matches = result.matches;
            
            // 高亮处理
            const highlightedTitle = this.highlightText(post.title, query);
            const highlightedExcerpt = this.highlightText(post.excerpt, query);
            
            // 构建标签HTML（高亮匹配的标签）
            let tagsHtml = '';
            if (post.tags && post.tags.length > 0) {
                tagsHtml = post.tags.map(tag => {
                    const isMatching = matches.tags.includes(tag);
                    const highlightedTag = isMatching ? this.highlightText(tag, query) : this.escapeHtml(tag);
                    return `<span class="tag clickable ${isMatching ? 'matching-tag' : ''}" data-type="tag" data-value="${this.escapeHtml(tag)}"><i class="fas fa-tag"></i> ${highlightedTag}</span>`;
                }).join('');
            }
            
            // 构建分类HTML（高亮匹配的分类）
            let categoriesHtml = '';
            if (post.categories && post.categories.length > 0) {
                categoriesHtml = post.categories.map(cat => {
                    const isMatching = matches.categories.includes(cat);
                    const highlightedCat = isMatching ? this.highlightText(cat, query) : this.escapeHtml(cat);
                    return `<span class="category clickable ${isMatching ? 'matching-category' : ''}" data-type="category" data-value="${this.escapeHtml(cat)}"><i class="fas fa-folder"></i> ${highlightedCat}</span>`;
                }).join('');
            }
            
            // 匹配信息提示
            let matchInfo = '';
            const matchTypes = [];
            if (matches.title) matchTypes.push('标题');
            if (matches.content) matchTypes.push('内容');
            if (matches.tags.length > 0) matchTypes.push('标签');
            if (matches.categories.length > 0) matchTypes.push('分类');
            if (matches.excerpt) matchTypes.push('摘要');
            
            if (matchTypes.length > 0) {
                matchInfo = `<div class="match-info">匹配: ${matchTypes.join(', ')}</div>`;
            }
            
            return `
                <div class="post-card-wrapper search-result">
                    <a href="/blog-post.html?post=${encodeURIComponent(post.filename)}" class="post-card">
                        <h2>${highlightedTitle}</h2>
                        <div class="post-meta">
                            <span><i class="fas fa-calendar"></i> ${this.formatDate(post.date)}</span>
                        </div>
                        ${categoriesHtml || tagsHtml ? `<div class="post-tags">${categoriesHtml}${tagsHtml}</div>` : ''}
                        <div class="post-excerpt">${highlightedExcerpt}</div>
                        ${matchInfo}
                        <span class="read-more">阅读全文 →</span>
                    </a>
                </div>
            `;
        }).join('');
        
        // 重新绑定标签和分类点击事件
        this.bindTagCategoryEvents();
    }
    
    bindTagCategoryEvents() {
        this.postsContainer?.querySelectorAll('.tag.clickable, .category.clickable').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const type = item.dataset.type;
                const value = item.dataset.value;
                window.location.href = `/blog-categories.html?type=${type}&value=${encodeURIComponent(value)}`;
            });
        });
    }
    
    updateSearchInfo(resultCount, query) {
        if (!this.resultsInfo) return;
        
        if (query) {
            this.resultsInfo.innerHTML = `
                找到 <strong>${resultCount}</strong> 篇相关文章，搜索关键词：<strong>"${this.escapeHtml(query)}"</strong>
                ${this.currentFilter !== 'all' ? `，过滤器：<strong>${this.getFilterName(this.currentFilter)}</strong>` : ''}
            `;
            this.resultsInfo.style.display = 'block';
        } else {
            this.resultsInfo.style.display = 'none';
        }
    }
    
    getFilterName(filter) {
        const filterNames = {
            'all': '全部',
            'title': '标题',
            'content': '内容',
            'tag': '标签',
            'category': '分类'
        };
        return filterNames[filter] || filter;
    }
    
    clearSearch() {
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        this.currentQuery = '';
        if (this.clearBtn) {
            this.clearBtn.style.display = 'none';
        }
        this.showAllPosts();
        if (this.resultsInfo) {
            this.resultsInfo.style.display = 'none';
        }
    }
    
    showAllPosts() {
        // 显示所有文章，这个方法应该由调用方实现
        if (window.loadPostsList) {
            window.loadPostsList();
        }
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 添加键盘快捷键支持
    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+K 或 Cmd+K 聚焦到搜索框
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.searchInput?.focus();
            }
            
            // ESC 键清除搜索
            if (e.key === 'Escape' && document.activeElement === this.searchInput) {
                this.clearSearch();
                this.searchInput?.blur();
            }
        });
    }
    
    // 添加搜索建议功能
    async initializeSuggestions() {
        if (!this.searchInput) return;
        
        // 创建建议下拉框
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'search-suggestions';
        suggestionsContainer.style.display = 'none';
        this.searchInput.parentNode.appendChild(suggestionsContainer);
        
        let suggestionTimeout;
        this.searchInput.addEventListener('input', () => {
            clearTimeout(suggestionTimeout);
            suggestionTimeout = setTimeout(() => {
                this.showSuggestions(this.searchInput.value, suggestionsContainer);
            }, 200);
        });
        
        // 点击外部关闭建议
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                suggestionsContainer.style.display = 'none';
            }
        });
    }
    
    showSuggestions(query, container) {
        if (!query || query.length < 2) {
            container.style.display = 'none';
            return;
        }
        
        const suggestions = this.generateSuggestions(query);
        if (suggestions.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        container.innerHTML = suggestions.map(suggestion => 
            `<div class="suggestion-item" data-type="${suggestion.type}" data-value="${suggestion.value}">
                <i class="fas fa-${suggestion.icon}"></i>
                <span>${this.highlightText(suggestion.display, query)}</span>
                <small>${suggestion.type}</small>
            </div>`
        ).join('');
        
        // 绑定建议点击事件
        container.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                this.searchInput.value = item.dataset.value;
                if (item.dataset.type !== '文章') {
                    this.setActiveFilter(item.dataset.type === '标签' ? 'tag' : 'category');
                }
                this.performSearch();
                container.style.display = 'none';
            });
        });
        
        container.style.display = 'block';
    }
    
    generateSuggestions(query) {
        const suggestions = [];
        const queryLower = query.toLowerCase();
        
        // 文章标题建议
        this.posts.forEach(post => {
            if (post.title.toLowerCase().includes(queryLower)) {
                suggestions.push({
                    type: '文章',
                    value: post.title,
                    display: post.title,
                    icon: 'file-alt'
                });
            }
        });
        
        // 标签建议
        const tagSet = new Set();
        this.posts.forEach(post => {
            if (post.tags) {
                post.tags.forEach(tag => {
                    if (tag.toLowerCase().includes(queryLower) && !tagSet.has(tag)) {
                        tagSet.add(tag);
                        suggestions.push({
                            type: '标签',
                            value: tag,
                            display: tag,
                            icon: 'tag'
                        });
                    }
                });
            }
        });
        
        // 分类建议
        const categorySet = new Set();
        this.posts.forEach(post => {
            if (post.categories) {
                post.categories.forEach(category => {
                    if (category.toLowerCase().includes(queryLower) && !categorySet.has(category)) {
                        categorySet.add(category);
                        suggestions.push({
                            type: '分类',
                            value: category,
                            display: category,
                            icon: 'folder'
                        });
                    }
                });
            }
        });
        
        // 限制建议数量并按相关性排序
        return suggestions
            .sort((a, b) => {
                const aExact = a.value.toLowerCase() === queryLower;
                const bExact = b.value.toLowerCase() === queryLower;
                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;
                return a.value.length - b.value.length;
            })
            .slice(0, 8);
    }
}

// 导出搜索类
window.BlogSearch = BlogSearch;
