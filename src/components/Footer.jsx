import React from 'react';
import Container from './ui/Container';

const Footer = () => {
    return (
        <footer style={{
            borderTop: 'var(--border-width) solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            padding: '20px 0',
            marginTop: '40px',
            textAlign: 'center',
            fontSize: '0.9rem',
            color: 'var(--text-dim)'
        }}>
            <Container>
                <div className="beian-info" style={{ marginBottom: '10px' }}>
                    <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-dim)' }}>
                        蜀ICP备2025153878号
                    </a>
                </div>
                <p>&copy; 2025 Yuan. All Rights Reserved.</p>
            </Container>
        </footer>
    );
};

export default Footer;
