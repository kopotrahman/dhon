import React, { useState, useEffect } from 'react';
import { supportAPI } from '../../utils/api';
import './Support.css';

const FAQ = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const categories = [
    { value: '', label: 'All' },
    { value: 'general', label: 'General' },
    { value: 'booking', label: 'Booking' },
    { value: 'payment', label: 'Payment' },
    { value: 'driver', label: 'Driver' },
    { value: 'owner', label: 'Owner' },
    { value: 'marketplace', label: 'Marketplace' },
    { value: 'technical', label: 'Technical' }
  ];

  useEffect(() => {
    fetchFAQs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, searchTerm]);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (activeCategory) params.category = activeCategory;
      if (searchTerm) params.search = searchTerm;
      
      const response = await supportAPI.getFAQs(params);
      setFaqs(response.data);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFaq = (id) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  return (
    <div className="faq-container">
      <div className="faq-search">
        <input
          type="text"
          placeholder="Search FAQs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search FAQs"
        />
      </div>

      <div className="faq-categories">
        {categories.map(cat => (
          <button
            key={cat.value}
            className={`category-btn ${activeCategory === cat.value ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading FAQs...</div>
      ) : faqs.length === 0 ? (
        <div className="no-faqs">
          <p>No FAQs found. Try a different search or category.</p>
        </div>
      ) : (
        <div className="faq-list" role="list">
          {faqs.map(faq => (
            <div 
              key={faq._id} 
              className={`faq-item ${openFaq === faq._id ? 'open' : ''}`}
              role="listitem"
            >
              <button
                className="faq-question"
                onClick={() => toggleFaq(faq._id)}
                aria-expanded={openFaq === faq._id}
              >
                <span className="faq-category-badge">{faq.category}</span>
                <span className="question-text">{faq.question}</span>
                <span className="faq-toggle">{openFaq === faq._id ? '−' : '+'}</span>
              </button>
              {openFaq === faq._id && (
                <div className="faq-answer" role="region">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FAQ;
