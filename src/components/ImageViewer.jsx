import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

const ImageViewer = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [imageSrc, setImageSrc] = useState('');
    const [imageAlt, setImageAlt] = useState('');
    const [scale, setScale] = useState(1);
    const [translateX, setTranslateX] = useState(0);
    const [translateY, setTranslateY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isGif, setIsGif] = useState(false);
    
    const imageRef = useRef(null);
    const viewerRef = useRef(null);

    useEffect(() => {
        // 使用事件委托，监听整个文档的点击事件
        const handleImageClick = (e) => {
            // 检查点击的是否是markdown内容中的图片
            const img = e.target.closest('.markdown-content img');
            if (!img) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const src = img.src;
            const alt = img.alt || '';
            const gif = /\.gif(\?.*)?$/i.test(src);
            
            setIsGif(gif);
            setImageSrc(src);
            setImageAlt(alt);
            setScale(1);
            setTranslateX(0);
            setTranslateY(0);
            setIsOpen(true);
            document.body.style.overflow = 'hidden';
        };

        // 为所有markdown内容中的图片设置样式和事件
        const updateImages = () => {
            const images = document.querySelectorAll('.markdown-content img');
            images.forEach(img => {
                img.style.cursor = 'zoom-in';
            });
        };

        // 初始更新
        updateImages();

        // 使用事件委托监听点击
        document.addEventListener('click', handleImageClick, true);

        // 使用MutationObserver监听DOM变化，确保新加载的图片也能被处理
        const observer = new MutationObserver(() => {
            updateImages();
        });

        const contentArea = document.querySelector('.markdown-content');
        if (contentArea) {
            observer.observe(contentArea, {
                childList: true,
                subtree: true
            });
        }

        return () => {
            document.removeEventListener('click', handleImageClick, true);
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            switch(e.key) {
                case 'Escape':
                    closeViewer();
                    break;
                case '+':
                case '=':
                    e.preventDefault();
                    zoomIn();
                    break;
                case '-':
                    e.preventDefault();
                    zoomOut();
                    break;
                case '0':
                    e.preventDefault();
                    resetZoom();
                    break;
            }
        };

        const handleWheel = (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                setScale(prev => Math.max(0.5, Math.min(3, prev + delta)));
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        viewerRef.current?.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            viewerRef.current?.removeEventListener('wheel', handleWheel);
        };
    }, [isOpen]);

    const closeViewer = () => {
        setIsOpen(false);
        document.body.style.overflow = '';
        setTimeout(() => {
            setImageSrc('');
            setImageAlt('');
        }, 300);
    };

    const zoomIn = () => {
        setScale(prev => Math.min(3, prev + 0.2));
    };

    const zoomOut = () => {
        setScale(prev => Math.max(0.5, prev - 0.2));
    };

    const resetZoom = () => {
        setScale(1);
        setTranslateX(0);
        setTranslateY(0);
    };

    const replayGif = () => {
        if (!isGif || !imageRef.current) return;
        const img = imageRef.current;
        const src = img.src;
        // 通过添加时间戳强制重新加载
        const newSrc = src.includes('?') 
            ? src.replace(/\?.*$/, '') + '?t=' + Date.now()
            : src + '?t=' + Date.now();
        img.src = newSrc;
    };

    const handleMouseDown = (e) => {
        if (scale > 1) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - translateX,
                y: e.clientY - translateY
            });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging && scale > 1) {
            setTranslateX(e.clientX - dragStart.x);
            setTranslateY(e.clientY - dragStart.y);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, dragStart]);

    if (!isOpen) return null;

    const viewerContent = (
        <div 
            ref={viewerRef}
            className="image-viewer-overlay active"
            onClick={(e) => {
                if (e.target === viewerRef.current) {
                    closeViewer();
                }
            }}
        >
            <div className="image-viewer-close" onClick={closeViewer} title="关闭 (ESC)">
                ×
            </div>
            <div className="image-viewer-content" onClick={(e) => e.stopPropagation()}>
                <img
                    ref={imageRef}
                    id="viewerImage"
                    src={imageSrc}
                    alt={imageAlt}
                    style={{
                        transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
                        cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                        transition: isDragging ? 'none' : 'transform 0.2s ease'
                    }}
                    onMouseDown={handleMouseDown}
                    draggable={false}
                />
            </div>
            {imageAlt && (
                <div className="image-viewer-caption" id="viewerCaption">
                    {imageAlt}
                </div>
            )}
            <div className="image-viewer-controls">
                {isGif && (
                    <div 
                        className="image-viewer-control" 
                        id="gifReplay" 
                        title="重播 GIF"
                        onClick={replayGif}
                    >
                        <i className="fas fa-redo"></i>
                    </div>
                )}
                <div 
                    className="image-viewer-control" 
                    id="zoomOut" 
                    title="缩小"
                    onClick={zoomOut}
                >
                    <i className="fas fa-search-minus"></i>
                </div>
                <div 
                    className="image-viewer-control" 
                    id="zoomReset" 
                    title="重置"
                    onClick={resetZoom}
                >
                    <i className="fas fa-compress"></i>
                </div>
                <div 
                    className="image-viewer-control" 
                    id="zoomIn" 
                    title="放大"
                    onClick={zoomIn}
                >
                    <i className="fas fa-search-plus"></i>
                </div>
            </div>
            <style>{`
                .image-viewer-overlay {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.95);
                    z-index: 10000;
                    cursor: zoom-out;
                    animation: fadeIn 0.3s ease;
                }
                
                .image-viewer-content {
                    position: relative;
                    max-width: 90%;
                    max-height: 90%;
                    cursor: default;
                }
                
                .image-viewer-content img {
                    max-width: 100%;
                    max-height: 90vh;
                    object-fit: contain;
                    border-radius: 8px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    animation: zoomIn 0.3s ease;
                }
                
                .image-viewer-close {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    width: 40px;
                    height: 40px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    font-size: 24px;
                    transition: all 0.3s ease;
                    z-index: 10001;
                }
                
                .image-viewer-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: rotate(90deg);
                }
                
                .image-viewer-controls {
                    position: absolute;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    gap: 10px;
                    background: rgba(0, 0, 0, 0.5);
                    padding: 10px 20px;
                    border-radius: 25px;
                    backdrop-filter: blur(10px);
                }
                
                .image-viewer-control {
                    width: 36px;
                    height: 36px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    font-size: 16px;
                    transition: all 0.3s ease;
                }
                
                .image-viewer-control:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: scale(1.1);
                }
                
                .image-viewer-caption {
                    position: absolute;
                    bottom: 80px;
                    left: 50%;
                    transform: translateX(-50%);
                    color: #fff;
                    background: rgba(0, 0, 0, 0.5);
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 14px;
                    max-width: 80%;
                    text-align: center;
                    backdrop-filter: blur(10px);
                }
                
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                
                @keyframes zoomIn {
                    from {
                        transform: scale(0.9);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );

    return createPortal(viewerContent, document.body);
};

export default ImageViewer;
