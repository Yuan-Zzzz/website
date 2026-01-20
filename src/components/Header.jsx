import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Container from './ui/Container';
import Button from './ui/Button';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <header style={{
            borderBottom: 'var(--border-width) solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            position: 'sticky',
            top: 0,
            zIndex: 100
        }}>
            <Container style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px' }}>
                <div className="site-title">
                    <Link to="/" style={{
                        fontFamily: 'var(--font-pixel)',
                        fontSize: '1.5rem',
                        color: 'var(--primary-color)',
                        textDecoration: 'none',
                        textShadow: '2px 2px 0px var(--secondary-color)'
                    }}>
                        YUAN
                    </Link>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="mobile-menu-toggle"
                    onClick={toggleMenu}
                    style={{
                        display: 'none', // Hidden on desktop by default, need media query in CSS
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        flexDirection: 'column',
                        gap: '5px'
                    }}
                >
                    <span style={{ display: 'block', width: '25px', height: '3px', backgroundColor: 'var(--text-color)' }}></span>
                    <span style={{ display: 'block', width: '25px', height: '3px', backgroundColor: 'var(--text-color)' }}></span>
                    <span style={{ display: 'block', width: '25px', height: '3px', backgroundColor: 'var(--text-color)' }}></span>
                </button>

                <nav className={isMenuOpen ? 'active' : ''} style={{ display: 'flex', gap: '20px' }}>
                    <Link to="/#about" style={{ color: 'var(--text-color)' }}>关于我</Link>
                    <Link to="/#projects" style={{ color: 'var(--text-color)' }}>游戏作品</Link>
                    <Link to="/blog" style={{ color: 'var(--text-color)' }}>博客</Link>
                    <Link to="/#contact" style={{ color: 'var(--text-color)' }}>联系方式</Link>
                </nav>
            </Container>

            {/* Mobile Menu Styles (Inline for now, better in CSS) */}
            <style>{`
        @media (max-width: 768px) {
          .mobile-menu-toggle {
            display: flex !important;
          }
          nav {
            display: none !important;
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            background-color: var(--bg-secondary);
            flex-direction: column;
            padding: 20px;
            border-bottom: var(--border-width) solid var(--border-color);
          }
          nav.active {
            display: flex !important;
          }
        }
      `}</style>
        </header>
    );
};

export default Header;
