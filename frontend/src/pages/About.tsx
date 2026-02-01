import './About.css';

const About = () => {
  return (
    <div className="about-page">
      <div className="about-container">
        <div className="about-hero">
          <span className="about-icon">⚡</span>
          <h1 className="about-title">About Techverse</h1>
          <p className="about-subtitle">
            A modern platform for developers to share insights, tutorials, and experiences
          </p>
        </div>

        <div className="about-content">
          <section className="about-section">
            <h2>Our Mission</h2>
            <p>
              Techverse is built for developers, by developers. We believe in creating a space
              where technical knowledge flows freely, where insights are shared, and where the
              community grows together.
            </p>
          </section>

          <section className="about-section">
            <h2>What We Offer</h2>
            <div className="features-grid">
              <div className="feature-card">
                <span className="feature-icon">✍️</span>
                <h3>Write & Share</h3>
                <p>Create beautiful technical articles with our markdown-powered editor</p>
              </div>
              <div className="feature-card">
                <span className="feature-icon">🎨</span>
                <h3>Modern Design</h3>
                <p>Enjoy a sleek, dark-themed interface designed for long reading sessions</p>
              </div>
              <div className="feature-card">
                <span className="feature-icon">🚀</span>
                <h3>Fast & Secure</h3>
                <p>Built with modern technologies for speed, security, and reliability</p>
              </div>
              <div className="feature-card">
                <span className="feature-icon">👥</span>
                <h3>Community</h3>
                <p>Connect with fellow developers and grow your technical network</p>
              </div>
            </div>
          </section>

          <section className="about-section">
            <h2>Technology Stack</h2>
            <p>
              Techverse is powered by cutting-edge technologies including React, TypeScript,
              FastAPI, and modern CSS. We prioritize performance, accessibility, and user experience
              in everything we build.
            </p>
          </section>

          <section className="about-section cta-section">
            <h2>Join the Community</h2>
            <p>
              Start sharing your knowledge and insights with developers worldwide.
            </p>
            <div className="cta-buttons">
              <a href="/signup" className="btn btn-primary">Create Account</a>
              <a href="/posts" className="btn btn-secondary">Browse Posts</a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;
