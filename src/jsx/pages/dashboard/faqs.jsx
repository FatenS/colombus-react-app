import React, { useState } from "react";
import "./market.css";

const faqs = [
  {
    question: "What is FXaaS and how does it work?",
    answer:
      "FXaaS (Foreign Exchange as a Service) is a subscription-based service that provides transparent FX execution and third-party TCA oversight.",
  },
  {
    question: "How does FXaaS save costs?",
    answer:
      "FXaaS saves costs by offering transparent pricing and preferential FX rates from top-tier counterparties.",
  },
  {
    question: "What makes Colombus Capital different?",
    answer:
      "Colombus Capital stands out with its independence, transparency, and technology-driven approach to FX execution.",
  },
  {
    question: "What is Transaction Cost Analysis (TCA)?",
    answer:
      "TCA is a method for evaluating the execution quality of FX trades to ensure best execution and cost efficiency.",
  },
  {
    question: "Can Colombus Capital integrate with our systems?",
    answer:
      "Yes, Colombus Capital offers seamless integration with your existing treasury and payment systems.",
  },
];

const FAQSection = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section id="faq" className="faq-section">
      <div className="container">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <div className="faq-container">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`faq-item ${activeIndex === index ? "active" : ""}`}
            >
              <button className="faq-question" onClick={() => toggleFAQ(index)}>
                {faq.question}
                <i
                  className={`fas fa-plus toggle-icon ${
                    activeIndex === index ? "active" : ""
                  }`}
                ></i>
              </button>
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
