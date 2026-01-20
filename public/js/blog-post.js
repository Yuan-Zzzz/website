// 配置 marked
function initMarked() {
    if (typeof marked === 'undefined' || typeof hljs === 'undefined') {
        console.error('marked 或 hljs 未加载');
        return false;
    }
    
    // 创建自定义渲染器来处理图片路径
    const renderer = new marked.Renderer();
    const originalImageRenderer = renderer.image.bind(renderer);
    
    renderer.image = function(href, title, text) {
        // 如果图片路径不是以 http:// 或 https:// 或 / 开头，说明是相对路径
        if (href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('/')) {
            // 将相对路径转换为 /posts/ 目录下的路径
            href = '/posts/' + href;
        }
        return originalImageRenderer(href, title, text);
    };
    
    marked.setOptions({
        renderer: renderer,
        // 禁用marked的内置高亮，改用分批处理提升性能
        highlight: null,
        breaks: true,
        gfm: true,
        // 异步解析选项
        async: false,
        pedantic: false,
        smartLists: true,
        smartypants: false
    });
    
    return true;
}

// 从 URL 参数获取文章名称
function getPostNameFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('post');
}

// 解析 Front Matter
function parseFrontMatter(content) {
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontMatterRegex);
    
    if (match) {
        const frontMatter = {};
        const frontMatterContent = match[1];
        const bodyContent = match[2];
        
        // 简单解析：每行一个键值对
        frontMatterContent.split('\n').forEach(line => {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim();
                let value = line.substring(colonIndex + 1).trim();
                frontMatter[key] = value;
            }
        });
        
        return {
            metadata: frontMatter,
            content: bodyContent
        };
    }
    
    return {
        metadata: {},
        content: content
    };
}

// 解析数组字段
function parseArrayField(field) {
    if (!field) return [];
    
    if (typeof field === 'string') {
        const cleaned = field.replace(/[\[\]"']/g, '').trim();
        if (cleaned === '') return [];
        return cleaned.split(',').map(item => item.trim()).filter(item => item !== '');
    }
    
    if (Array.isArray(field)) {
        return field;
    }
    
    return [];
}

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 格式化日期
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 加载并渲染文章
async function loadPost() {
    const postName = getPostNameFromUrl();
    const postContainer = document.getElementById('blog-post');
    
    if (!postName) {
        postContainer.innerHTML = '<div class="error-message">未指定文章</div>';
        return;
    }
    
    // 显示加载指示器
    postContainer.innerHTML = '<div class="loading-message" style="text-align: center; padding: 50px; color: #666;"><i class="fas fa-spinner fa-spin" style="font-size: 2em; margin-bottom: 20px;"></i><p>正在加载文章...</p></div>';
    
    try {
        console.log('开始加载文章:', postName);
        const response = await fetch(`/posts/${postName}`);
        
        if (!response.ok) {
            throw new Error('文章不存在');
        }
        
        console.log('文章获取成功，开始解析...');
        const markdownContent = await response.text();
        console.log('Markdown内容长度:', markdownContent.length);
        
        const parsedData = parseFrontMatter(markdownContent);
        const metadata = parsedData.metadata;
        const content = parsedData.content;
        
        console.log('开始解析Markdown为HTML...');
        const html = marked.parse(content);
        console.log('HTML生成成功，长度:', html.length);
        
        const title = metadata.title || '无标题';
        const date = formatDate(metadata.date);
        const categories = parseArrayField(metadata.categories);
        const tags = parseArrayField(metadata.tags);
        
        let tagsHtml = '';
        if (tags.length > 0) {
            tagsHtml = tags.map(tag => 
                '<a href="/blog-categories.html?type=tag&value=' + encodeURIComponent(tag) + '" class="tag clickable"><i class="fas fa-tag"></i> ' + escapeHtml(tag) + '</a>'
            ).join('');
        }
        
        let categoriesHtml = '';
        if (categories.length > 0) {
            categoriesHtml = categories.map(cat => 
                '<a href="/blog-categories.html?type=category&value=' + encodeURIComponent(cat) + '" class="category clickable"><i class="fas fa-folder"></i> ' + escapeHtml(cat) + '</a>'
            ).join('');
        }
        
        document.title = title + ' - Yuan的个人网站';
        
        let metaTagsSection = '';
        if (categoriesHtml || tagsHtml) {
            metaTagsSection = '<div class="post-meta-tags">' + categoriesHtml + tagsHtml + '</div>';
        }
        
        console.log('开始渲染到页面...');
        postContainer.innerHTML = 
            '<header>' +
                '<h1>' + escapeHtml(title) + '</h1>' +
                '<div class="post-meta">' +
                    '<span><i class="fas fa-calendar"></i> ' + date + '</span>' +
                '</div>' +
                metaTagsSection +
            '</header>' +
            '<div class="markdown-content">' +
                html +
            '</div>';
        
        // 目录：在 DOM 就绪后生成
        buildToc();
        
        console.log('HTML渲染完成');
        
        // 使用 setTimeout 确保DOM更新后再执行优化
        setTimeout(() => {
            console.log('开始优化长内容...');
            // 优化长内容渲染
            optimizeLongContent();
            
            console.log('开始分批高亮代码块...');
            // 分批高亮代码块，避免长文章卡顿
            highlightCodeBlocksInBatches();
            
            // 初始化图片查看器
            const attachImageEvents = initImageViewer();
            attachImageEvents();
            
            // 添加淡入动画
            observeFadeInSections();
            
            // 图片懒加载优化
            optimizeImages();
        }, 0);
        
    } catch (error) {
        console.error('加载文章失败:', error);
        postContainer.innerHTML = '<div class="error-message">加载文章失败: ' + error.message + '</div>';
    }
}

// 根据 markdown 内容生成目录
function buildToc() {
    const container = document.querySelector('.markdown-content');
    const tocRoot = document.querySelector('.toc-sidebar-fixed .toc-list');
    const tocSide = document.querySelector('.toc-sidebar-fixed');
    if (!container || !tocRoot) {
        // 无容器或无 TOC 容器时，视为无目录
        if (tocSide) tocSide.style.display = 'none';
        document.body.classList.add('no-toc');
        document.body.classList.remove('has-toc');
        return;
    }

    const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4'));
    if (headings.length === 0) {
        if (tocSide) tocSide.style.display = 'none';
        document.body.classList.add('no-toc');
        document.body.classList.remove('has-toc');
        return;
    }

    // 存在目录：显示侧栏并标记 has-toc
    if (tocSide) tocSide.style.display = '';
    document.body.classList.add('has-toc');
    document.body.classList.remove('no-toc');

    const usedIds = new Map();
    headings.forEach(h => {
        let base = (h.textContent || '').trim().toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5\-\s]/g, '')
            .replace(/\s+/g, '-');
        if (!base) base = 'section';
        let id = base;
        if (usedIds.has(base)) { const n = usedIds.get(base) + 1; usedIds.set(base, n); id = `${base}-${n}`; } else { usedIds.set(base, 1); }
        h.id = h.id || id;
    });

    const root = { level: 0, children: [] };
    const stack = [root];
    headings.forEach(h => {
        const level = parseInt(h.tagName.substring(1), 10);
        const node = { el: h, id: h.id, text: h.textContent || '', level, children: [] };
        while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
        stack[stack.length - 1].children.push(node);
        stack.push(node);
    });

    function renderNodes(nodes, isRoot = false) {
        const ul = document.createElement('ul');
        ul.className = isRoot ? 'toc-root' : 'toc-children';
        nodes.forEach(node => {
            const li = document.createElement('li');
            li.className = 'toc-item' + (node.children.length ? ' has-children' : '');

            const row = document.createElement('div');
            row.className = 'toc-row';

            const toggle = document.createElement('span');
            toggle.className = 'toc-toggle';
            if (node.children.length) {
                toggle.setAttribute('role', 'button');
                toggle.setAttribute('tabindex', '0');
                toggle.setAttribute('aria-label', '展开/收起');
                toggle.setAttribute('aria-expanded', 'true');
                toggle.innerHTML = '<i class="fas fa-chevron-down" aria-hidden="true"></i>';
                toggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const collapsed = li.classList.toggle('collapsed');
                    toggle.setAttribute('aria-expanded', String(!collapsed));
                    animateTocChildren(li, !collapsed);
                });
                toggle.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggle.click();
                    }
                });
            } else {
                toggle.style.visibility = 'hidden';
            }
            row.appendChild(toggle);

            const a = document.createElement('a');
            a.className = `toc-link toc-level-${node.level}`;
            a.href = `#${node.id}`;
            a.textContent = node.text;
            a.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById(node.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setActiveTocById(node.id);
                history.replaceState(null, '', `#${node.id}`);
            });
            row.appendChild(a);
            li.appendChild(row);

            // 默认折叠 3 级及以下，保持结构简洁
            if (node.level >= 3 && node.children.length) {
                li.classList.add('collapsed');
                toggle.setAttribute('aria-expanded', 'false');
            }

            if (node.children.length) li.appendChild(renderNodes(node.children));
            ul.appendChild(li);
        });
        return ul;
    }

    tocRoot.innerHTML = '';
    tocRoot.appendChild(renderNodes(root.children, true));

    // 渲染完成后，初始化每个 toc-children 的高度以支持动画
    initializeTocHeights();

    observeHeadingsForToc(headings);
}

// 计算并缓存每个子列表的自然高度，用于展开/收起动画
function initializeTocHeights() {
    const sublists = document.querySelectorAll('#toc .toc-children');
    sublists.forEach(ul => {
        // 先清空高度以测量自然高度
        ul.style.height = 'auto';
        ul.style.opacity = '';
        const natural = ul.scrollHeight;
        ul.dataset.naturalHeight = String(natural);
        // 如果父项是折叠态，则将高度设为 0
        const parentItem = ul.closest('.toc-item');
        if (parentItem?.classList.contains('collapsed')) {
            ul.style.height = '0px';
            ul.style.opacity = '0.98';
        } else {
            ul.style.height = natural + 'px';
            // 用一个 RAF 之后把高度清为 auto，避免固定高度影响后续布局
            requestAnimationFrame(() => {
                ul.style.height = 'auto';
            });
        }
    });
}

// 在展开或收起时应用平滑过渡
function animateTocChildren(item, expand) {
    const ul = item.querySelector(':scope > .toc-children');
    if (!ul) return;

    // 先确保有最新的自然高度
    const prev = ul.style.height;
    ul.style.height = 'auto';
    const natural = ul.scrollHeight;
    ul.dataset.naturalHeight = String(natural);

    if (expand) {
        // 从 0 过渡到自然高度
        ul.style.height = '0px';
        ul.style.opacity = '0.98';
        // 强制回流以应用起始高度
        ul.getBoundingClientRect();
        ul.style.height = natural + 'px';
        ul.style.opacity = '';
        // 过渡结束后设为 auto
        const onEnd = () => {
            ul.style.height = 'auto';
            ul.removeEventListener('transitionend', onEnd);
        };
        ul.addEventListener('transitionend', onEnd);
    } else {
        // 从当前高度过渡到 0
        const from = natural;
        ul.style.height = from + 'px';
        // 强制回流
        ul.getBoundingClientRect();
        ul.style.height = '0px';
        ul.style.opacity = '0.98';
    }
}

function setActiveTocById(id) {
    document.querySelectorAll('#toc .toc-link').forEach(a => a.classList.remove('active'));
    const selector = `#toc .toc-link[href="#${CSS.escape(id)}"]`;
    const current = document.querySelector(selector);
    if (current) current.classList.add('active');
}

function observeHeadingsForToc(headings) {
    const observer = new IntersectionObserver((entries) => {
        // 找到最接近页面顶部且可见的标题
        const visible = entries
            .filter(e => e.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
            const id = visible[0].target.id;
            setActiveTocById(id);
            // 确保目录中该项展开
            const link = document.querySelector(`#toc .toc-link[href="#${CSS.escape(id)}"]`);
            const item = link?.closest('.toc-item');
            if (item) {
                // 展开当前项
                if (item.classList.contains('collapsed')) {
                    item.classList.remove('collapsed');
                    animateTocChildren(item, true);
                }
                // 将其祖先展开
                let p = item.parentElement;
                while (p && p !== document) {
                    if (p.classList?.contains('toc-children')) {
                        const parentItem = p.parentElement;
                        if (parentItem && parentItem.classList.contains('collapsed')) {
                            parentItem.classList.remove('collapsed');
                            animateTocChildren(parentItem, true);
                        }
                    }
                    p = p.parentElement;
                }
            }
        }
    }, {
        root: null,
        rootMargin: '0px 0px -70% 0px',
        threshold: 0.01
    });

    headings.forEach(h => observer.observe(h));
}

// 根据窗口尺寸变化更新缓存高度，保持动画准确
window.addEventListener('resize', () => {
    // 使用 RAF 防抖以避免频繁计算
    if (window.__tocResizeRaf) cancelAnimationFrame(window.__tocResizeRaf);
    window.__tocResizeRaf = requestAnimationFrame(() => initializeTocHeights());
});

// 分批高亮代码块，提升长文章的性能
function highlightCodeBlocksInBatches() {
    const codeBlocks = document.querySelectorAll('.markdown-content pre code');
    const batchSize = 5; // 每批处理5个代码块
    let index = 0;
    
    function processBatch() {
        const endIndex = Math.min(index + batchSize, codeBlocks.length);
        
        for (let i = index; i < endIndex; i++) {
            try {
                hljs.highlightElement(codeBlocks[i]);
            } catch (err) {
                console.warn('代码块高亮失败:', err);
            }
        }
        
        index = endIndex;
        
        // 如果还有未处理的代码块，继续处理下一批
        if (index < codeBlocks.length) {
            requestAnimationFrame(processBatch);
        }
    }
    
    // 使用 requestAnimationFrame 确保不阻塞主线程
    if (codeBlocks.length > 0) {
        requestAnimationFrame(processBatch);
    }
}

// 优化图片加载
function optimizeImages() {
    const images = document.querySelectorAll('.markdown-content img');
    
    images.forEach(img => {
        // 通用优化：懒加载与异步解码
        img.loading = img.loading || 'lazy';
        img.decoding = img.decoding || 'async';
        img.referrerPolicy = img.referrerPolicy || 'no-referrer-when-downgrade';

        const isGif = /\.gif(\?.*)?$/i.test(img.src);
        if (isGif) {
            // GIF 默认即可播放，这里仅保证载入后可见，不额外处理以免打断动画
        }
        
        // 添加加载状态淡入
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease-in-out';
        
        // 图片加载完成后显示
        if (img.complete) {
            img.style.opacity = '1';
        } else {
            img.addEventListener('load', function() {
                this.style.opacity = '1';
            });
            
            img.addEventListener('error', function() {
                this.style.opacity = '0.5';
                this.alt = '图片加载失败';
            });
        }
    });
}

// 优化长内容的渲染性能
function optimizeLongContent() {
    const contentSections = document.querySelectorAll('.markdown-content > *');

    // 兼容清理：移除旧版本设置在元素上的 content-visibility/contain-intrinsic-size，避免导致内容不渲染
    contentSections.forEach((section) => {
        if (section.style && (section.style.contentVisibility || section.style.containIntrinsicSize)) {
            section.style.removeProperty('content-visibility');
            section.style.removeProperty('contain-intrinsic-size');
        }
    });

    // 注意：原本这里会为超过一定数量的段落设置 `content-visibility: auto`
    // 但在部分浏览器/布局组合（例如父级包含 transform、复合层等）下会出现判断失误，
    // 导致长文内容永远不进入“可见”状态而不被绘制。为保证可用性，已关闭该优化。

    // 优化代码块的滚动
    const codeBlocks = document.querySelectorAll('.markdown-content pre');
    codeBlocks.forEach(block => {
        // 添加平滑滚动
        block.style.overflowX = 'auto';
        block.style.webkitOverflowScrolling = 'touch';
    });
}

// 淡入动画观察器
function observeFadeInSections() {
    const sections = document.querySelectorAll('.fade-in-section');
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        // 超长文章时，元素高度远大于视口，0.1 阈值可能永远达不到
        // 使用接近 0 的阈值，任意可见像素即触发
        threshold: 0.001,
        rootMargin: '0px'
    });

    sections.forEach(function(section) {
        observer.observe(section);
    });

    // 兜底：如果 1 秒后仍未显示，则强制显示，避免因某些环境下的 IO 异常导致内容不可见
    setTimeout(() => {
        sections.forEach((el) => {
            if (!el.classList.contains('visible')) {
                el.classList.add('visible');
            }
        });
    }, 1000);
}

// 图片查看器功能
function initImageViewer() {
    // 创建图片查看器 DOM 结构
    const viewerHTML = `
        <div id="imageViewer" class="image-viewer-overlay">
            <div class="image-viewer-close" title="关闭 (ESC)">×</div>
            <div class="image-viewer-content">
                <img id="viewerImage" src="" alt="">
            </div>
            <div class="image-viewer-caption" id="viewerCaption" style="display: none;"></div>
            <div class="image-viewer-controls">
                <div class="image-viewer-control" id="gifReplay" title="重播 GIF" style="display:none">
                    <i class="fas fa-redo"></i>
                </div>
                <div class="image-viewer-control" id="zoomOut" title="缩小">
                    <i class="fas fa-search-minus"></i>
                </div>
                <div class="image-viewer-control" id="zoomReset" title="重置">
                    <i class="fas fa-compress"></i>
                </div>
                <div class="image-viewer-control" id="zoomIn" title="放大">
                    <i class="fas fa-search-plus"></i>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', viewerHTML);
    
    const viewer = document.getElementById('imageViewer');
    const viewerImage = document.getElementById('viewerImage');
    const viewerCaption = document.getElementById('viewerCaption');
    const closeBtn = document.querySelector('.image-viewer-close');
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const zoomResetBtn = document.getElementById('zoomReset');
    const gifReplayBtn = document.getElementById('gifReplay');
    
    let currentScale = 1;
    const scaleStep = 0.2;
    const minScale = 0.5;
    const maxScale = 3;
    let currentIsGif = false;
    
    // 拖拽相关变量
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let translateX = 0;
    let translateY = 0;
    let currentTranslateX = 0;
    let currentTranslateY = 0;
    
    // 打开图片查看器
    function openViewer(imgSrc, imgAlt) {
        currentIsGif = /\.gif(\?.*)?$/i.test(imgSrc);
        
        // 为了确保 GIF 在查看器中能正常播放，采用“缓存破坏”强制重新加载
        const srcForViewer = currentIsGif
            ? imgSrc + (imgSrc.includes('?') ? '&' : '?') + 't=' + Date.now()
            : imgSrc;
        
        viewerImage.src = '';
        viewerImage.src = srcForViewer;
        currentScale = 1;
        translateX = 0;
        translateY = 0;
        currentTranslateX = 0;
        currentTranslateY = 0;
        updateImageTransform();
        
        // GIF 重播按钮的显示/隐藏
        gifReplayBtn.style.display = currentIsGif ? 'flex' : 'none';
        
        if (imgAlt) {
            viewerCaption.textContent = imgAlt;
            viewerCaption.style.display = 'block';
        } else {
            viewerCaption.style.display = 'none';
        }
        
        viewer.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // 关闭图片查看器
    function closeViewer() {
        viewer.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => {
            viewerImage.src = '';
        }, 300);
    }
    
    // 更新图片变换
    function updateImageTransform() {
        viewerImage.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`;
        // 根据缩放程度调整光标样式
        if (currentScale > 1) {
            viewerImage.style.cursor = isDragging ? 'grabbing' : 'grab';
        } else {
            viewerImage.style.cursor = 'zoom-in';
        }
    }
    
    // 缩放图片
    function zoomImage(delta) {
        currentScale = Math.max(minScale, Math.min(maxScale, currentScale + delta));
        updateImageTransform();
    }
    
    // 重置缩放
    function resetZoom() {
        currentScale = 1;
        translateX = 0;
        translateY = 0;
        currentTranslateX = 0;
        currentTranslateY = 0;
        updateImageTransform();
    }
    
    // GIF 重播
    gifReplayBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (!currentIsGif || !viewerImage.src) return;
        const rawSrc = viewerImage.src.replace(/([&?])t=\d+(&|$)/, '$1').replace(/[&?]$/, '');
        const newSrc = rawSrc + (rawSrc.includes('?') ? '&' : '?') + 't=' + Date.now();
        viewerImage.src = newSrc;
    });
    
    // 为 markdown 内容中的图片添加点击事件
    function attachImageClickEvents() {
        const images = document.querySelectorAll('.markdown-content img');
        images.forEach(img => {
            img.addEventListener('click', function(e) {
                e.stopPropagation();
                openViewer(this.src, this.alt);
            });
        });
    }
    
    // 关闭按钮点击
    closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        closeViewer();
    });
    
    // 点击背景关闭
    viewer.addEventListener('click', function(e) {
        if (e.target === viewer) {
            closeViewer();
        }
    });
    
    // 缩放控制
    zoomInBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        zoomImage(scaleStep);
    });
    
    zoomOutBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        zoomImage(-scaleStep);
    });
    
    zoomResetBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        resetZoom();
    });
    
    // 键盘快捷键
    document.addEventListener('keydown', function(e) {
        if (!viewer.classList.contains('active')) return;
        
        switch(e.key) {
            case 'Escape':
                closeViewer();
                break;
            case '+':
            case '=':
                zoomImage(scaleStep);
                break;
            case '-':
                zoomImage(-scaleStep);
                break;
            case '0':
                resetZoom();
                break;
        }
    });
    
    // 鼠标滚轮缩放
    viewerImage.addEventListener('wheel', function(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -scaleStep : scaleStep;
        zoomImage(delta);
    });
    
    // 鼠标拖拽事件
    viewerImage.addEventListener('mousedown', function(e) {
        if (currentScale > 1) {
            isDragging = true;
            startX = e.clientX - currentTranslateX;
            startY = e.clientY - currentTranslateY;
            viewerImage.style.cursor = 'grabbing';
            e.preventDefault();
        }
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        currentTranslateX = e.clientX - startX;
        currentTranslateY = e.clientY - startY;
        translateX = currentTranslateX;
        translateY = currentTranslateY;
        updateImageTransform();
    });
    
    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            if (currentScale > 1) {
                viewerImage.style.cursor = 'grab';
            }
        }
    });
    
    // 触摸拖拽事件（移动端支持）
    let touchStartX = 0;
    let touchStartY = 0;
    
    viewerImage.addEventListener('touchstart', function(e) {
        if (currentScale > 1 && e.touches.length === 1) {
            isDragging = true;
            touchStartX = e.touches[0].clientX - currentTranslateX;
            touchStartY = e.touches[0].clientY - currentTranslateY;
            e.preventDefault();
        }
    });
    
    viewerImage.addEventListener('touchmove', function(e) {
        if (!isDragging || e.touches.length !== 1) return;
        
        currentTranslateX = e.touches[0].clientX - touchStartX;
        currentTranslateY = e.touches[0].clientY - touchStartY;
        translateX = currentTranslateX;
        translateY = currentTranslateY;
        updateImageTransform();
        e.preventDefault();
    });
    
    viewerImage.addEventListener('touchend', function() {
        isDragging = false;
    });
    
    // 阻止图片内容点击事件冒泡
    document.querySelector('.image-viewer-content').addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    return attachImageClickEvents;
}

// 初始化宽页模式切换
function initWidthToggle() {
    const toggleBtn = document.getElementById('widthToggle');
    const blogContainer = document.querySelector('.blog-container');
    
    if (!toggleBtn || !blogContainer) return;
    
    // 从 localStorage 读取用户偏好
    const isWideMode = localStorage.getItem('blogWidthMode') === 'wide';
    
    // 应用保存的模式
    if (isWideMode) {
        blogContainer.classList.add('wide-mode');
        toggleBtn.classList.add('active');
        toggleBtn.innerHTML = '<i class="fas fa-compress-alt"></i><span class="toggle-text">标准阅读</span>';
        toggleBtn.title = '切换到标准阅读宽度';
    }
    
    // 切换按钮点击事件
    toggleBtn.addEventListener('click', function() {
        const isCurrentlyWide = blogContainer.classList.contains('wide-mode');
        
        if (isCurrentlyWide) {
            // 切换到标准模式
            blogContainer.classList.remove('wide-mode');
            toggleBtn.classList.remove('active');
            toggleBtn.innerHTML = '<i class="fas fa-expand-alt"></i><span class="toggle-text">宽屏阅读</span>';
            toggleBtn.title = '切换到宽屏阅读模式';
            localStorage.setItem('blogWidthMode', 'normal');
        } else {
            // 切换到宽页模式
            blogContainer.classList.add('wide-mode');
            toggleBtn.classList.add('active');
            toggleBtn.innerHTML = '<i class="fas fa-compress-alt"></i><span class="toggle-text">标准阅读</span>';
            toggleBtn.title = '切换到标准阅读宽度';
            localStorage.setItem('blogWidthMode', 'wide');
        }
    });
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
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
    
    // 首屏根据是否存在侧栏容器预设布局，避免在构建目录前正文被遮挡
    const tocEl = document.getElementById('toc');
    if (tocEl) {
        document.body.classList.add('has-toc');
        document.body.classList.remove('no-toc');
    } else {
        document.body.classList.add('no-toc');
        document.body.classList.remove('has-toc');
    }

    if (initMarked()) {
        loadPost();
    } else {
        const postContainer = document.getElementById('blog-post');
        if (postContainer) {
            postContainer.innerHTML = '<div class="error-message">库文件加载失败，请刷新页面重试</div>';
        }
    }
    initImageViewer();
    initWidthToggle(); // 初始化宽页模式切换
});
