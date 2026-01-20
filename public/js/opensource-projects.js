/**
 * 开源项目展示
 * 只需配置 GitHub 仓库链接，自动获取项目信息
 */

class OpenSourceProjects {
    constructor(containerId, dataUrl) {
        this.container = document.getElementById(containerId);
        this.dataUrl = dataUrl;
        this.projects = [];
        this.repoUrls = [];
    }

    /**
     * 初始化
     */
    async init() {
        try {
            await this.loadRepoUrls();
            await this.fetchProjectsInfo();
            this.render();
        } catch (error) {
            console.error('Failed to load opensource projects:', error);
            this.showError();
        }
    }

    /**
     * 加载仓库 URL 列表
     */
    async loadRepoUrls() {
        try {
            const response = await fetch(this.dataUrl);
            if (!response.ok) {
                throw new Error('Failed to fetch repo URLs');
            }
            this.repoUrls = await response.json();
        } catch (error) {
            console.error('Error loading repo URLs:', error);
            // 使用默认 URL
            this.repoUrls = ["https://github.com/example/example-repo"];
        }
    }

    /**
     * 从 GitHub API 获取项目信息
     */
    async fetchProjectsInfo() {
        const promises = this.repoUrls.map(url => this.fetchRepoInfo(url));
        const results = await Promise.allSettled(promises);
        
        this.projects = results
            .filter(result => result.status === 'fulfilled' && result.value)
            .map(result => result.value);
    }

    /**
     * 获取单个仓库信息
     */
    async fetchRepoInfo(repoUrl) {
        try {
            // 解析 GitHub URL
            const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
            if (!match) {
                console.warn(`Invalid GitHub URL: ${repoUrl}`);
                return null;
            }

            const owner = match[1];
            const repo = match[2].replace(/\.git$/, '');
            
            // 调用 GitHub API
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
            
            if (!response.ok) {
                console.warn(`Failed to fetch info for ${owner}/${repo}`);
                return this.createFallbackProject(owner, repo, repoUrl);
            }

            const data = await response.json();
            
            return {
                name: data.name,
                fullName: data.full_name,
                description: data.description || '暂无描述',
                stars: this.formatStars(data.stargazers_count),
                language: data.language || 'Unknown',
                topics: data.topics || [],
                url: data.html_url,
                homepage: data.homepage
            };
        } catch (error) {
            console.error(`Error fetching repo info for ${repoUrl}:`, error);
            return null;
        }
    }

    /**
     * 创建备用项目信息（当 API 调用失败时）
     */
    createFallbackProject(owner, repo, url) {
        return {
            name: repo,
            fullName: `${owner}/${repo}`,
            description: '点击查看项目详情',
            stars: '—',
            language: 'Unknown',
            topics: [],
            url: url,
            homepage: null
        };
    }

    /**
     * 格式化星标数
     */
    formatStars(count) {
        if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'k';
        }
        return count.toString();
    }

    /**
     * 获取默认项目数据（示例）
     */
    getDefaultProjects() {
        return [
            {
                name: "示例项目",
                fullName: "example/example-repo",
                description: "请编辑 public/js/opensource-projects.json 文件，添加你参与的 GitHub 项目链接。",
                stars: "0",
                language: "JavaScript",
                topics: [],
                url: "https://github.com"
            }
        ];
    }

    /**
     * 渲染项目卡片
     */
    render() {
        if (!this.container) return;

        // 清空容器
        this.container.innerHTML = '';

        if (this.projects.length === 0) {
            this.projects = this.getDefaultProjects();
        }

        // 渲染每个项目
        this.projects.forEach(project => {
            const card = this.createProjectCard(project);
            this.container.appendChild(card);
        });
    }

    /**
     * 创建项目卡片（简化版）
     */
    createProjectCard(project) {
        const card = document.createElement('div');
        card.className = 'opensource-card';

        // 项目头部（名称和星标）
        const header = document.createElement('div');
        header.className = 'project-header';

        const name = document.createElement('h4');
        name.className = 'project-name';
        name.textContent = project.name;

        const stars = document.createElement('div');
        stars.className = 'project-stars';
        stars.innerHTML = `<i class="fas fa-star"></i> ${project.stars}`;

        header.appendChild(name);
        header.appendChild(stars);
        card.appendChild(header);

        // 仓库全名
        const fullName = document.createElement('div');
        fullName.className = 'project-repo';
        fullName.textContent = project.fullName;
        card.appendChild(fullName);

        // 描述
        const description = document.createElement('p');
        description.className = 'project-description';
        description.textContent = project.description;
        card.appendChild(description);

        // 技术标签（语言 + topics）
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'project-tags';

        // 主要语言
        if (project.language) {
            const langTag = document.createElement('span');
            langTag.className = 'project-tag';
            langTag.textContent = project.language;
            tagsContainer.appendChild(langTag);
        }

        // Topics (最多显示 3 个)
        const topics = project.topics.slice(0, 3);
        topics.forEach(topic => {
            const topicTag = document.createElement('span');
            topicTag.className = 'project-tag';
            topicTag.textContent = topic;
            tagsContainer.appendChild(topicTag);
        });

        if (tagsContainer.children.length > 0) {
            card.appendChild(tagsContainer);
        }

        // 链接
        const link = document.createElement('a');
        link.className = 'project-link';
        link.href = project.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.innerHTML = '<i class="fab fa-github"></i> 查看项目';
        card.appendChild(link);

        return card;
    }

    /**
     * 显示错误信息
     */
    showError() {
        if (!this.container) return;
        this.container.innerHTML = `
            <div style="text-align: center; color: #e67e80; padding: 20px;">
                <i class="fas fa-exclamation-triangle"></i> 加载失败
            </div>
        `;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OpenSourceProjects;
}
