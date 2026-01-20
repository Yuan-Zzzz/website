import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import About from '../components/About';
import Contact from '../components/Contact';
import GameProjects from '../components/GameProjects';
import BlogSection from '../components/BlogSection';
import GithubContributions from '../components/GithubContributions';
import OpenSourceProjects from '../components/OpenSourceProjects';

const Home = () => {
    return (
        <div className="home-page">
            <div className="crt-overlay"></div>
            <Header />
            <main>
                <Hero />
                <About />
                <GithubContributions />
                <OpenSourceProjects />
                <GameProjects />
                <BlogSection />
                <Contact />
            </main>
            <Footer />
        </div>
    );
};

export default Home;
