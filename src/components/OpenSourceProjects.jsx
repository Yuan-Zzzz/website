import React, { useEffect, useState } from 'react';
import Container from './ui/Container';
import Card from './ui/Card';
import Button from './ui/Button';

const OpenSourceProjects = () => {
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        fetch('/js/opensource-projects.json')
            .then(res => res.json())
            .then(async (repoUrls) => {
                try {
                    const projectPromises = repoUrls.map(async (url) => {
                        // Extract owner and repo from URL
                        // Support both full URLs and "owner/repo" strings
                        let owner, repo;
                        if (url.startsWith('http')) {
                            const parts = url.split('/');
                            owner = parts[parts.length - 2];
                            repo = parts[parts.length - 1];
                        } else {
                            [owner, repo] = url.split('/');
                        }

                        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
                        if (!response.ok) return null;
                        const data = await response.json();

                        return {
                            name: data.name,
                            description: data.description || 'No description available',
                            stars: data.stargazers_count,
                            forks: data.forks_count,
                            url: data.html_url
                        };
                    });

                    const results = await Promise.all(projectPromises);
                    setProjects(results.filter(p => p !== null));
                } catch (err) {
                    console.error('Error fetching GitHub data:', err);
                }
            })
            .catch(err => console.error('Error loading open source projects:', err));
    }, []);

    if (projects.length === 0) return null;

    return (
        <section id="opensource" style={{ padding: '60px 0' }}>
            <Container>
                <h3 className="section-title" style={{ fontSize: '1.5rem' }}>开源项目</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                    {projects.map(project => (
                        <Card key={project.name} variant="secondary" style={{ display: 'flex', flexDirection: 'column' }}>
                            <h4 style={{ fontSize: '1.2rem', marginBottom: '10px', color: 'var(--secondary-color)' }}>{project.name}</h4>
                            <p style={{ flex: 1, marginBottom: '20px', color: 'var(--text-dim)' }}>{project.description}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '0.9rem' }}>
                                    <i className="fas fa-star" style={{ color: 'var(--accent-color)' }}></i> {project.stars}
                                    <span style={{ margin: '0 10px' }}>|</span>
                                    <i className="fas fa-code-branch" style={{ color: 'var(--primary-color)' }}></i> {project.forks}
                                </div>
                                <a href={project.url} target="_blank" rel="noopener noreferrer">
                                    <Button variant="secondary" style={{ fontSize: '0.7rem', padding: '5px 10px' }}>查看代码</Button>
                                </a>
                            </div>
                        </Card>
                    ))}
                </div>
            </Container>
        </section>
    );
};

export default OpenSourceProjects;
