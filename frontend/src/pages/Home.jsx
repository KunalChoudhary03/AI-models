import React from 'react';
import '../styles/theme.css';
import Navbar from '../components/Navbar';

const Home = () => {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <div className="content-container">
          <section className="hero-section">
            <h1 className="hero-title">Welcome to ChatGPT Clone</h1>
            <p className="hero-subtitle">
              Experience the power of AI-driven conversations with our advanced chatbot platform
            </p>
          </section>

          <div className="features-grid">
            <div className="feature-card">
              <h2 className="feature-title">Natural Conversations</h2>
              <p className="feature-description">
                Engage in fluid, context-aware conversations that feel natural and intuitive
              </p>
            </div>

            <div className="feature-card">
              <h2 className="feature-title">Smart Responses</h2>
              <p className="feature-description">
                Get intelligent, relevant responses powered by advanced AI technology
              </p>
            </div>

            <div className="feature-card">
              <h2 className="feature-title">24/7 Availability</h2>
              <p className="feature-description">
                Access the chatbot anytime, anywhere, with consistent performance
              </p>
            </div>

            <div className="feature-card">
              <h2 className="feature-title">Customizable Experience</h2>
              <p className="feature-description">
                Personalize your interaction preferences and choose between light and dark themes
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;