import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import FAQ from './FAQ';
import TicketList from './TicketList';
import Chat from './Chat';
import './Support.css';

const SupportPage = () => {
  const [activeTab, setActiveTab] = useState('faq');

  return (
    <div className="support-container">
      <div className="support-header">
        <h1>🎧 Support Center</h1>
        <p>Get help with your questions and issues</p>
      </div>

      <div className="support-tabs" role="tablist">
        <button 
          role="tab"
          aria-selected={activeTab === 'faq'}
          className={`tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
          onClick={() => setActiveTab('faq')}
        >
          📚 FAQ
        </button>
        <button 
          role="tab"
          aria-selected={activeTab === 'tickets'}
          className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          🎫 My Tickets
        </button>
        <button 
          role="tab"
          aria-selected={activeTab === 'chat'}
          className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          💬 Messages
        </button>
      </div>

      <div className="support-content" role="tabpanel">
        {activeTab === 'faq' && <FAQ />}
        {activeTab === 'tickets' && <TicketList />}
        {activeTab === 'chat' && <Chat />}
      </div>

      <div className="support-cta">
        <div className="cta-card">
          <h3>Need more help?</h3>
          <p>Create a support ticket and our team will get back to you.</p>
          <Link to="/support/tickets/new" className="btn-create-ticket">
            Create Support Ticket
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
