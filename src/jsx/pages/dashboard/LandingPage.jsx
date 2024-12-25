import React, { useEffect } from "react";
import "./market.css";
import logoFull from "../../../assets/images/white.png";
import heroImage from "../../../assets/images/bg.png";
import aboutImage from "../../../assets/images/why-us.png";
import team1 from "../../../assets/images/team-1.jpg";
import team2 from "../../../assets/images/team-2.jpeg";
import { useNavigate } from "react-router-dom";
import FAQSection from "./faqs";
import CalendlyPopup from "./CalendlyWidget";
const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStartedClick = () => {
    navigate("/login"); // Navigate to the login page
  };

  return (
    <div className="landing-page">
      {/* Header Section */}
      <header className="header">
        <div className="logo">
          <img src={logoFull} alt="Colombus Capital Logo" />
        </div>
        <nav className="navigation">
          <ul>
            <li>
              <a href="#hero">Home</a>
            </li>
            <li>
              <a href="#about">About Us</a>
            </li>
            <li>
              <a href="#services">Our Services</a>
            </li>
            <li>
              <a href="#team">Team</a>
            </li>
          </ul>
        </nav>
      </header>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text" data-aos="fade-right">
            <h1>Your trusted partner in FX transactions </h1>
            <div className="animated-text">
              <h5 className="animated-item">Transparent FX Execution.</h5>
              <h5 className="animated-item">Innovative FX Strategies.</h5>
              <h5 className="animated-item">Seamless Risk Management.</h5>
            </div>
            <p>
              Empowering businesses with innovative, tech-driven FX solutions
              for sustainable growth.
            </p>
            <button className="cta-button" onClick={handleGetStartedClick}>
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* services Section */}
      <section id="services" className="services-section">
        <div className="container">
          <h2 className="section-title">Our Services</h2>
          <br />
          <div className="services-grid">
            <div className="service-item">
              <i className="fas fa-tags service-icon"></i>
              <h3 className="service-title">Transparent Pricing</h3>
              <p className="service-description">
                Full visibility on costs, helping you save on every transaction.
              </p>
            </div>

            <div className="service-item">
              <i className="fas fa-user-plus service-icon"></i>
              <h3 className="service-title">Express Onboarding</h3>
              <p className="service-description">
                Smooth and swift onboarding to get you up and running quickly.
              </p>
            </div>

            <div className="service-item">
              <i className="fas fa-robot service-icon"></i>
              <h3 className="service-title">FX Workflow Automation</h3>
              <p className="service-description">
                Automate the FX workflow from risk assessment to execution.
              </p>
            </div>

            <div className="service-item">
              <i className="fas fa-chart-line service-icon"></i>
              <h3 className="service-title">Custom Solutions</h3>
              <p className="service-description">
                Tailored solutions resonating with diverse business sectors.
              </p>
            </div>

            <div className="service-item">
              <i className="fas fa-cogs service-icon"></i>
              <h3 className="service-title">Seamless Integration</h3>
              <p className="service-description">
                Integrate seamlessly with existing systems and workflows.
              </p>
            </div>

            <div className="service-item">
              <i className="fas fa-tachometer-alt service-icon"></i>
              <h3 className="service-title">Best Execution</h3>
              <p className="service-description">
                Achieve competitive rates and exceptional execution quality.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* About Section */}
      <section id="about" className="about-section">
        <div className="about-header" data-aos="fade-down">
          <h2>About Us</h2>
        </div>

        <div className="about-content">
          {/* Text Section */}
          <div className="about-text" data-aos="fade-right">
            <p>
              At <strong>Colombus Capital</strong>, we specialize in delivering
              innovative FX strategies that empower emerging markets. Through
              strategic partnerships, ethical practices, and cutting-edge
              solutions, we drive sustainable growth and enhance communities
              worldwide.
            </p>
            <ul className="about-list">
              <li>
                <i className="fas fa-check-circle"></i> Upholding the highest
                standards in every transaction{" "}
              </li>
              <li>
                <i className="fas fa-check-circle"></i>leveraging technology to
                overcome complex FX challenges
              </li>
              <li>
                <i className="fas fa-check-circle"></i> Supporting businesses
                across diverse industries.
              </li>
            </ul>
          </div>

          {/* Image Section */}
          <div className="about-image-container" data-aos="fade-left">
            <img
              src={aboutImage}
              alt="Why Choose Colombus Capital"
              className="about-image"
            />
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="why-us" className="why-us-section">
        <div className="why-header" data-aos="fade-down">
          <h2>Why Choose Us</h2>
          <p className="subheading">
            Colombus Capital stands apart with our expertise and client-first
            approach.
          </p>
        </div>

        <div className="why-grid" data-aos="fade-up">
          <div className="why-item">
            <div className="why-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <h3>Data-Driven Strategies</h3>
            <p>Our actions are guided by facts, not guesswork.</p>
          </div>
          <div className="why-item">
            <div className="why-icon">
              <i className="fas fa-user-tie"></i>
            </div>
            <h3>Decades of Expertise</h3>
            <p>40+ years of combined experience in FX risk management.</p>
          </div>
          <div className="why-item">
            <div className="why-icon">
              <i className="fas fa-handshake"></i>
            </div>
            <h3>Client-Centric Approach</h3>
            <p>We work exclusively for your benefit with zero conflicts.</p>
          </div>
          <div className="why-item">
            <div className="why-icon">
              <i className="fas fa-globe"></i>
            </div>
            <h3>Global Impact</h3>
            <p>Empowering businesses worldwide to create sustainable growth.</p>
          </div>
        </div>
      </section>
      <section id="team" className="team-section">
        <div className="team-header" data-aos="fade-down">
          <h2>Meet Our Team</h2>
          <p>
            40+ years of combined experience in FX risk management, investment,
            and finance.
          </p>
          <CalendlyPopup />
        </div>

        <div className="timeline-container">
          <div className="timeline-item" data-aos="fade-right">
            <div className="timeline-image-left">
              <img src={team1} alt="Eymen Errais" className="team-image" />
            </div>
            <div className="timeline-content-right">
              <h3>Eymen Errais</h3>
              <p>
                <strong>
                  +15 years of experience in investment and banking.
                </strong>
                PhD from Stanford University in Management Science &
                Engineering. FRM Certified.
              </p>
            </div>
          </div>
          <div className="timeline-item" data-aos="fade-left">
            <div className="timeline-content-left">
              <h3>Mezri ElKaroui</h3>
              <p>
                <strong>FX trader with over 15 years in finance.</strong>
                <br />
                Experience at Citibank, Tradition UK, HSBC, Generali Investment,
                AXA, and GDF Suez.
              </p>
            </div>
            <div className="timeline-image-right">
              <img src={team2} alt="Mezri ElKaroui" className="team-image" />
            </div>
          </div>
        </div>
      </section>

      <FAQSection />
      {/* Footer */}
      <footer className="footer">
        <p>© 2024 Colombus Capital. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
