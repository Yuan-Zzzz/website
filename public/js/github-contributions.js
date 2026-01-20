/**
 * GitHub Contributions Graph
 * 在主页显示GitHub提交热力图
 */

class GitHubContributions {
    constructor(username, containerId, options = {}) {
        this.username = username;
        this.container = document.getElementById(containerId);
        this.tooltip = null;
        this.contributions = [];
        this.token = options.token || null; // GitHub Personal Access Token
        this.includePrivate = options.includePrivate !== false; // 默认包含私有仓库
        this.currentYear = new Date().getFullYear(); // 当前选中的年份
        this.yearlyData = new Map(); // 存储各年份的数据
        this.startYear = 2020; // 开始年份，可以配置
    }

    /**
     * 初始化并渲染图表
     */
    async init() {
        try {
            await this.fetchContributions();
            this.setupYearSelector();
            this.renderGraph(this.currentYear);
            this.updateTotalCount();
        } catch (error) {
            console.error('Failed to load GitHub contributions:', error);
            this.showError();
        }
    }

    /**
     * 获取GitHub提交数据（多年数据）
     * 使用GitHub GraphQL API
     */
    async fetchContributions() {
        const currentYear = new Date().getFullYear();
        
        this.allYearsData = [];
        this.contributions = [];
        let totalContributions = 0;

        try {
            // 如果没有提供 token，使用模拟数据
            if (!this.token) {
                console.warn('No GitHub token provided. Using mock data.');
                this.generateMockData();
                return;
            }

            // 获取每一年的数据
            for (let year = this.startYear; year <= currentYear; year++) {
                const yearData = await this.fetchYearContributions(year);
                if (yearData) {
                    this.yearlyData.set(year, yearData);
                    if (year === this.currentYear) {
                        this.contributions = yearData.contributions;
                        totalContributions = yearData.total;
                    }
                }
            }

            this.totalContributions = totalContributions;

        } catch (error) {
            console.warn('Error fetching from GitHub API, using mock data:', error);
            this.generateMockData();
        }
    }

    /**
     * 获取指定年份的提交数据
     */
    async fetchYearContributions(year) {
        const from = `${year}-01-01T00:00:00Z`;
        const to = `${year}-12-31T23:59:59Z`;
        
        const query = `
            query($userName:String!, $from:DateTime!, $to:DateTime!) {
                user(login: $userName) {
                    contributionsCollection(from: $from, to: $to) {
                        contributionCalendar {
                            totalContributions
                            weeks {
                                contributionDays {
                                    contributionCount
                                    date
                                }
                            }
                        }
                    }
                }
            }
        `;

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };

        const response = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                query: query,
                variables: { 
                    userName: this.username,
                    from: from,
                    to: to
                }
            })
        });

        if (!response.ok) {
            console.warn(`Failed to fetch data for year ${year}`);
            return null;
        }

        const data = await response.json();
        
        if (data.errors || !data.data) {
            console.warn(`GitHub API returned errors for year ${year}`);
            return null;
        }

        const weeks = data.data.user.contributionsCollection.contributionCalendar.weeks;
        const contributions = weeks.flatMap(week => week.contributionDays);
        const total = data.data.user.contributionsCollection.contributionCalendar.totalContributions;

        return {
            year: year,
            contributions: contributions,
            total: total
        };
    }

    /**
     * 生成模拟数据（当API不可用时）
     */
    generateMockData() {
        // 为当前年份生成模拟数据
        const year = this.currentYear;
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        const contributions = [];
        let totalContributions = 0;
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const date = new Date(d);
            const isWeekday = date.getDay() > 0 && date.getDay() < 6;
            const baseChance = isWeekday ? 0.6 : 0.3;
            
            let count = 0;
            if (Math.random() < baseChance) {
                count = Math.floor(Math.random() * 15) + 1;
                if (Math.random() > 0.7) count = Math.floor(count / 2);
            }
            
            contributions.push({
                date: date.toISOString().split('T')[0],
                contributionCount: count
            });
            
            totalContributions += count;
        }

        this.yearlyData.set(year, {
            year: year,
            contributions: contributions,
            total: totalContributions
        });
        
        this.contributions = contributions;
        this.totalContributions = totalContributions;
    }

    /**
     * 设置年份选择器
     */
    setupYearSelector() {
        const selector = document.getElementById('year-selector');
        if (!selector) return;

        // 清空选项
        selector.innerHTML = '';

        // 添加所有年份选项
        const years = Array.from(this.yearlyData.keys()).sort((a, b) => b - a);
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = `${year}年`;
            if (year === this.currentYear) {
                option.selected = true;
            }
            selector.appendChild(option);
        });

        // 添加切换事件
        selector.addEventListener('change', (e) => {
            this.currentYear = parseInt(e.target.value);
            const yearData = this.yearlyData.get(this.currentYear);
            if (yearData) {
                this.contributions = yearData.contributions;
                this.totalContributions = yearData.total;
                this.renderGraph(this.currentYear);
                this.updateTotalCount();
            }
        });
    }

    /**
     * 渲染图表（只显示选中年份）
     */
    renderGraph(year) {
        // 清空容器
        this.container.innerHTML = '';

        // 创建tooltip
        this.createTooltip();

        // 获取年份数据
        const yearData = this.yearlyData.get(year);
        if (!yearData) {
            this.showError();
            return;
        }

        // 创建图表容器
        const graphWrapper = document.createElement('div');
        graphWrapper.className = 'graph-wrapper';

        // 添加星期标签
        const dayLabels = this.createDayLabels();
        graphWrapper.appendChild(dayLabels);

        // 创建图表主体
        const graphContainer = document.createElement('div');
        graphContainer.className = 'graph-container';

        const weeks = this.organizeByWeeks(yearData.contributions);

        weeks.forEach((week) => {
            const column = document.createElement('div');
            column.className = 'graph-column';

            week.forEach((day) => {
                const dayElement = document.createElement('div');
                dayElement.className = `contribution-day level-${this.getContributionLevel(day.contributionCount)}`;
                dayElement.dataset.date = day.date;
                dayElement.dataset.count = day.contributionCount;

                // 添加悬停事件
                if (day.date) {
                    dayElement.addEventListener('mouseenter', (e) => this.showTooltip(e, day));
                    dayElement.addEventListener('mouseleave', () => this.hideTooltip());
                }

                column.appendChild(dayElement);
            });

            graphContainer.appendChild(column);
        });

        graphWrapper.appendChild(graphContainer);
        this.container.appendChild(graphWrapper);
    }

    /**
     * 按周组织数据
     */
    organizeByWeeks(contributions = null) {
        const contribs = contributions || this.contributions;
        if (!contribs || contribs.length === 0) return [];
        
        const weeks = [];
        let currentWeek = [];
        
        // 确保从周日开始
        const firstDate = new Date(contribs[0].date);
        const firstDay = firstDate.getDay();
        
        // 补充第一周的空白天数
        for (let i = 0; i < firstDay; i++) {
            currentWeek.push({ date: '', contributionCount: 0 });
        }

        contribs.forEach((day, index) => {
            currentWeek.push(day);

            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        });

        // 添加最后一周
        if (currentWeek.length > 0) {
            // 补充剩余天数
            while (currentWeek.length < 7) {
                currentWeek.push({ date: '', contributionCount: 0 });
            }
            weeks.push(currentWeek);
        }

        return weeks;
    }

    /**
     * 创建星期标签
     */
    createDayLabels() {
        const container = document.createElement('div');
        container.className = 'day-labels';
        
        const days = ['', '周一', '', '周三', '', '周五', ''];
        days.forEach(day => {
            const label = document.createElement('div');
            label.className = 'day-label';
            label.textContent = day;
            container.appendChild(label);
        });

        return container;
    }

    /**
     * 根据提交次数返回等级 (0-4)
     */
    getContributionLevel(count) {
        if (count === 0) return 0;
        if (count <= 3) return 1;
        if (count <= 6) return 2;
        if (count <= 9) return 3;
        return 4;
    }

    /**
     * 创建tooltip
     */
    createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'contribution-tooltip';
        document.body.appendChild(this.tooltip);
    }

    /**
     * 显示tooltip
     */
    showTooltip(event, day) {
        if (!day.date) return;

        const date = new Date(day.date);
        const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
        
        this.tooltip.innerHTML = `
            <strong>${formattedDate}</strong><br>
            ${day.contributionCount} 次提交
        `;
        
        this.tooltip.style.display = 'block';
        
        // 定位tooltip
        const rect = event.target.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();
        
        let left = rect.left + window.scrollX + (rect.width / 2) - (tooltipRect.width / 2);
        let top = rect.top + window.scrollY - tooltipRect.height - 8;
        
        // 确保tooltip不会超出屏幕
        if (left < 0) left = 10;
        if (left + tooltipRect.width > window.innerWidth) {
            left = window.innerWidth - tooltipRect.width - 10;
        }
        if (top < 0) {
            top = rect.bottom + window.scrollY + 8;
        }
        
        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;
    }

    /**
     * 隐藏tooltip
     */
    hideTooltip() {
        this.tooltip.style.display = 'none';
    }

    /**
     * 更新总提交次数
     */
    updateTotalCount() {
        const countElement = document.getElementById('total-contributions');
        if (countElement) {
            // 添加数字动画效果
            this.animateCount(countElement, this.totalContributions || 0);
        }
    }

    /**
     * 数字动画
     */
    animateCount(element, target) {
        const duration = 1500; // 1.5秒
        const start = 0;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 使用缓动函数
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(start + (target - start) * easeOutQuart);
            
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = target.toLocaleString();
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * 显示错误信息
     */
    showError() {
        this.container.innerHTML = `
            <div style="text-align: center; color: #e67e80; padding: 40px;">
                <i class="fas fa-exclamation-triangle"></i> 加载失败，请稍后再试
            </div>
        `;
    }
}

// 导出供使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GitHubContributions;
}
