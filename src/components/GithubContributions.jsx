import React, { useState, useEffect, useRef } from 'react';
import Container from './ui/Container';
import Card from './ui/Card';

const GithubContributions = () => {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [contributions, setContributions] = useState([]);
    const [totalContributions, setTotalContributions] = useState(0);
    const [availableYears, setAvailableYears] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, text: '' });
    const tooltipRef = useRef(null);
    const yearlyDataCache = useRef(new Map());

    const username = 'Yuan-Zzzz';
    const startYear = 2020;
    // 支持 GITHUB_TOKEN 或 VITE_GITHUB_TOKEN
    const githubToken = import.meta.env.GITHUB_TOKEN || import.meta.env.VITE_GITHUB_TOKEN;

    // 获取贡献等级
    const getContributionLevel = (count) => {
        if (count === 0) return 0;
        if (count <= 3) return 1;
        if (count <= 6) return 2;
        if (count <= 9) return 3;
        return 4;
    };

    // 生成模拟数据（当API不可用时）
    const generateMockData = (year) => {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        const contributions = [];
        let total = 0;

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

            total += count;
        }

        return { contributions, total };
    };

    // 获取指定年份的贡献数据（使用GitHub GraphQL API）
    const fetchYearContributions = async (year) => {
        // 检查缓存
        if (yearlyDataCache.current.has(year)) {
            return yearlyDataCache.current.get(year);
        }

        // 如果没有token，返回错误
        if (!githubToken) {
            throw new Error('GitHub token not configured. Please set VITE_GITHUB_TOKEN in your .env file.');
        }

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
            'Authorization': `Bearer ${githubToken}`
        };

        try {
            const response = await fetch('https://api.github.com/graphql', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    query: query,
                    variables: { 
                        userName: username,
                        from: from,
                        to: to
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch data for year ${year}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.errors) {
                throw new Error(data.errors[0]?.message || `GitHub API returned errors for year ${year}`);
            }

            if (!data.data || !data.data.user) {
                throw new Error(`No data returned for user ${username}`);
            }

            const weeks = data.data.user.contributionsCollection.contributionCalendar.weeks;
            const contributions = weeks.flatMap(week => week.contributionDays);
            const total = data.data.user.contributionsCollection.contributionCalendar.totalContributions;

            const yearData = {
                year: year,
                contributions: contributions,
                total: total
            };

            // 缓存数据
            yearlyDataCache.current.set(year, yearData);
            
            return yearData;
        } catch (error) {
            console.error(`Error fetching GitHub data for year ${year}:`, error);
            throw error;
        }
    };

    // 加载贡献数据
    useEffect(() => {
        const loadContributions = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchYearContributions(selectedYear);
                setContributions(data.contributions);
                setTotalContributions(data.total);
            } catch (err) {
                console.error('Failed to load contributions:', err);
                setError(err.message || '加载贡献数据失败');
                setContributions([]);
                setTotalContributions(0);
            } finally {
                setLoading(false);
            }
        };

        loadContributions();
    }, [selectedYear]);

    // 初始化可用年份列表
    useEffect(() => {
        const currentYear = new Date().getFullYear();
        const years = [];
        // 只包含从startYear到当前年份（不包含未来年份）
        for (let year = startYear; year <= currentYear; year++) {
            years.push(year);
        }
        // 按降序排列（最新年份在前）
        setAvailableYears(years.reverse());
        // 确保默认选中的是当前年份
        setSelectedYear(currentYear);
    }, []);

    // 按周组织数据
    const organizeByWeeks = () => {
        if (!contributions || contributions.length === 0) return [];

        const weeks = [];
        let currentWeek = [];

        // 确保从周日开始
        const firstDate = new Date(contributions[0].date);
        const firstDay = firstDate.getDay();

        // 补充第一周的空白天数
        for (let i = 0; i < firstDay; i++) {
            currentWeek.push({ date: '', contributionCount: 0 });
        }

        contributions.forEach((day) => {
            currentWeek.push(day);

            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        });

        // 添加最后一周
        if (currentWeek.length > 0) {
            while (currentWeek.length < 7) {
                currentWeek.push({ date: '', contributionCount: 0 });
            }
            weeks.push(currentWeek);
        }

        return weeks;
    };

    // 显示tooltip
    const showTooltip = (e, day) => {
        if (!day.date) return;

        const date = new Date(day.date);
        const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
        const text = `${formattedDate}\n${day.contributionCount} 次提交`;

        const rect = e.target.getBoundingClientRect();
        setTooltip({
            show: true,
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
            text: text
        });
    };

    // 隐藏tooltip
    const hideTooltip = () => {
        setTooltip({ show: false, x: 0, y: 0, text: '' });
    };

    // 获取月份标签
    const getMonthLabels = () => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const labels = [];
        let lastMonth = -1;

        weeks.forEach((week, weekIndex) => {
            const firstDay = week.find(day => day.date);
            if (firstDay) {
                const date = new Date(firstDay.date);
                const month = date.getMonth();
                if (month !== lastMonth) {
                    labels.push({ month, weekIndex, label: months[month] });
                    lastMonth = month;
                }
            }
        });

        return labels;
    };

    const weeks = organizeByWeeks();
    const monthLabels = getMonthLabels();

    return (
        <section id="github" style={{ padding: '60px 0', backgroundColor: 'var(--bg-secondary)' }}>
            <Container>
                <h2 className="section-title">GitHub 开源贡献</h2>
                <Card style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)' }}>
                    {/* 头部：统计和年份选择器 */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                        flexWrap: 'wrap',
                        gap: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span style={{
                                fontSize: '2rem',
                                fontWeight: 'bold',
                                color: 'var(--primary-color)'
                            }}>
                                {totalContributions.toLocaleString()}
                            </span>
                            <span style={{ fontSize: '1rem', color: 'var(--text-dim)' }}>次提交</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                style={{
                                    backgroundColor: 'var(--bg-color)',
                                    color: 'var(--text-color)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    padding: '8px 32px 8px 12px',
                                    fontSize: '1rem',
                                    fontFamily: 'inherit',
                                    cursor: 'pointer',
                                    appearance: 'none',
                                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23d3c6aa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 8px center',
                                    backgroundSize: '16px'
                                }}
                            >
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}年</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <a
                                href={`https://github.com/${username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: 'var(--secondary-color)',
                                    textDecoration: 'none',
                                    fontSize: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <i className="fab fa-github"></i> 访问我的 GitHub
                            </a>
                        </div>
                    </div>

                    {/* 贡献图表 */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                            加载中...
                        </div>
                    ) : error ? (
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '40px', 
                            color: 'var(--text-dim)',
                            backgroundColor: 'var(--bg-color)',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <p style={{ marginBottom: '12px', color: '#e67e80' }}>
                                <i className="fas fa-exclamation-triangle"></i> {error}
                            </p>
                            <p style={{ fontSize: '0.9rem', margin: 0 }}>
                                请检查是否已配置 VITE_GITHUB_TOKEN 环境变量
                            </p>
                        </div>
                    ) : (
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            width: '100%'
                        }}>
                            {/* 月份标签容器 - 与图表主体对齐 */}
                            <div style={{
                                display: 'flex',
                                marginBottom: '4px',
                                fontSize: '0.75rem',
                                color: 'var(--text-dim)',
                                position: 'relative',
                                height: '16px',
                                width: 'fit-content',
                                marginLeft: '30px' // 与星期标签宽度对齐
                            }}>
                                {monthLabels.map((label, idx) => {
                                    const weekWidth = 12 + 3; // blockSize + gap
                                    const leftOffset = label.weekIndex * weekWidth;
                                    return (
                                        <span
                                            key={`${label.month}-${label.weekIndex}`}
                                            style={{
                                                position: 'absolute',
                                                left: `${leftOffset}px`,
                                                minWidth: '30px',
                                                textAlign: 'left'
                                            }}
                                        >
                                            {label.label}
                                        </span>
                                    );
                                })}
                            </div>

                            {/* 图表主体 */}
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'flex-start',
                                justifyContent: 'center',
                                width: '100%'
                            }}>
                                {/* 星期标签 */}
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '3px',
                                    marginRight: '6px',
                                    fontSize: '0.7rem',
                                    color: 'var(--text-dim)',
                                    justifyContent: 'space-around',
                                    minWidth: '24px'
                                }}>
                                    {['', '周一', '', '周三', '', '周五', ''].map((day, idx) => (
                                        <div key={idx} style={{ height: '12px', lineHeight: '12px' }}>
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* 贡献格子 */}
                                <div style={{ 
                                    display: 'flex', 
                                    gap: '3px', 
                                    flexWrap: 'nowrap'
                                }}>
                                    {weeks.map((week, weekIdx) => (
                                        <div key={weekIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                            {week.map((day, dayIdx) => {
                                                const level = getContributionLevel(day.contributionCount);
                                                const isEmpty = level === 0;
                                                
                                                return (
                                                    <div
                                                        key={dayIdx}
                                                        className={`contribution-day level-${level} ${isEmpty ? 'empty' : ''}`}
                                                        style={{
                                                            width: '12px',
                                                            height: '12px',
                                                            borderRadius: '2px',
                                                            transition: 'all 0.2s ease',
                                                            cursor: day.date ? 'pointer' : 'default',
                                                            backgroundColor: isEmpty ? 'transparent' : undefined,
                                                            border: isEmpty ? '1px solid var(--border-color)' : 'none',
                                                            position: 'relative'
                                                        }}
                                                        onMouseEnter={(e) => day.date && showTooltip(e, day)}
                                                        onMouseLeave={hideTooltip}
                                                        title={day.date ? `${day.date}: ${day.contributionCount} 次提交` : ''}
                                                    />
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 图例 */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                marginTop: '16px',
                                fontSize: '0.85rem',
                                color: 'var(--text-dim)',
                                width: '100%'
                            }}>
                                <span>Less</span>
                                <div style={{ display: 'flex', gap: '3px' }}>
                                    {[0, 1, 2, 3, 4].map(level => {
                                        const isEmpty = level === 0;
                                        return (
                                            <div
                                                key={level}
                                                className={`legend-box level-${level} ${isEmpty ? 'empty' : ''}`}
                                                style={{
                                                    width: '12px',
                                                    height: '12px',
                                                    borderRadius: '2px',
                                                    backgroundColor: isEmpty ? 'transparent' : undefined,
                                                    border: isEmpty ? '1px solid var(--border-color)' : 'none'
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                                <span>More</span>
                            </div>
                        </div>
                    )}

                    {/* Tooltip */}
                    {tooltip.show && (
                        <div
                            ref={tooltipRef}
                            style={{
                                position: 'fixed',
                                left: `${tooltip.x}px`,
                                top: `${tooltip.y}px`,
                                transform: 'translate(-50%, -100%)',
                                backgroundColor: 'var(--bg-color)',
                                color: 'var(--text-color)',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                pointerEvents: 'none',
                                zIndex: 1000,
                                whiteSpace: 'pre-line',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                border: '1px solid var(--border-color)',
                                marginBottom: '8px'
                            }}
                        >
                            {tooltip.text}
                        </div>
                    )}
                </Card>
            </Container>

            <style>{`
                .contribution-day.level-0.empty {
                    background-color: transparent !important;
                    border: 1px solid var(--border-color) !important;
                }
                
                .contribution-day.level-1 {
                    background-color: #7fbbb3;
                }
                
                .contribution-day.level-2 {
                    background-color: #83c092;
                }
                
                .contribution-day.level-3 {
                    background-color: #a7c080;
                }
                
                .contribution-day.level-4 {
                    background-color: #dbbc7f;
                }
                
                .contribution-day:hover {
                    transform: scale(1.3);
                    border: 1px solid var(--text-color) !important;
                    z-index: 10;
                }
                
                .legend-box.level-0.empty {
                    background-color: transparent !important;
                    border: 1px solid var(--border-color) !important;
                }
                
                .legend-box.level-1 {
                    background-color: #7fbbb3;
                }
                
                .legend-box.level-2 {
                    background-color: #83c092;
                }
                
                .legend-box.level-3 {
                    background-color: #a7c080;
                }
                
                .legend-box.level-4 {
                    background-color: #dbbc7f;
                }
            `}</style>
        </section>
    );
};

export default GithubContributions;
