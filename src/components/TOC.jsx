import React, { useEffect, useState, useRef } from 'react';

const TOC = ({ contentRef }) => {
    const [headings, setHeadings] = useState([]);
    const [activeId, setActiveId] = useState('');
    const observerRef = useRef(null);
    const hasHeadingsRef = useRef(false);

    useEffect(() => {
        if (!contentRef?.current) return;

        // 提取所有标题
        const headingElements = contentRef.current.querySelectorAll('h1, h2, h3, h4');
        const headingData = [];

        headingElements.forEach((heading, index) => {
            const level = parseInt(heading.tagName.substring(1), 10);
            const text = heading.textContent || '';
            
            // 生成ID（基于文本内容）
            let id = text
                .toLowerCase()
                .replace(/[^\w\u4e00-\u9fa5\-\s]/g, '')
                .replace(/\s+/g, '-');
            
            if (!id) id = `section-${index}`;
            
            // 确保ID唯一
            let uniqueId = id;
            let counter = 1;
            while (headingData.some(h => h.id === uniqueId)) {
                uniqueId = `${id}-${counter}`;
                counter++;
            }

            // 设置标题ID
            heading.id = uniqueId;
            heading.style.scrollMarginTop = '110px'; // 避免被固定头部遮挡

            headingData.push({
                id: uniqueId,
                text,
                level,
                element: heading
            });
        });

        setHeadings(headingData);
        hasHeadingsRef.current = headingData.length > 0;

        // 更新body类名以控制布局
        if (headingData.length > 0) {
            document.body.classList.add('has-toc');
            document.body.classList.remove('no-toc');
        } else {
            document.body.classList.add('no-toc');
            document.body.classList.remove('has-toc');
        }

        // 设置IntersectionObserver监听标题位置
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter(e => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                
                if (visible[0]) {
                    setActiveId(visible[0].target.id);
                }
            },
            {
                root: null,
                rootMargin: '0px 0px -70% 0px',
                threshold: 0.01
            }
        );

        headingElements.forEach(h => observer.observe(h));
        observerRef.current = observer;

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
            // 清理body类名
            document.body.classList.remove('has-toc', 'no-toc');
        };
    }, [contentRef]);

    // 构建树形结构
    const buildTree = (items) => {
        const root = { level: 0, children: [] };
        const stack = [root];

        items.forEach(item => {
            const node = {
                id: item.id,
                text: item.text,
                level: item.level,
                children: []
            };

            // 找到合适的父节点
            while (stack.length > 1 && stack[stack.length - 1].level >= item.level) {
                stack.pop();
            }

            stack[stack.length - 1].children.push(node);
            stack.push(node);
        });

        return root.children;
    };

    const tree = buildTree(headings);

    const handleClick = (e, id) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveId(id);
            // 更新URL但不刷新页面
            window.history.replaceState(null, '', `#${id}`);
        }
    };

    const renderNode = (node) => {
        const isActive = activeId === node.id;
        const hasChildren = node.children.length > 0;

        return (
            <li key={node.id} className={`toc-item ${hasChildren ? 'has-children' : ''}`}>
                <div className="toc-row">
                    <a
                        href={`#${node.id}`}
                        className={`toc-link toc-level-${node.level} ${isActive ? 'active' : ''}`}
                        onClick={(e) => handleClick(e, node.id)}
                    >
                        {node.text}
                    </a>
                </div>
                {hasChildren && (
                    <ul className="toc-children">
                        {node.children.map(child => renderNode(child))}
                    </ul>
                )}
            </li>
        );
    };

    if (headings.length === 0) {
        return null;
    }

    return (
        <>
            <aside id="toc" className="toc-sidebar-fixed" aria-label="文章目录">
                <div className="toc-title">
                    <i className="fas fa-list"></i> 目录
                </div>
                <nav className="toc-list">
                    <ul className="toc-root">
                        {tree.map(node => renderNode(node))}
                    </ul>
                </nav>
            </aside>
            <style>{`
                .toc-sidebar-fixed {
                    position: sticky;
                    top: 100px;
                    width: 280px;
                    height: calc(100vh - 120px);
                    max-height: calc(100vh - 120px);
                    background: rgba(39, 46, 51, 0.7);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 12px;
                    backdrop-filter: blur(6px);
                    overflow: hidden;
                    z-index: 100;
                    flex-shrink: 0;
                }
                
                .toc-sidebar-fixed .toc-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px;
                    font-weight: 600;
                    color: #fff;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                }
                
                .toc-sidebar-fixed .toc-list {
                    height: calc(100% - 48px);
                    overflow: auto;
                    padding: 8px;
                }
                
                .toc-list ul {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                }
                
                .toc-root {
                    padding-left: 6px;
                }
                
                .toc-children {
                    list-style: none;
                    margin: 4px 0 4px 12px;
                    padding-left: 10px;
                    border-left: 1px solid rgba(255, 255, 255, 0.08);
                }
                
                .toc-item {
                    margin: 2px 0;
                }
                
                .toc-row {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .toc-link {
                    flex: 1;
                    display: block;
                    padding: 6px 10px 6px 8px;
                    border-radius: 6px;
                    color: rgba(255, 255, 255, 0.82);
                    text-decoration: none;
                    font-size: 0.92em;
                    line-height: 1.35;
                    position: relative;
                    transition: background 0.15s ease, color 0.15s ease, padding-left 0.15s ease;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .toc-link:hover {
                    background: rgba(255, 255, 255, 0.08);
                    color: #fff;
                    padding-left: 10px;
                }
                
                .toc-link.active {
                    color: #4a9eff;
                    background: rgba(74, 158, 255, 0.12);
                }
                
                .toc-link.active::before {
                    content: '';
                    position: absolute;
                    left: -6px;
                    top: 6px;
                    bottom: 6px;
                    width: 3px;
                    border-radius: 2px;
                    background: #4a9eff;
                }
                
                .toc-list::-webkit-scrollbar {
                    width: 8px;
                }
                
                .toc-list::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.12);
                    border-radius: 8px;
                }
                
                .toc-list::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                
                .toc-list::-webkit-scrollbar-track {
                    background: transparent;
                }
                
                /* 响应式：小屏隐藏目录 */
                @media (max-width: 992px) {
                    .toc-sidebar-fixed {
                        position: relative;
                        top: 0;
                        width: 100%;
                        height: auto;
                        max-height: 300px;
                        margin-bottom: 20px;
                    }
                }
            `}</style>
        </>
    );
};

export default TOC;
