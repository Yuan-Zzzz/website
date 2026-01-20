import React from 'react';
import Container from './ui/Container';
import Card from './ui/Card';

const About = () => {
    return (
        <section id="about" style={{ padding: '60px 0' }}>
            <Container>
                <h2 className="section-title">关于我</h2>
                <Card>
                    <p style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
                        成都某废物大四学生，目前就职于上海某游戏公司，兼职开发独立游戏，主要使用C#(Unity/Godot/MonoGame)，Steam新作火热开发中。你可以在本网站的游戏作品和博客中了解到我开发的游戏、技术或思考，我会在上面分享我的开发经验和一些不务正业的东西。如果你有任何想与我交流的内容，欢迎随时联系我！
                    </p>
                </Card>
            </Container>
        </section>
    );
};

export default About;
