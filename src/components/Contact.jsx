import React from 'react';
import Container from './ui/Container';

const Contact = () => {
    return (
        <section id="contact" style={{ padding: '60px 0' }}>
            <Container>
                <h2 className="section-title">联系方式</h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', fontSize: '2rem' }}>
                    <a href="https://space.bilibili.com/36801082?spm_id_from=333.1007.0.0" target="_blank" rel="noopener noreferrer" aria-label="Bilibili">
                        <i className="fab fa-bilibili"></i>
                    </a>
                    <a href="https://github.com/Yuan-Zzzz" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                        <i className="fab fa-github"></i>
                    </a>
                    <a href="mailto:1729726526@qq.com" aria-label="Email">
                        <i className="fas fa-envelope"></i>
                    </a>
                    <a href="#" target="_blank" aria-label="WeChat">
                        <i className="fab fa-weixin"></i>
                    </a>
                    <a href="#" target="_blank" aria-label="QQ">
                        <i className="fab fa-qq"></i>
                    </a>
                </div>
            </Container>
        </section>
    );
};

export default Contact;
