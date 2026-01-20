import React from 'react';
import Container from './ui/Container';

const Hero = () => {
    return (
        <section id="hero" style={{
            padding: '100px 0',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <Container>
                <h1 style={{
                    fontSize: '3rem',
                    marginBottom: '20px',
                    textShadow: '4px 4px 0px var(--secondary-color)'
                }}>
                    你好，我是Yuan
                </h1>
                <p style={{
                    fontSize: '1.5rem',
                    color: 'var(--text-dim)',
                    fontFamily: 'var(--font-pixel)'
                }}>
                    游戏开发者，以及厨子
                </p>
            </Container>
        </section>
    );
};

export default Hero;
